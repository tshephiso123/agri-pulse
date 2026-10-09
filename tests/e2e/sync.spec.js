import { test, expect } from '@playwright/test';
import { unlockVault, encrypt, decrypt } from '../../src/security/crypto.js';
const passphrase = 'farmer encryption recovery phrase';
const password = 'different-account-password-123';
async function unlock(page, create = false) {
  await page.getByLabel('Encryption passphrase', { exact: true }).fill(passphrase);
  if (create) await page.getByLabel('Confirm new passphrase').fill(passphrase);
  await page.getByRole('button', { name: create ? 'Create local vault' : 'Unlock offline', exact: true }).click();
  await expect(page.getByText('Logbook unlocked', { exact: true })).toBeVisible();
}
async function save(page, activity, local = true) {
  await page.getByLabel('Activity', { exact: true }).fill(activity);
  await page.getByLabel('Notes', { exact: true }).fill('PRIVATE_FARM_NOTE_' + activity);
  await page.getByRole('checkbox', { name: /Local-Only/ }).setChecked(local);
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await expect(page.locator('article').filter({ hasText: activity })).toBeVisible();
}
async function register(page, email) {
  await page.getByText('Optional cloud account', { exact: true }).click();
  await page.getByLabel('Encryption passphrase', { exact: true }).fill(passphrase);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Account password (at least 12 characters)', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Register this vault', exact: true }).click();
  await expect(page.getByText('Signed in. Only records you choose to share will upload.', { exact: true })).toBeVisible();
}
test('offline persistence, encrypted upload, cloud removal and passphrase recovery', async ({ page, context, browser }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const syncPayloads = []; page.on('request', request => { if (request.url().endsWith('/api/v1/sync') && request.method() === 'POST') syncPayloads.push(request.postData()); });
  await page.goto('/'); await page.getByRole('button', { name: 'Farm Logbook', exact: true }).click();
  await unlock(page, true); await save(page, 'Private planting');
  const email = 'farmer-' + crypto.randomUUID() + '@example.com'; await register(page, email);
  let remote = await (await context.request.get('/api/v1/me/export')).json(); expect(remote.records).toHaveLength(0);
  await save(page, 'Shared harvest', false);
  await expect(page.locator('article').filter({ hasText: 'Shared harvest' }).getByText(/Synced$/)).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })); });
  await context.setOffline(true); await save(page, 'Offline edit', false);
  await expect(page.getByText(/1 pending/)).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Farm Logbook', exact: true }).click(); await unlock(page);
  await expect(page.locator('article').filter({ hasText: 'Offline edit' })).toBeVisible();
  await context.setOffline(false);
  await expect(page.locator('article').filter({ hasText: 'Offline edit' }).getByText(/Synced$/)).toBeVisible({ timeout: 30000 });
  const stored = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('AgriPulseDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => { const database = request.result; const read = database.transaction('encryptedLogs').objectStore('encryptedLogs').getAll(); read.onsuccess = () => { resolve(read.result); database.close(); }; };
  }));
  expect(JSON.stringify(stored)).not.toContain('PRIVATE_FARM_NOTE'); expect(syncPayloads.length).toBeGreaterThan(0);
  expect(syncPayloads.join('')).not.toContain('PRIVATE_FARM_NOTE'); expect(syncPayloads.join('')).not.toContain(passphrase);
  const shared = page.locator('article').filter({ hasText: 'Shared harvest' }); await shared.getByRole('button', { name: 'Edit entry' }).click();
  await page.getByRole('checkbox', { name: /Local-Only/ }).check(); await page.getByRole('button', { name: 'Update entry' }).click();
  await expect(shared.getByText(/Local-Only$/)).toBeVisible();
  remote = await (await context.request.get('/api/v1/me/export')).json(); expect(remote.records.filter(row => row.deleted)).toHaveLength(1);
  const other = await browser.newContext(); const otherPage = await other.newPage();
  await otherPage.goto('http://127.0.0.1:4184/'); await otherPage.getByRole('button', { name: 'Farm Logbook', exact: true }).click();
  await otherPage.getByText('Optional cloud account', { exact: true }).click();
  await otherPage.getByLabel('Encryption passphrase', { exact: true }).fill(passphrase);
  await otherPage.getByLabel('Email', { exact: true }).fill(email);
  await otherPage.getByLabel('Account password (at least 12 characters)', { exact: true }).fill(password);
  await otherPage.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(otherPage.locator('article').filter({ hasText: 'Offline edit' })).toBeVisible();
  await expect(otherPage.getByText('PRIVATE_FARM_NOTE_Offline edit')).toBeVisible();
  await expect(otherPage.locator('article').filter({ hasText: 'Private planting' })).toHaveCount(0);
  await expect(otherPage.locator('article').filter({ hasText: 'Shared harvest' })).toHaveCount(0);
  await other.close(); expect(errors).toEqual([]);
});
test('service worker drains encrypted queue after the page closes', async ({ page, context }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Farm Logbook', exact: true }).click();
  await unlock(page, true); await register(page, 'worker-' + crypto.randomUUID() + '@example.com');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await context.setOffline(true); await save(page, 'Background planting', false); await expect(page.getByText(/1 pending/)).toBeVisible();
  const worker = context.serviceWorkers()[0]; expect(worker).toBeTruthy(); await page.close(); await context.setOffline(false);
  await expect.poll(async () => {
    try {
      await worker.evaluate(async () => {
        const event = new Event('sync'); event.tag = 'agripulse-sync'; let work;
        event.waitUntil = promise => { work = promise; }; self.dispatchEvent(event); await work;
      });
      return true;
    } catch { return false; }
  }, { timeout: 15000 }).toBe(true);
  const response = await context.request.get('/api/v1/me/export'); const snapshot = await response.json();
  expect(snapshot.records.filter(row => !row.deleted)).toHaveLength(1);
  expect(JSON.stringify(snapshot)).not.toContain('PRIVATE_FARM_NOTE');
});

test('farmers review a conflict and explicitly keep merged phone content', async ({ page, context }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Farm Logbook', exact: true }).click();
  await unlock(page, true); await register(page, 'conflict-' + crypto.randomUUID() + '@example.com');
  await save(page, 'Original entry', false);
  const article = page.locator('article').filter({ hasText: 'Original entry' }); await expect(article.getByText(/Synced$/)).toBeVisible();
  const snapshot = await (await context.request.get('/api/v1/me/export')).json(); const record = snapshot.records[0];
  const key = await unlockVault(passphrase, snapshot.vault);
  await context.setOffline(true); await article.getByRole('button', { name: 'Edit entry' }).click();
  await page.getByLabel('Activity', { exact: true }).fill('Phone merged entry');
  await page.getByLabel('Notes', { exact: true }).fill('Merged phone content');
  await page.getByRole('button', { name: 'Update entry', exact: true }).click();
  await expect(page.locator('article').filter({ hasText: 'Phone merged entry' })).toBeVisible();
  const remote = await context.request.post('/api/v1/sync', { headers: { 'X-AgriPulse-Request': '1' }, data: { mutationId: crypto.randomUUID(), recordId: record.id, vaultId: snapshot.vault.id, sharing: 'cloud', baseVersion: record.version, operation: 'upsert', envelope: await encrypt(key, snapshot.vault.id, record.id, { activity: 'Remote harvest', notes: 'Other device notes', category: 'harvest', createdAt: 100 }) } });
  expect(remote.status()).toBe(200); await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Review cloud copy', exact: true })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Review cloud copy', exact: true }).click();
  await expect(page.getByText('Remote harvest', { exact: true })).toBeVisible(); await expect(page.getByText('Other device notes', { exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Keep current phone version', exact: true }).click();
  await expect(page.locator('article').filter({ hasText: 'Phone merged entry' }).getByText(/Synced$/)).toBeVisible();
  const final = await (await context.request.get('/api/v1/me/export')).json(); expect(final.records[0].version).toBe(3);
  expect((await decrypt(key, snapshot.vault.id, record.id, final.records[0].envelope)).notes).toBe('Merged phone content');
});
