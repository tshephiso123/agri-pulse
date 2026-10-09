import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackend } from '../server/index.mjs';
const lockChains = new Map();
Object.defineProperty(navigator, 'locks', { value: { request: (name, task) => { const next = (lockChains.get(name) || Promise.resolve()).then(task); lockChains.set(name, next.catch(() => {})); return next; } }, configurable: true });
globalThis.CustomEvent ??= class extends Event { constructor(type, init) { super(type); this.detail = init?.detail; } };
const { db } = await import('../src/db/schema.js');
const { openVault, vaultInfo, saveLog, readLogs, deleteLog, lockVault, exportLocal, restoreLocal, readCloudRecord } = await import('../src/security/vault.js');
const { drainQueue, retryDelay, resolveCloudConflict, fetchCloudRecord } = await import('../src/sync/engine.js');
const { encrypt } = await import('../src/security/crypto.js');
const passphrase = 'offline encryption passphrase';
const nativeFetch = fetch;
async function reset() { lockVault(); await db.delete(); await db.open(); }
async function cloud(t) {
  const backend = createBackend({ databasePath: ':memory:', rateLimit: 10000 });
  await new Promise(resolve => backend.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + backend.server.address().port;
  const register = await nativeFetch(base + '/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AgriPulse-Request': '1' }, body: JSON.stringify({ email: 'test@example.com', password: 'server-password-123', vault: await vaultInfo() }) });
  const result = await register.json(); assert.equal(register.status, 200);
  const cookie = register.headers.get('set-cookie').split(';')[0];
  const send = (path, options = {}) => nativeFetch(base + path, { ...options, headers: { ...options.headers, Cookie: cookie } });
  globalThis.fetch = send;
  await db.settings.put({ id: 'account', value: { ...result.user, vaultId: result.vault.id } });
  t.after(() => { globalThis.fetch = nativeFetch; backend.close(); });
  return { send, result };
}
test('legacy migration, local-only saves, locking and backup recovery', async () => {
  await reset();
  await db.logs.add({ activity: 'Legacy planting', notes: 'PRIVATE_NOTE', category: 'planting', createdAt: 100, synced: false });
  await db.syncQueue.add({ payload: { notes: 'PRIVATE_NOTE' } });
  await openVault(passphrase);
  assert.equal(await db.logs.count(), 0); assert.equal(await db.syncQueue.count(), 0); assert.equal(await db.mutations.count(), 0);
  assert.equal((await readLogs())[0].notes, 'PRIVATE_NOTE');
  await saveLog({ activity: 'Local harvest', notes: 'PRIVATE_NOTE', category: 'harvest' }, 'local');
  assert.equal(await db.mutations.count(), 0);
  assert.ok(!JSON.stringify(await db.encryptedLogs.toArray()).includes('PRIVATE_NOTE'));
  const backup = await exportLocal(); lockVault(); assert.deepEqual(await readLogs(), []);
  await assert.rejects(openVault('incorrect passphrase'));
  await reset(); await restoreLocal(backup, passphrase); assert.equal((await readLogs()).length, 2);
});
test('FIFO edits, acknowledgement loss, persistent retry and consent withdrawal', async t => {
  await reset(); await openVault(passphrase); const { send } = await cloud(t);
  await saveLog({ activity: 'First', notes: 'SECRET', category: 'planting' }, 'cloud');
  const id = (await readLogs())[0].id;
  await saveLog({ activity: 'Second', notes: 'SECRET_2', category: 'planting' }, 'cloud', id);
  let lost = false; const requests = [];
  globalThis.fetch = async (path, options) => {
    if (options.method === 'POST') requests.push(JSON.parse(options.body));
    const response = await send(path, options);
    if (options.method === 'POST' && !lost) { lost = true; throw new Error('Acknowledgement lost'); }
    return response;
  };
  await assert.rejects(drainQueue());
  let queue = await db.mutations.toArray(); assert.equal(queue.length, 2); assert.equal(queue[0].sent, true); assert.ok(queue[0].nextAttempt > Date.now());
  const firstPayload = queue[0].payload;
  await db.close(); await db.open();
  await saveLog({ activity: 'Stay private', notes: 'LOCAL_SECRET', category: 'planting' }, 'local', id);
  queue = await db.mutations.toArray(); assert.equal(queue.length, 2); assert.deepEqual(queue[0].payload, firstPayload); assert.equal(queue[1].payload.operation, 'delete');
  await db.mutations.update(queue[0].id, { nextAttempt: 0 });
  await drainQueue();
  assert.deepEqual(requests[0], requests[1]); assert.equal(requests[2].operation, 'delete'); assert.equal(requests[2].baseVersion, 1);
  assert.equal(await db.mutations.count(), 0); const local = (await readLogs())[0]; assert.equal(local.activity, 'Stay private'); assert.equal(local.removingCloud, false);
  const cloudRecords = await (await send('/api/v1/sync')).json(); assert.equal(cloudRecords.records[0].deleted, true); assert.equal(cloudRecords.records[0].envelope, null);
});
test('successive edits update server versions and cloud deletion is acknowledged', async t => {
  await reset(); await openVault(passphrase); await cloud(t);
  await saveLog({ activity: 'First edit', category: 'planting' }, 'cloud'); const id = (await readLogs())[0].id;
  await saveLog({ activity: 'Second edit', category: 'planting' }, 'cloud', id);
  await saveLog({ activity: 'Third edit', category: 'planting' }, 'cloud', id);
  await drainQueue(); assert.equal((await readLogs())[0].version, 3); assert.equal((await readLogs())[0].synced, true);
  await deleteLog(id); assert.equal((await readLogs()).length, 0); assert.equal(await db.mutations.count(), 1);
  await drainQueue(); assert.equal(await db.encryptedLogs.count(), 0); assert.equal(await db.mutations.count(), 0);
});
test('conflict pauses FIFO and reviewed choices preserve the intended version', async t => {
  await reset(); await openVault(passphrase); const { send } = await cloud(t);
  await saveLog({ activity: 'Original', category: 'planting' }, 'cloud'); await drainQueue();
  const id = (await readLogs())[0].id; const vault = await vaultInfo();
  const { unlockVault } = await import('../src/security/crypto.js'); const key = await unlockVault(passphrase, vault);
  const remote = { mutationId: crypto.randomUUID(), recordId: id, vaultId: vault.id, sharing: 'cloud', baseVersion: 1, operation: 'upsert', envelope: await encrypt(key, vault.id, id, { activity: 'Other device', category: 'harvest', createdAt: 100 }) };
  assert.equal((await send('/api/v1/sync', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AgriPulse-Request': '1' }, body: JSON.stringify(remote) })).status, 200);
  await saveLog({ activity: 'Local edit', category: 'planting' }, 'cloud', id); await drainQueue();
  assert.equal((await db.mutations.toArray())[0].status, 'blocked'); assert.equal((await readLogs())[0].activity, 'Local edit');
  await resolveCloudConflict(id); await drainQueue(); assert.equal((await readLogs())[0].activity, 'Other device'); assert.equal(await db.mutations.count(), 0);
  await assert.rejects(saveLog({ activity: 'Stale editor', category: 'planting' }, 'cloud', id, 1), /changed while you were editing/);
  assert.equal((await readLogs())[0].activity, 'Other device');
  await saveLog({ activity: 'Phone merged version', notes: 'MERGED_NOTE', category: 'planting' }, 'cloud', id, 2);
  const anotherWrite = { ...remote, mutationId: crypto.randomUUID(), baseVersion: 2, envelope: await encrypt(key, vault.id, id, { activity: 'New remote version', category: 'harvest', createdAt: 100 }) };
  assert.equal((await send('/api/v1/sync', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AgriPulse-Request': '1' }, body: JSON.stringify(anotherWrite) })).status, 200);
  await drainQueue(); const reviewed = await readCloudRecord(await fetchCloudRecord(id));
  assert.equal(reviewed.activity, 'New remote version'); assert.equal(reviewed.version, 3);
  await assert.rejects(resolveCloudConflict(id, 'local', 2), /changed again/);
  await resolveCloudConflict(id, 'local', reviewed.version); await drainQueue();
  assert.equal((await readLogs())[0].notes, 'MERGED_NOTE'); assert.equal((await readLogs())[0].version, 4);
});
test('401 pauses without losing mutations; 429 honors Retry-After and validation blocks', async t => {
  await reset(); await openVault(passphrase); const { send } = await cloud(t);
  await saveLog({ activity: 'Pending', category: 'planting' }, 'cloud');
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Login required' }), { status: 401 });
  await drainQueue(); assert.equal(await db.mutations.count(), 1); assert.equal((await db.mutations.toArray())[0].status, 'pending');
  globalThis.fetch = async (path, options) => path === '/api/v1/me' ? send(path, options) : new Response(JSON.stringify({ error: 'Limited' }), { status: 429, headers: { 'Retry-After': '60' } });
  await assert.rejects(drainQueue()); let row = (await db.mutations.toArray())[0]; assert.ok(row.nextAttempt >= Date.now() + 59000);
  await db.mutations.update(row.id, { nextAttempt: 0 });
  globalThis.fetch = async (path, options) => path === '/api/v1/me' ? send(path, options) : new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  await drainQueue(); row = (await db.mutations.toArray())[0]; assert.equal(row.status, 'blocked');
  globalThis.fetch = send;
  assert.equal(retryDelay(2, null, () => 0), 2000); assert.equal(retryDelay(100, null, () => 1), 300000); assert.equal(retryDelay(1, '60', () => 0), 60000);
});



test('identity checks respect persistent backoff without transmitting a mutation', async t => {
  await reset(); await openVault(passphrase); await cloud(t);
  await saveLog({ activity: 'Offline queue', category: 'planting' }, 'cloud');
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ error: 'Limited' }), { status: 429, headers: { 'Retry-After': '60' } }); };
  await assert.rejects(drainQueue());
  const row = (await db.mutations.toArray())[0]; assert.equal(row.sent, false); assert.ok(row.nextAttempt >= Date.now() + 59000);
  await assert.rejects(drainQueue()); assert.equal(calls, 1);
});
test('restored local records retain content while their previous cloud copies are removed', async t => {
  await reset(); await openVault(passphrase); const { send, result } = await cloud(t);
  await saveLog({ activity: 'Backup entry', notes: 'LOCAL_BACKUP_NOTE', category: 'planting' }, 'cloud'); await drainQueue();
  const backup = await exportLocal(); await reset(); await restoreLocal(backup, passphrase);
  await db.settings.put({ id: 'account', value: { ...result.user, vaultId: result.vault.id } });
  await assert.rejects(drainQueue()); assert.equal(await db.mutations.count(), 1); assert.equal((await db.settings.get('syncStatus')).value, 'Cloud removal queued.');
  await drainQueue(); assert.equal((await readLogs())[0].notes, 'LOCAL_BACKUP_NOTE'); assert.equal((await readLogs())[0].removingCloud, false);
  const remote = await (await send('/api/v1/sync')).json(); assert.equal(remote.records[0].deleted, true);
});

test('local saves and withdrawal proceed while a network acknowledgement is stalled', async t => {
  await reset(); await openVault(passphrase); const { send } = await cloud(t);
  await saveLog({ activity: 'Initially shared', category: 'planting' }, 'cloud'); const id = (await readLogs())[0].id;
  let signalStarted; let release;
  const started = new Promise(resolve => { signalStarted = resolve; });
  const held = new Promise(resolve => { release = resolve; });
  let first = true;
  globalThis.fetch = async (path, options) => {
    const response = await send(path, options);
    if (options?.method === 'POST' && first) { first = false; signalStarted(); await held; }
    return response;
  };
  const syncing = drainQueue(); let timeout;
  try {
    await started;
    await Promise.race([
      (async () => {
        await saveLog({ activity: 'Private while offline', notes: 'PRIVATE_INFLIGHT_NOTE', category: 'planting' }, 'local', id);
        await saveLog({ activity: 'Immediate new entry', category: 'harvest' }, 'local');
      })(),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('A local save waited for the network acknowledgement.')), 2000); })
    ]);
    assert.equal((await readLogs()).length, 2); assert.equal(await db.mutations.count(), 2);
  } finally { clearTimeout(timeout); release(); await syncing; }
  assert.equal((await readLogs()).find(row => row.id === id).notes, 'PRIVATE_INFLIGHT_NOTE');
  assert.equal(await db.mutations.count(), 0);
  const remote = await (await send('/api/v1/sync')).json(); assert.equal(remote.records[0].deleted, true);
});
