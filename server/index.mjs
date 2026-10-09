import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const scrypt = promisify(scryptCallback);
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
function bytes(value, min, max = min) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return false;
  const b = Buffer.from(value, 'base64');
  return b.toString('base64') === value && b.length >= min && b.length <= max;
}
function envelope(e, keyId) {
  return e && Object.keys(e).sort().join(',') === 'algorithm,ciphertext,iv,keyId' && e.algorithm === 'AES-256-GCM' && e.keyId === keyId && bytes(e.iv, 12) && bytes(e.ciphertext, 16, 200000);
}
function validVault(v) {
  return v && Object.keys(v).sort().join(',') === 'id,iterations,kdf,salt,wrappedKey' && uuid(v.id) && v.kdf === 'PBKDF2-SHA256' && v.iterations === 600000 && bytes(v.salt, 16) && envelope(v.wrappedKey, v.id) && bytes(v.wrappedKey.ciphertext, 48);
}
async function body(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'Use application/json.');
  let text = '';
  for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 300000) fail(413, 'Request too large.'); }
  try { const value = JSON.parse(text); if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'JSON object required.'); return value; } catch { fail(400, 'Invalid JSON object.'); }
}
export function createBackend({ databasePath = 'runtime/agripulse.sqlite', publicOrigin = 'http://localhost:4173', production = false, staticDir = 'dist', rateLimit = 60 } = {}) {
  if (production && !publicOrigin.startsWith('https://')) throw new Error('PUBLIC_ORIGIN must use HTTPS in production.');
  const origin = new URL(publicOrigin).origin;
  if (databasePath !== ':memory:') mkdirSync(dirname(resolve(databasePath)), { recursive: true });
  const db = new DatabaseSync(databasePath);
  if (db.prepare('PRAGMA user_version').get().user_version > 1) { db.close(); throw new Error('Database schema is newer than this server supports.'); }
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA secure_delete=ON;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL, vault TEXT NOT NULL, vault_id TEXT UNIQUE NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS records (sequence INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, id TEXT NOT NULL, version INTEGER NOT NULL, envelope TEXT, deleted INTEGER NOT NULL, updated_at TEXT NOT NULL, UNIQUE(user_id,id));
    CREATE TABLE IF NOT EXISTS receipts (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, mutation_id TEXT NOT NULL, digest TEXT NOT NULL, ack TEXT NOT NULL, PRIMARY KEY(user_id,mutation_id));
    PRAGMA user_version=1;`);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const limits = new Map();
  const cookie = (token, seconds) => `agripulse_session=${token}; HttpOnly; SameSite=Strict; Path=/api/v1; Max-Age=${seconds}${production ? '; Secure' : ''}`;
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url, origin);
      if (!url.pathname.startsWith('/api/')) {
        if (!['GET', 'HEAD'].includes(req.method)) fail(405, 'Method not allowed.');
        const root = resolve(staticDir);
        let path = resolve(root, '.' + decodeURIComponent(url.pathname));
        if (path !== root && !path.startsWith(root + sep)) fail(404, 'Not found.');
        if (url.pathname === '/') path = resolve(root, 'index.html');
        if (!existsSync(path)) fail(404, 'Build the frontend with npm run build.');
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
        res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        res.end(req.method === 'HEAD' ? undefined : readFileSync(path)); return;
      }
      res.setHeader('Cache-Control', 'no-store');
      if (req.headers.origin && req.headers.origin !== origin) fail(403, 'Origin denied.');
      if (req.headers['sec-fetch-site'] === 'cross-site') fail(403, 'Cross-site request denied.');
      if (!['GET', 'HEAD'].includes(req.method) && req.headers['x-agripulse-request'] !== '1') fail(403, 'Missing request protection header.');
      if (url.pathname === '/api/v1/health' && req.method === 'GET') { json(200, { ok: true }); return; }
      const now = Date.now();
      for (const [key, value] of limits) if (value.until < now) limits.delete(key);
      const bucket = (req.socket.remoteAddress || 'unknown') + (url.pathname.includes('/auth/') ? ':auth' : ':api');
      const limit = limits.get(bucket) || { count: 0, until: now + 60000 };
      limits.set(bucket, limit);
      if (++limit.count > (url.pathname.includes('/auth/') ? Math.min(rateLimit, 15) : rateLimit)) { res.setHeader('Retry-After', '60'); fail(429, 'Try again shortly.'); }
      run('DELETE FROM sessions WHERE expires < ?', now);
      if (['/api/v1/auth/register', '/api/v1/auth/login'].includes(url.pathname) && req.method === 'POST') {
        const input = await body(req);
        const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) fail(400, 'Use a valid email and a password of 12 to 128 characters.');
        let user;
        if (url.pathname.endsWith('/register')) {
          if (!validVault(input.vault)) fail(400, 'Invalid encrypted vault.');
          const salt = randomBytes(16).toString('hex');
          const password = Buffer.from(await scrypt(input.password, salt, 64)).toString('hex');
          user = { id: randomUUID(), email, vault: JSON.stringify(input.vault), vault_id: input.vault.id };
          try { run('INSERT INTO users VALUES (?,?,?,?,?,?)', user.id, email, salt, password, user.vault, user.vault_id); } catch { fail(409, 'Email or vault already registered.'); }
        } else {
          user = get('SELECT * FROM users WHERE email=?', email);
          const actual = Buffer.from(await scrypt(input.password, user?.salt || 'missing-user-dummy-salt', 64));
          if (!user || !timingSafeEqual(actual, Buffer.from(user.password, 'hex'))) fail(401, 'Email or password incorrect.');
        }
        const token = randomBytes(32).toString('hex');
        run('INSERT INTO sessions VALUES (?,?,?)', hash(token), user.id, now + 86400000);
        res.setHeader('Set-Cookie', cookie(token, 86400));
        json(200, { user: { id: user.id, email: user.email }, vault: JSON.parse(user.vault), expiresAt: now + 86400000 }); return;
      }
      const token = /(?:^|;\s*)agripulse_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
      const user = token && get('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.hash=? AND expires>?', hash(token), now);
      if (!user) fail(401, 'Sign in to sync.');
      if (url.pathname === '/api/v1/auth/logout' && req.method === 'POST') { run('DELETE FROM sessions WHERE hash=?', hash(token)); res.setHeader('Set-Cookie', cookie('', 0)); json(200, { ok: true }); return; }
      if (url.pathname === '/api/v1/me' && req.method === 'GET') { json(200, { user: { id: user.id, email: user.email }, vault: JSON.parse(user.vault) }); return; }
      const serialize = row => ({ id: row.id, version: row.version, sequence: row.sequence, envelope: row.envelope ? JSON.parse(row.envelope) : null, deleted: Boolean(row.deleted), updatedAt: row.updated_at });
      if (url.pathname === '/api/v1/me/export' && req.method === 'GET') { json(200, { email: user.email, vault: JSON.parse(user.vault), records: all('SELECT * FROM records WHERE user_id=? ORDER BY sequence', user.id).map(serialize) }); return; }
      if (url.pathname === '/api/v1/me' && req.method === 'DELETE') {
        const input = await body(req);
        if (typeof input.password !== 'string' || input.password.length > 128) fail(400, 'Password required.');
        const actual = Buffer.from(await scrypt(input.password, user.salt, 64));
        if (!timingSafeEqual(actual, Buffer.from(user.password, 'hex'))) fail(401, 'Password incorrect.');
        run('DELETE FROM users WHERE id=?', user.id); res.setHeader('Set-Cookie', cookie('', 0)); json(200, { ok: true }); return;
      }
      if (url.pathname === '/api/v1/sync' && req.method === 'GET') {
        const cursor = Number(url.searchParams.get('cursor') || 0);
        if (!Number.isSafeInteger(cursor) || cursor < 0) fail(400, 'Invalid cursor.');
        const rows = all('SELECT * FROM records WHERE user_id=? AND sequence>? ORDER BY sequence LIMIT 101', user.id, cursor);
        const page = rows.slice(0, 100);
        json(200, { vaultId: user.vault_id, records: page.map(serialize), nextCursor: page.at(-1)?.sequence || cursor, hasMore: rows.length > 100 }); return;
      }
      if (url.pathname === '/api/v1/sync' && req.method === 'POST') {
        const input = await body(req);
        if (!uuid(input.mutationId) || !uuid(input.recordId) || input.vaultId !== user.vault_id || input.sharing !== 'cloud' || !Number.isSafeInteger(input.baseVersion) || input.baseVersion < 0 || !['upsert', 'delete'].includes(input.operation) || (input.operation === 'upsert' && !envelope(input.envelope, user.vault_id))) fail(400, 'Invalid encrypted mutation.');
        const digest = hash(JSON.stringify({ mutationId: input.mutationId, recordId: input.recordId, vaultId: input.vaultId, baseVersion: input.baseVersion, sharing: input.sharing, operation: input.operation, envelope: input.operation === 'upsert' ? input.envelope : null }));
        db.exec('BEGIN IMMEDIATE');
        try {
          const receipt = get('SELECT * FROM receipts WHERE user_id=? AND mutation_id=?', user.id, input.mutationId);
          if (receipt) { if (receipt.digest !== digest) fail(409, 'Mutation ID reused with different content.'); db.exec('COMMIT'); json(200, JSON.parse(receipt.ack)); return; }
          const old = get('SELECT * FROM records WHERE user_id=? AND id=?', user.id, input.recordId);
          if ((old?.version || 0) !== input.baseVersion) fail(409, 'Record changed on another device. Review the conflict.');
          const version = (old?.version || 0) + 1;
          const updatedAt = new Date().toISOString();
          run('DELETE FROM records WHERE user_id=? AND id=?', user.id, input.recordId);
          run('INSERT INTO records(user_id,id,version,envelope,deleted,updated_at) VALUES (?,?,?,?,?,?)', user.id, input.recordId, version, input.operation === 'upsert' ? JSON.stringify(input.envelope) : null, input.operation === 'delete' ? 1 : 0, updatedAt);
          const ack = serialize(get('SELECT * FROM records WHERE user_id=? AND id=?', user.id, input.recordId));
          delete ack.envelope;
          run('INSERT INTO receipts VALUES (?,?,?,?)', user.id, input.mutationId, digest, JSON.stringify(ack));
          db.exec('COMMIT'); json(200, ack); return;
        } catch (error) { db.exec('ROLLBACK'); throw error; }
      }
      fail(404, 'Not found.');
    } catch (error) { json(error.status || 500, { error: error.status ? error.message : 'Server error.' }); }
  });
  return { server, close: () => { server.close(); server.closeAllConnections(); db.close(); } };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const backend = createBackend({ databasePath: process.env.DATABASE_PATH, publicOrigin: process.env.PUBLIC_ORIGIN || 'http://localhost:4173', production: process.env.NODE_ENV === 'production' });
  backend.server.listen(Number(process.env.PORT || 4173), process.env.HOST || '127.0.0.1', () => console.log('AgriPulse backend listening on port ' + (process.env.PORT || 4173)));
}
