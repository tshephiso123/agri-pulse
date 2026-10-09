# AgriPulse agent context

## Current state after backend merge — authoritative

The active app is now the React/Vite PWA from backend. Earlier implementation notes below describe the preserved legacy/ prototype, not the active app. Both unrelated Git histories are retained.

- src/components/ owns React screens; src/data/ and src/locales/ own content.
- src/db/, src/security/ and src/sync/ own encrypted IndexedDB storage, vaults and opt-in sync.
- src/sw.js is bundled by vite-plugin-pwa; do not put another service worker in public/.
- server/index.mjs serves built dist/ and authenticated /api/v1 endpoints with SQLite in ignored runtime/.
- Use Node 24: npm ci, npm run build, npm start. Open http://localhost:4173. Development: npm run dev:api plus npm run dev.
- Active checks: npm test, npm run lint, npm run build, npm run test:e2e. See docs/backend.md.
- Create a logbook encryption passphrase. Local-Only is the default; sharing requires an account with a separate password and explicit consent. There is no officer view of encrypted farmer records.
- The original prototype is in legacy/; its API and storage are separate. Real-phone Airplane Mode acceptance remains pending.

## Historical prototype context

Read this file and instruction.md before making changes. This is a 48-hour hackathon prototype for 10 people, with feature freeze at H42. The live story is: install → Airplane Mode → calculator → symptom flow → save a note → reconnect → sync → officer view.

## Current implementation

- Dependency-free HTML/CSS/JavaScript PWA; Node 24 development server and mock API.
- public/js/app.js owns UI and sync orchestration; public/js/data.js contains three sample crops and eleven illustrative symptom outcomes.
- public/js/storage.js persists entries in IndexedDB. Each entry has a stable UUID, crop, field, notes, createdAt and synced flag.
- public/sw.js precaches the shell and data. It stays at the web root for full app scope. It never caches API responses. Bump CACHE when changing cached assets.
- server/index.mjs serves only explicitly allowed files from public/ and accepts idempotent POST /api/entries and GET /api/entries. Mock records persist in ignored mock-data/entries.json at the repository root.
- tests/ contains automated checks; docs/architecture.md explains folder ownership. Keep agent.md, instruction.md and AGENTS.md at the root for discoverability.
- GitHub repository: https://github.com/tshephiso123/agri-pulse; main tracks origin/main.
- Sync runs on app launch, reconnect, manual request and every 30 seconds while the app is open. Server acknowledgement precedes the local synced flag. Retries reuse IDs.
- Officer view is an unauthenticated demo page, not a production portal.

## Commands

`npm start` serves http://localhost:4173. `npm run check` checks syntax. `npm test` checks calculation boundaries, tree integrity, and API contracts.

## Constraints and remaining verification

All agronomic content is sample data. Do not imply scientific validation or add treatment recommendations. Use fictional logbook entries. No accounts, real cloud integration, photos, geolocation, or push messages are required.

The phone must use HTTPS for service workers; a LAN HTTP address is insufficient. Localhost works on the development machine. Hosting is not configured yet. A static host supports offline tools but needs a separately configured API for syncing; deploy this Node server to an HTTPS-capable host for the complete demo.

Browser installation, IndexedDB persistence, actual Airplane Mode operation and real phone layout still require the manual acceptance run in instruction.md. Browser storage can be cleared by users or evicted; this is not a durable production backup. Background sync while the app is closed is not implemented.

Keep this file current when architecture, commands, scope or verification changes. Do not report manual acceptance as passed until it has actually been performed.
