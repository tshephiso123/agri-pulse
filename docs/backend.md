# Encrypted backend and phone sync

## Deployment

`npm start` runs the Node 24 backend and serves the built `dist` directory. Run `npm run build` first. Settings:

| Variable | Default | Meaning |
| --- | --- | --- |
| PORT | 4173 | Private HTTP listener port |
| HOST | 127.0.0.1 | Bind address; use 0.0.0.0 only where hosting requires it |
| PUBLIC_ORIGIN | http://localhost:4173 | Exact browser origin; HTTPS required when production |
| DATABASE_PATH | runtime/agripulse.sqlite | Private persistent SQLite location |
| NODE_ENV | unset | Set production behind an HTTPS reverse proxy |

Expose only the HTTPS reverse proxy. Serve frontend and API on the same origin. Production session cookies are Secure, HttpOnly and SameSite=Strict. APIs are never cached by the app or service worker. JSON mutations require `X-AgriPulse-Request: 1`, reject foreign Origin headers and cross-site fetches, and have a 300 KB body limit. No CORS permissions are supplied.

SQLite enables foreign keys, WAL and secure deletion. Account removal cascades through sessions, encrypted records and retry receipts. Database files, WALs, other phones, downloaded exports and historical backups still need explicit retention/erasure procedures. Backups must be encrypted and restore-tested. The database is a version-1 foundation; future schema changes need migrations. It is intended for a small single-instance pilot; synchronous SQLite, in-process rate limits, reverse-proxy address grouping and unbounded receipt retention need review for larger deployments.

## Encryption

The client generates a random 256-bit AES-GCM vault key. A PBKDF2-SHA256 key (600,000 iterations, fresh 16-byte salt) derived from the farmer's passphrase wraps that key with AES-GCM. Only the salt, derivation parameters and wrapped key are stored locally and with the cloud account. The unlocked vault key is non-extractable and exists only in application memory. No passphrase or decrypted field record is transmitted to the backend.

Each encryption uses a fresh random 12-byte IV and the GCM authentication tag. Additional authenticated data binds the format, vault identity and record UUID; wrapped keys use a distinct vault-key identity. The backend uniquely associates a vault with its owner. Each IndexedDB record and queued mutation contains ciphertext, plus operational metadata: UUIDs, versions, creation/server timestamps, sharing choices and queue state. Activity, category and notes are not indexed or stored in plaintext after migration. Account email, IP address, request timing, password hashes and vault parameters remain visible to the backend. Weak passphrases remain vulnerable to offline guessing of an encrypted vault.

Backend validation checks envelope structure and sizes; it cannot authenticate ciphertext or prove that clients used strong keys. Passphrase rotation, forgotten-passphrase recovery, account password recovery and verification are not implemented. Recovery needs the original passphrase plus the cloud vault or an encrypted backup. Local-Only records require a backup to recover from phone loss. The worker uses the same-origin HttpOnly cookie to transfer ciphertext; it never receives a decryption key. A locked vault can still sync approved ciphertext while its account session is valid.

## API

All request bodies use application/json. Sessions use the cookie returned by register/login and expire after 24 hours. Passwords are salted scrypt hashes. Sign-out revokes the current session. Authentication is limited to 15 requests per IP/minute; other API calls to 60. 429 supplies Retry-After: 60. Health checks are exempt. Add upstream abuse protection for deployment.

| Method | Path | Body / response |
| --- | --- | --- |
| GET | /api/v1/health | Health status |
| POST | /api/v1/auth/register | `{email,password,vault}`; password 12–128 chars; returns user, encrypted vault, expiry and session cookie |
| POST | /api/v1/auth/login | `{email,password}`; returns user, encrypted vault, expiry and session cookie |
| POST | /api/v1/auth/logout | `{}`; revokes current session |
| GET | /api/v1/me | Own identity and encrypted vault |
| POST | /api/v1/sync | One encrypted mutation |
| GET | /api/v1/sync?cursor=0 | Own current records and tombstones, paginated 100 at a time |
| GET | /api/v1/me/export | Own account email, encrypted vault and encrypted records |
| DELETE | /api/v1/me | `{password}`; delete account and associated rows |

A mutation contains `mutationId`, `recordId`, `vaultId`, `baseVersion`, `operation` (upsert/delete) and `sharing: cloud`. Upserts also contain an envelope with exactly `algorithm: AES-256-GCM`, `keyId` (vault UUID), `iv` (canonical base64, 12 bytes) and `ciphertext` (canonical base64 including GCM tag). Deletes omit the envelope. Each queue item persists the endpoint, method and full encrypted payload.

New records use baseVersion 0. Acknowledgements contain id, version, sequence, authoritative updatedAt and deleted. Repeated identical mutations return the original acknowledgement, including after restart. Reusing mutation IDs with different content or stale versions returns 409. Delete removes the ciphertext and preserves a versioned tombstone. Cursor pagination delivers current state, not historical events. Rows and cursor are committed atomically on the phone.

## Queue behavior

Encrypted saves and their queue entries are one IndexedDB transaction. Shared writes are immutable once transmission has been attempted. Each acknowledgement is committed atomically with removal of its queue item and baseVersion updates to later unsent edits. The server writes the record and idempotency receipt in one SQLite transaction. These operations tolerate response loss and process interruption.

Separate Web Locks serialize cloud sync across tabs/workers and protect short storage operations. Network requests do not hold the storage lock, so local saves can continue during weak-signal requests. A mutation is atomically marked sent before transmission; consent withdrawal then retains that immutable request until its outcome is known. Acknowledgement and pull application acquire the storage lock only for local commits. A current browser supporting Web Locks in a secure context is required. Persistent retry state uses capped exponential backoff with jitter and honors numeric/date Retry-After. Network failures, 5xx and 429 retry; 401 pauses for sign-in; 409 and permanent validation failures block the queue for review. FIFO stops at the blocked head, so later records do not silently bypass it. Farmers can decrypt and review the cloud copy beside the phone record, edit the phone entry to combine changes, then explicitly select the cloud or phone version. The reviewed cloud version is checked again before resolution; a changed copy requires another review. A chosen phone version uses a fresh mutation ID and the reviewed baseVersion, so further concurrent changes still cause a conflict. Connectivity state is a hint; successful server acknowledgements establish sync status.

Local-Only cancels unsent mutations. A mutation with uncertain server outcome must be resolved through its original idempotent request before the versioned cloud delete. The phone keeps the chosen local content throughout. Restored local records do not silently regain sharing consent. If the cloud still holds their copy, a delete is queued. Acknowledged cloud tombstones remove shared local records, but retain Local-Only content. Account deletion explicitly preserves local entries and clears pending sync.

## Permissions and POPIA work

Every authenticated read/write/export/delete scopes database queries to the authenticated owner. Vault IDs in mutations must match that owner. No cooperative, officer or extension-worker roles are supported; those require explicit server grants and an authorized encryption-key-sharing design before adding sync access.

Technical safeguards do not establish full POPIA compliance. Before real-data deployment, implement and verify purpose/lawful basis, a privacy notice, retention including backups, Information Officer duties, operator agreements, subject access/correction/deletion procedures, session/device revocation and incident handling. Readable cloud export decrypts on the client; corrections use versioned upserts. Account erasure cannot delete another phone's copies or previously downloaded exports.

POPIA section 22 notification depends on reasonable grounds to believe personal information was accessed or acquired by an unauthorized person, not only probable harm; notification generally covers the Regulator and identifiable affected data subjects, as soon as reasonably possible, subject to statutory exceptions. Consult the [Information Regulator guidance](https://inforegulator.org.za/popia/). No real-phone or production HTTPS deployment acceptance has been performed.

Technical references: [WebCrypto deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey), [Node SQLite](https://nodejs.org/api/sqlite.html), [Vite PWA custom worker](https://vite-pwa-org.netlify.app/guide/inject-manifest).

The current full dependency audit reports seven development-tool advisories through Tailwind 3 (five high, two moderate); npm's suggested resolution requires migration to Tailwind 4. These tools are not loaded by the production server or shipped as runtime libraries. The runtime-only audit reports zero known vulnerabilities. Review and migrate the build tooling separately before broad deployment.
