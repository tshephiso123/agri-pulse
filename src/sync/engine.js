import { db, exclusive } from '../db/schema.js';

export async function api(path, options = {}) {
  const response = await fetch(path, { ...options, credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-AgriPulse-Request': '1', ...options.headers }, signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed.'), { status: response.status, retryAfter: response.headers.get('Retry-After') });
  return data;
}

export function retryDelay(attempt, retryAfter, random = Math.random, now = Date.now()) {
  const seconds = Number(retryAfter);
  const headerDelay = retryAfter == null ? 0 : Number.isFinite(seconds) ? seconds * 1000 : Math.max(0, Date.parse(retryAfter) - now) || 0;
  return Math.max(headerDelay, Math.round(Math.min(300000, 1000 * 2 ** Math.min(attempt, 12)) * (0.5 + random() * 0.5)));
}

const status = value => db.settings.put({ id: 'syncStatus', value });
export async function registerBackgroundSync() {
  try {
    if (!globalThis.navigator?.serviceWorker) return;
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.sync) await registration.sync.register('agripulse-sync');
  } catch { /* Foreground launch, online and manual sync remain available. */ }
}

export async function drainQueue() {
  return exclusive(async () => {
    const vault = (await db.settings.get('vault'))?.value;
    const account = (await db.settings.get('account'))?.value;

    if (!vault || !account || account.vaultId !== vault.id) {
      await status('Sign in to enable cloud sync.');
      return;
    }

    const head = await db.mutations.orderBy('id').first();
    if (head?.status === 'blocked') {
      await status(head.error); return;
    }

    if (head?.nextAttempt > Date.now()) throw new Error('Waiting to retry.');
    try {
      const identity = await api('/api/v1/me');
      if (identity.vault.id !== vault.id) {
        await status('Signed-in account does not match this vault.');
        return;
      }
    } catch (error) {
      await status(error.status === 401 ? 'Session expired. Sign in again to sync.' : 'Could not verify cloud account.');
      if (error.status === 401) return;
      if (head && (!error.status || error.status === 429 || error.status >= 500)) await db.mutations.update(head.id, { attempts: head.attempts + 1, nextAttempt: Date.now() + retryDelay(head.attempts + 1, error.retryAfter) });
      throw error;
    }

    while (true) {
      const item = await exclusive(async () => {
        const next = await db.mutations.orderBy('id').first();
        if (next && next.status !== 'blocked' && next.nextAttempt <= Date.now()) await db.mutations.update(next.id, { sent: true });
        return next;
      });
      if (!item) break;
      if (item.vaultId !== vault.id) throw new Error('Queue belongs to another vault.');
      if (item.status === 'blocked') { await status(item.error); return; }
      if (item.nextAttempt > Date.now()) throw new Error('Waiting to retry.');
      let ack;
      try { ack = await api(item.endpoint, { method: item.method, body: JSON.stringify(item.payload) }); }
      catch (error) {
        if (error.status === 401) { await status('Session expired. Sign in again to sync.'); return; }
        if (error.status && error.status !== 429 && error.status < 500) {
          const message = error.status === 409 ? 'Sync conflict. Review the record before continuing.' : error.message;
          await db.mutations.update(item.id, { status: 'blocked', error: message }); await status(message); return;
        }
        await db.mutations.update(item.id, { attempts: item.attempts + 1, nextAttempt: Date.now() + retryDelay(item.attempts + 1, error.retryAfter) });
        await status('Connection failed. Encrypted changes are queued.'); throw error;
      }
      if (ack.id !== item.recordId || !Number.isSafeInteger(ack.version) || ack.version <= item.payload.baseVersion || typeof ack.updatedAt !== 'string') throw new Error('Invalid sync acknowledgement.');
      await exclusive(() => db.transaction('rw', db.mutations, db.encryptedLogs, async () => {
        await db.mutations.delete(item.id);
        const later = await db.mutations.where('recordId').equals(item.recordId).toArray();
        for (const queued of later) if (!queued.sent) await db.mutations.update(queued.id, { payload: { ...queued.payload, baseVersion: ack.version } });
        const row = await db.encryptedLogs.get(item.recordId);
        if (row) {
          if (ack.deleted && row.hidden && later.length === 0) await db.encryptedLogs.delete(row.id);
          else await db.encryptedLogs.update(row.id, { version: ack.version, updatedAt: ack.updatedAt, synced: later.length === 0 && row.sharing === 'cloud' && !ack.deleted, removingCloud: ack.deleted ? false : row.removingCloud });
        }
      }));
    }
    await pull(vault.id);
    if (await db.mutations.count()) { await status('Cloud removal queued.'); throw new Error('Cloud removal requires another sync attempt.'); }
    await status('Cloud sync complete.');
  }, 'agripulse-sync');
}
async function pull(vaultId) {
  let cursor = (await db.settings.get('cursor'))?.value || 0;
  while (true) {
    let page;
    try { page = await api('/api/v1/sync?cursor=' + cursor); }
    catch (error) { await status(error.status === 401 ? 'Session expired. Sign in again to sync.' : 'Could not download cloud changes.'); throw error; }
    if (page.vaultId !== vaultId) throw new Error('Signed-in account does not match this vault.');
    await exclusive(() => db.transaction('rw', db.encryptedLogs, db.mutations, db.settings, async () => {
      for (const record of page.records) {
        if (await db.mutations.where('recordId').equals(record.id).count()) throw new Error('Pending record must be resolved before downloading.');
        const local = await db.encryptedLogs.get(record.id);
        if (record.deleted) {
          if (local?.sharing === 'local') await db.encryptedLogs.update(record.id, { version: record.version, removingCloud: false, updatedAt: record.updatedAt });
          else await db.encryptedLogs.delete(record.id);
        } else if (local?.sharing === 'local') {
          // Restored/local-only records never silently regain sharing consent.
          await db.encryptedLogs.update(record.id, { version: record.version, removingCloud: true });
          await db.mutations.add({ recordId: record.id, vaultId, endpoint: '/api/v1/sync', method: 'POST', attempts: 0, nextAttempt: 0, status: 'pending', sent: false, payload: { mutationId: crypto.randomUUID(), recordId: record.id, vaultId, baseVersion: record.version, operation: 'delete', sharing: 'cloud' } });
        } else await db.encryptedLogs.put({ id: record.id, vaultId, createdAt: local?.createdAt || Date.parse(record.updatedAt), envelope: record.envelope, sharing: 'cloud', version: record.version, updatedAt: record.updatedAt, synced: true });
      }
      await db.settings.put({ id: 'cursor', value: page.nextCursor });
    }));
    cursor = page.nextCursor;
    if (!page.hasMore) break;
  }
}
export async function fetchCloudRecord(recordId) {
  const snapshot = await api('/api/v1/me/export'); const vault = (await db.settings.get('vault'))?.value;
  if (snapshot.vault.id !== vault.id) throw new Error('Account does not match vault.');
  return snapshot.records.find(row => row.id === recordId);
}
export async function resolveCloudConflict(recordId, choice = 'cloud', expectedVersion) {
  await exclusive(async () => {
    const snapshot = await api('/api/v1/me/export');
    const vault = (await db.settings.get('vault'))?.value;
    if (snapshot.vault.id !== vault.id) throw new Error('Account does not match vault.');
    const remote = snapshot.records.find(row => row.id === recordId);
    if (expectedVersion !== undefined && (remote?.version || 0) !== expectedVersion) throw new Error('The cloud record changed again. Review the latest copy before choosing.');
    await exclusive(() => db.transaction('rw', db.mutations, db.encryptedLogs, async () => {
      const local = await db.encryptedLogs.get(recordId);
      const queued = await db.mutations.where('recordId').equals(recordId).toArray();
      await db.mutations.bulkDelete(queued.map(row => row.id));
      if (local?.sharing === 'local' || local?.hidden) {
        if (remote && !remote.deleted) {
          await db.encryptedLogs.update(recordId, { version: remote.version, removingCloud: true });
          await db.mutations.add({ recordId, vaultId: vault.id, endpoint: '/api/v1/sync', method: 'POST', attempts: 0, nextAttempt: 0, status: 'pending', sent: false, payload: { mutationId: crypto.randomUUID(), recordId, vaultId: vault.id, baseVersion: remote.version, operation: 'delete', sharing: 'cloud' } });
        } else if (local?.hidden) await db.encryptedLogs.delete(recordId);
        else await db.encryptedLogs.update(recordId, { version: remote?.version || 0, removingCloud: false });
      } else if (choice === 'local' && local) {
        const version = remote?.version || 0;
        await db.encryptedLogs.update(recordId, { version, synced: false });
        await db.mutations.add({ recordId, vaultId: vault.id, endpoint: '/api/v1/sync', method: 'POST', attempts: 0, nextAttempt: 0, status: 'pending', sent: false, payload: { mutationId: crypto.randomUUID(), recordId, vaultId: vault.id, baseVersion: version, operation: 'upsert', sharing: 'cloud', envelope: local.envelope } });
      } else if (!remote || remote.deleted) await db.encryptedLogs.delete(recordId);
      else await db.encryptedLogs.put({ id: recordId, vaultId: vault.id, createdAt: Date.parse(remote.updatedAt), envelope: remote.envelope, sharing: 'cloud', synced: true, version: remote.version, updatedAt: remote.updatedAt });
    }));
  }, 'agripulse-sync');
}
let syncInFlight;

export function requestSync() {
  if (syncInFlight) return syncInFlight;
  syncInFlight = (async () => {
    await registerBackgroundSync();
    try { 
      await drainQueue(); 
    } catch { /* Status is persisted; retry on the next trigger. */ }
    globalThis.dispatchEvent?.(new Event('agripulse-change'));
  })().finally(() => { syncInFlight = undefined; });
  return syncInFlight;
}
