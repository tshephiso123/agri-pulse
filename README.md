# AgriPulse Limpopo

Offline agricultural tools with an encrypted farmer logbook and an owner-only SQLite sync backend. Requires Node 24 or later.

## Run locally

```sh
npm install
npm run build
npm start
```

Open **http://localhost:4173**. Localhost is allowed for development; deployments must use HTTPS.

For frontend development, use two terminals:

```sh
npm run dev:api
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to the backend. Use this exact hostname: origin checks reject other origins. `npm run preview` is not the integrated backend.

## Farmer workflow

1. Open Farm Logbook and create an encryption passphrase of at least 12 characters. Unlock works offline. Keep the passphrase safe; it cannot be reset or recovered by the server.
2. Save a record. Local-Only is the default. The record is encrypted before IndexedDB receives it.
3. Optionally register a cloud account with a **different** account password. To share a record, uncheck Local-Only when creating or editing it.
4. The app drains encrypted requests in FIFO order on launch, connectivity return, manual sync and periodic foreground retries. Background Sync is an optional enhancement; browser scheduling and a valid session are required.
5. Selecting Local-Only for a shared record cancels unsent writes and queues a cloud delete. “Cloud removal pending” remains until acknowledgement. A request whose outcome is uncertain is retried with its original mutation ID before removal; it may already exist on the server.
6. A conflict pauses sync. Review the cloud copy beside the phone entry. Edit the phone entry to combine changes if needed, then choose the cloud version or keep the current phone version. Choosing cloud discards pending shared edits; Local-Only records retain their phone content and retry cloud removal.
7. Download encrypted backups for **all** phone records, including Local-Only records. On an empty phone, restore a backup with its passphrase. Cloud sign-in on an empty phone restores only previously shared records, using the same passphrase. Backups restore records as Local-Only; existing cloud copies are then removed during sync.
8. Use the account controls for readable cloud export and cloud-account deletion. Readable exports contain plaintext. Account deletion retains phone records as Local-Only. Delete individual phone records separately if desired.

One vault is supported per browser profile. Switching accounts is refused when their vaults differ; back up before clearing browser storage or using a separate profile. Lock removes the decryption key from application memory. It does not revoke permission to sync already approved encrypted records. Sign out to stop authenticated background sync; server sessions expire after 24 hours.

On first vault setup, existing plaintext logbook entries are encrypted atomically and set to Local-Only. The old plaintext queue is retired. Existing data remains plaintext until that setup succeeds. This migration cannot erase copies previously sent to other services or forensic remnants of browser storage.

## Checks

```sh
npm test
npm run lint
npm run test:e2e
```

Integration tests cover encryption, migration, backup recovery, owner isolation, mutation versions, restart idempotency, acknowledgement loss, consent withdrawal, FIFO edits, conflicts, 401 and 429 handling. Browser tests use installed Edge on Windows; on other platforms run `npx playwright install chromium` first. Browser checks cover offline reload, sharing, withdrawal, recovery on another browser profile and execution of the worker sync handler with the page closed. They do not guarantee that a browser will schedule native Background Sync after closure.

## Deployment and security

See [backend documentation](docs/backend.md) for the API, deployment settings, encryption design and remaining operational work. Runtime SQLite data is ignored by Git. Choose a private persistent `DATABASE_PATH` outside shared or automatically synchronized folders for deployments. No service credentials or encryption passphrases belong in source control.

This implements technical safeguards, not a declaration of POPIA compliance. Lawful purpose, notices, retention, subject requests, operator agreements, Information Officer responsibilities and incident response still require operational implementation. Section 22 notification is based on reasonable grounds to believe personal information was accessed or acquired without authorization, rather than only likely harm. See the [Information Regulator's POPIA guidance](https://inforegulator.org.za/popia/).

An accurate demo statement is: **“AgriPulse saves records on the phone first, encrypts them with AES-256-GCM, and queues only farmer-approved records for sync when connectivity returns, with safeguards designed to support POPIA compliance.”**
