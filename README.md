# AgriPulse Limpopo

Free offline field tools for a hackathon prototype: fertilizer arithmetic, guided crop symptom triage, soil education and an encrypted farm logbook. The calculator, symptom flow and soil guide require no account. Once installed and cached, they work without signal. Agronomy targets and diagnostic outcomes are illustrative, not validated treatment advice.

## Run

Node 24 required:

```sh
npm ci
npm run build
npm start
```

Open http://localhost:4173. The preview used in this chat runs at http://localhost:4174. For development use `npm run dev:api` and `npm run dev`. Deploy behind HTTPS with a persistent DATABASE_PATH and matching PUBLIC_ORIGIN. See docs/backend.md.

## Free and offline access

The app has no subscription or paywall. First PWA installation, updates and optional cloud backup can consume data. A successful install does not protect phone-only records from device loss.

The build also emits **dist/agripulse-offline.html**, a self-contained field kit of roughly 44 KB. Download it from the Free & offline page and share the actual file through Bluetooth, USB or a file-sharing app. A compatible local-file browser can run its basic calculator, diagnostics and soil guide without a network. It is not a PWA installer and contains no logbook or cloud sync. Test file opening on target phones before distribution.

The logbook works offline after creating a local encryption passphrase; no cloud account is required. Export encrypted backups to another device. Optional account sync transfers only records explicitly shared. Recovery requires the original passphrase and, for cloud recovery, account credentials.

## Structure

- src/components/: interface; src/data/: content; src/locales/: bundled dictionaries.
- src/db/, src/security/, src/sync/: persistence, vault and optional sync.
- public/: icons; src/sw.js: bundled service worker; dist/: generated app and field kit.
- server/: SQLite API; scripts/: offline kit builder; tests/: unit/integration and browser checks.
- docs/: architecture, backend and specification alignment.
- legacy/: preserved original simple prototype; `npm run start:legacy` starts it separately.

## Verification and limits

`npm test`, `npm run lint` and `npm run test:e2e`. Browser checks include offline tools without an account, local-file kit operation without HTTP requests, offline records, recovery and conflicts. Real-phone acceptance remains pending.

Four existing dictionaries are bundled; new guidance currently falls back to English. Complete translation and native-speaker review are pending. No officer dashboard or officer key-sharing scheme is implemented. See docs/spec-alignment.md for the remaining gaps.
