# Architecture and folder ownership

## Active architecture after backend merge

The React/Vite application is in src/: components/ for screens, data/ and locales/ for content, db/ for IndexedDB, security/ for encryption and sync/ for queue management. src/sw.js is bundled by the PWA plugin. public/ contains static assets; Vite emits dist/. server/index.mjs serves dist/ and the authenticated /api/v1 API, persisting encrypted records in runtime/ SQLite. tests/ contains active backend, storage and browser checks. See backend.md for the protocol.

The original application described below now lives entirely under legacy/. Do not copy its index.html, manifest or service worker into the active public/ folder.

## Historical prototype architecture

The application has no build step. The Node server exposes public/ at `/`, and keeps server code, tests, documentation and runtime records outside the served directory.

| Location | Responsibility | Sprint owner |
| --- | --- | --- |
| public/index.html, public/css/, public/icons/ | App shell, appearance, install icons | Frontend / PWA |
| public/js/app.js | Tool screens, online state and sync lifecycle | Frontend + backend |
| public/js/data.js | Sample crop rates and generic symptom tree | Content / QA |
| public/js/storage.js | IndexedDB records | Offline data / backend |
| public/sw.js, public/manifest.webmanifest | Offline caching and install metadata | Frontend / PWA |
| server/index.mjs | Allowed static routes and persistent mock API | Offline data / backend |
| tests/ | Calculation, tree, API and asset path checks | Engineering |
| instruction.md | Sprint acceptance and demo script | Lead + QA |
| agent.md, AGENTS.md | Shared agent context and working rules | Everyone |

## Request and storage flow

Browser screens import data and storage modules from public/js/. A field note is written to IndexedDB before attempting a network request. Pending notes are POSTed to /api/entries with stable IDs. The server persists records in mock-data/entries.json, returns an acknowledgement, and the browser marks the local note synced. The officer view reads GET /api/entries.

## Editing paths safely

Keep sw.js in public/ so its default scope covers the whole application. Paths in the manifest and service worker are relative to the web root; JavaScript imports are relative to the importing module. Adding a public asset requires updating the server's allowlist and, if needed offline, the service worker's SHELL list. Increase the service worker cache version when changing cached assets. Run `npm run check` and `npm test` after changes, then use the real-phone checklist in instruction.md for offline acceptance.

Runtime records remain at the repository root even though the server source lives under server/. Do not put private data or engineering documents inside public/.
