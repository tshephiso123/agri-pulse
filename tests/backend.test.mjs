import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackend } from '../server/index.mjs';
import { createVault, encrypt, decrypt, unlockVault } from '../src/security/crypto.js';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
const passphrase = 'a long farmer recovery phrase';
const setup = async (path = ':memory:', production = false) => {
  const backend = createBackend({ databasePath: path, publicOrigin: production ? 'https://farm.example' : 'http://localhost:4173', production, rateLimit: 10000 });
  await new Promise(resolve => backend.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + backend.server.address().port;
  const call = async (path, method = 'GET', data, cookie, headers = {}) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-AgriPulse-Request': '1', ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(data ? { body: JSON.stringify(data) } : {}) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
  };
  return { ...backend, call };
};
async function register(server, email = 'farmer@example.com') {
  const { vault, key } = await createVault(passphrase);
  const response = await server.call('/api/v1/auth/register', 'POST', { email, password: 'account-password-123', vault });
  assert.equal(response.status, 200); return { ...response, vault, key };
}
function mutation(vault, recordId, envelope, baseVersion = 0) { return { mutationId: crypto.randomUUID(), recordId, vaultId: vault.id, operation: 'upsert', sharing: 'cloud', baseVersion, envelope }; }
test('passphrase vault authenticates identity, tampering and wrong passphrases', async () => {
  const { vault, key } = await createVault(passphrase);
  const id = crypto.randomUUID(); const data = { notes: 'Private farmer note' };
  const first = await encrypt(key, vault.id, id, data); const second = await encrypt(key, vault.id, id, data);
  assert.notEqual(first.iv, second.iv); assert.equal(key.extractable, false);
  assert.deepEqual(await decrypt(await unlockVault(passphrase, vault), vault.id, id, first), data);
  await assert.rejects(unlockVault('incorrect passphrase', vault));
  await assert.rejects(decrypt(key, vault.id, crypto.randomUUID(), first));
  await assert.rejects(decrypt(key, vault.id, id, { ...first, ciphertext: second.ciphertext }));
  assert.ok(!JSON.stringify(vault).includes(passphrase));
});
test('server enforces ownership, encrypted payloads, versioning, CSRF, export and deletion', async t => {
  const server = await setup(); t.after(() => server.close());
  const alice = await register(server); const bob = await register(server, 'other@example.com');
  const id = crypto.randomUUID(); const envelope = await encrypt(alice.key, alice.vault.id, id, { notes: 'Secrets' });
  const write = mutation(alice.vault, id, envelope);
  assert.equal((await server.call('/api/v1/sync', 'POST', write)).status, 401);
  assert.equal((await server.call('/api/v1/sync', 'POST', write, bob.cookie)).status, 400);
  assert.equal((await server.call('/api/v1/sync', 'POST', { ...write, envelope: { notes: 'plaintext' } }, alice.cookie)).status, 400);
  assert.equal((await server.call('/api/v1/sync', 'POST', { ...write, sharing: 'local' }, alice.cookie)).status, 400);
  assert.equal((await server.call('/api/v1/sync', 'POST', write, alice.cookie, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await server.call('/api/v1/sync', 'POST', write, alice.cookie, { 'X-AgriPulse-Request': '' })).status, 403);
  const ack = await server.call('/api/v1/sync', 'POST', write, alice.cookie); assert.equal(ack.status, 200); assert.equal(ack.data.version, 1); assert.ok(ack.data.updatedAt);
  assert.deepEqual((await server.call('/api/v1/sync', 'POST', write, alice.cookie)).data, ack.data);
  assert.equal((await server.call('/api/v1/sync', 'POST', { ...write, baseVersion: 1 }, alice.cookie)).status, 409);
  assert.equal((await server.call('/api/v1/sync', 'POST', { ...write, mutationId: crypto.randomUUID() }, alice.cookie)).status, 409);
  assert.equal((await server.call('/api/v1/sync', 'GET', undefined, bob.cookie)).data.records.length, 0);
  assert.equal((await server.call('/api/v1/me/export', 'GET', undefined, alice.cookie)).data.records[0].envelope.ciphertext, envelope.ciphertext);
  const remove = { ...write, mutationId: crypto.randomUUID(), operation: 'delete', baseVersion: 1 }; delete remove.envelope;
  const deleted = await server.call('/api/v1/sync', 'POST', remove, alice.cookie); assert.equal(deleted.data.version, 2);
  const pull = await server.call('/api/v1/sync?cursor=' + ack.data.sequence, 'GET', undefined, alice.cookie);
  assert.equal(pull.data.records[0].deleted, true); assert.equal(pull.data.records[0].envelope, null);
  assert.equal((await server.call('/api/v1/me', 'DELETE', { password: 'wrong' }, alice.cookie)).status, 401);
  assert.equal((await server.call('/api/v1/me', 'DELETE', { password: 'account-password-123' }, alice.cookie)).status, 200);
  assert.equal((await server.call('/api/v1/me/export', 'GET', undefined, alice.cookie)).status, 401);
});
test('idempotency survives restart and SQLite contains no field plaintext', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'agripulse-test-')); const path = join(directory, 'db.sqlite');
  let cleanupServer;
  t.after(() => { cleanupServer?.close(); assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep + 'agripulse-test-')); rmSync(directory, { recursive: true, force: true }); });
  let server = await setup(path); const account = await register(server);
  const id = crypto.randomUUID(); const write = mutation(account.vault, id, await encrypt(account.key, account.vault.id, id, { notes: 'VERY_PRIVATE_FIELD_NOTE' }));
  const ack = await server.call('/api/v1/sync', 'POST', write, account.cookie); server.close();
  server = await setup(path); cleanupServer = server;
  const login = await server.call('/api/v1/auth/login', 'POST', { email: 'farmer@example.com', password: 'account-password-123' });
  assert.deepEqual((await server.call('/api/v1/sync', 'POST', write, login.cookie)).data, ack.data);
  assert.ok(!readFileSync(path).includes(Buffer.from('VERY_PRIVATE_FIELD_NOTE')));
});
test('production cookies are secure and revoked sessions cannot sync', async t => {
  const server = await setup(':memory:', true); t.after(() => server.close());
  const account = await register(server);
  const login = await server.call('/api/v1/auth/login', 'POST', { email: 'farmer@example.com', password: 'account-password-123' });
  const cookie = login.headers.get('set-cookie'); assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Strict/);
  assert.equal((await server.call('/api/v1/auth/logout', 'POST', {}, account.cookie)).status, 200);
  assert.equal((await server.call('/api/v1/me', 'GET', undefined, account.cookie)).status, 401);
});



test('backend throttles authentication and rejects invalid vault fields', async t => {
  const limited = createBackend({ databasePath: ':memory:', rateLimit: 2 });
  await new Promise(resolve => limited.server.listen(0, '127.0.0.1', resolve)); t.after(() => limited.close());
  const url = 'http://127.0.0.1:' + limited.server.address().port + '/api/v1/auth/login';
  const options = { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-AgriPulse-Request': '1' }, body: JSON.stringify({ email: 'nobody@example.com', password: 'missing-user-password' }) };
  assert.equal((await fetch(url, options)).status, 401); assert.equal((await fetch(url, options)).status, 401);
  const third = await fetch(url, options); assert.equal(third.status, 429); assert.equal(third.headers.get('Retry-After'), '60');
  const server = await setup(); t.after(() => server.close()); const { vault } = await createVault(passphrase);
  assert.equal((await server.call('/api/v1/auth/register', 'POST', { email: 'invalid@example.com', password: 'server-password-123', vault: { ...vault, passphrase } })).status, 400);
  const account = await register(server); const id = crypto.randomUUID();
  const write = mutation(account.vault, id, { ...await encrypt(account.key, account.vault.id, id, { notes: 'Encrypted' }), notes: 'PLAINTEXT' });
  assert.equal((await server.call('/api/v1/sync', 'POST', write, account.cookie)).status, 400);
});
