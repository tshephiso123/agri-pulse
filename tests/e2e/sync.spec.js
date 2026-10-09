import { test, expect } from './helpers/fixtures';
import { unlockVault, encrypt, decrypt } from '../../src/security/crypto.js';
const passphrase = 'farmer encryption recovery phrase';
const password = 'different-account-password-123';
import { openRecords, openVault, saveEntry, editEntry, registerAccount, pendingStatus } from './helpers/logbook';
import { primary, back } from './helpers/calculator';
const unlock = (page, create=false) => openVault(page,passphrase,create);
const save = (page,activity,local=true) => saveEntry(page,activity,'PRIVATE_FARM_NOTE_'+activity,local);
const register = (page,email) => registerAccount(page,email,passphrase,password);

test('offline persistence, encrypted upload, cloud removal and passphrase recovery', async ({ page, context, browser }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const syncPayloads = []; page.on('request', request => { if (request.url().endsWith('/api/v1/sync') && request.method() === 'POST') syncPayloads.push(request.postData()); });
  await openRecords(page);
  await unlock(page, true); await save(page, 'Private planting');
  const email = 'farmer-' + crypto.randomUUID() + '@example.com'; await register(page, email);
  let remote = await (await context.request.get('/api/v1/me/export')).json(); expect(remote.records).toHaveLength(0);
  await save(page, 'Shared harvest', false);
  await expect(page.locator('article').filter({ hasText: 'Shared harvest' }).getByText(/Synced$/)).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })); });
  await context.setOffline(true); await save(page, 'Offline edit', false);
  await pendingStatus(page);
  await page.reload(); await page.locator('.tool-nav button').nth(2).click(); await unlock(page);
  await expect(page.locator('article').filter({ hasText: 'Offline edit' })).toBeVisible();
  await context.setOffline(false);
  await expect(page.locator('article').filter({ hasText: 'Offline edit' }).getByText(/Synced$/)).toBeVisible({ timeout: 30000 });
  const stored = await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('AgriPulseDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => { const database = request.result; const read = database.transaction('encryptedLogs').objectStore('encryptedLogs').getAll(); read.onsuccess = () => { resolve(read.result); database.close(); }; };
  }));
  expect(JSON.stringify(stored)).not.toContain('PRIVATE_FARM_NOTE'); expect(syncPayloads.length).toBeGreaterThan(0);
  expect(syncPayloads.join('')).not.toContain('PRIVATE_FARM_NOTE'); expect(syncPayloads.join('')).not.toContain(passphrase);
  const shared = page.locator('article').filter({hasText:'Shared harvest'});await editEntry(page,'Shared harvest');await saveEntry(page,'Shared harvest','PRIVATE_FARM_NOTE_Shared harvest',true,true);await expect(shared).toContainText('Keep my records on this phone only');
  remote = await (await context.request.get('/api/v1/me/export')).json(); expect(remote.records.filter(row => row.deleted)).toHaveLength(1);
  const other = await browser.newContext(); const otherPage = await other.newPage();
  await openRecords(otherPage,new URL('/',page.url()).href);await primary(otherPage).click();
  await otherPage.getByText('Optional cloud account', { exact: true }).click();
  await otherPage.getByLabel('Encryption passphrase', { exact: true }).fill(passphrase);
  await otherPage.getByLabel('Email', { exact: true }).fill(email);
  await otherPage.getByLabel('Account password (at least 12 characters)', { exact: true }).fill(password);
  await otherPage.getByRole('button', { name: 'Sign in', exact: true }).click();
  await back(otherPage).click();await back(otherPage).click();await expect(otherPage.locator('article').filter({ hasText: 'Offline edit' })).toBeVisible();
  await otherPage.locator('article').filter({hasText:'Offline edit'}).locator('button').click();await expect(otherPage.getByText('PRIVATE_FARM_NOTE_Offline edit')).toBeVisible();
  await expect(otherPage.locator('article').filter({ hasText: 'Private planting' })).toHaveCount(0);
  await expect(otherPage.locator('article').filter({ hasText: 'Shared harvest' })).toHaveCount(0);
  await otherPage.locator('article').filter({hasText:'Offline edit'}).locator('button').click();await expect(otherPage.getByText('PRIVATE_FARM_NOTE_Offline edit')).toBeVisible();
  await other.close(); expect(errors).toEqual([]);
});
test('service worker drains encrypted queue after the page closes', async ({ page, context }) => {
  await openRecords(page);
  await unlock(page, true); await register(page, 'worker-' + crypto.randomUUID() + '@example.com');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await context.setOffline(true); await save(page, 'Background planting', false); await pendingStatus(page);
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
  await openRecords(page);
  await unlock(page, true); await register(page, 'conflict-' + crypto.randomUUID() + '@example.com');
  await save(page, 'Original entry', false);
  const article = page.locator('article').filter({ hasText: 'Original entry' }); await expect(article.getByText(/Synced$/)).toBeVisible();
  const snapshot = await (await context.request.get('/api/v1/me/export')).json(); const record = snapshot.records[0];
  const key = await unlockVault(passphrase, snapshot.vault);
  await context.setOffline(true);await editEntry(page,'Original entry');await saveEntry(page,'Phone merged entry','Merged phone content',false,true);
  const remote = await context.request.post('/api/v1/sync', { headers: { 'X-AgriPulse-Request': '1' }, data: { mutationId: crypto.randomUUID(), recordId: record.id, vaultId: snapshot.vault.id, sharing: 'cloud', baseVersion: record.version, operation: 'upsert', envelope: await encrypt(key, snapshot.vault.id, record.id, { activity: 'Remote harvest', notes: 'Other device notes', category: 'harvest', createdAt: 100 }) } });
  expect(remote.status()).toBe(200); await context.setOffline(false);
  await page.getByRole('button',{name:/Review cloud copy/}).click({timeout:30000});await primary(page).click();
  await expect(page.getByText('Remote harvest', { exact: true })).toBeVisible(); await expect(page.getByText('Other device notes', { exact: true })).toBeVisible();
  await page.getByRole('radio',{name:'Keep current phone version',exact:true}).check();page.once('dialog',dialog=>dialog.accept());await primary(page).click();
  await expect(page.locator('article').filter({ hasText: 'Phone merged entry' }).getByText(/Synced$/)).toBeVisible();
  const final = await (await context.request.get('/api/v1/me/export')).json(); expect(final.records[0].version).toBe(3);
  expect((await decrypt(key, snapshot.vault.id, record.id, final.records[0].envelope)).notes).toBe('Merged phone content');
});

