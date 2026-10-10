# AgriPulse agent context

## Current scope

Deployment merge preserves the incoming AgriSmart redesign at dea7561 in Git history and a local ignored archive/ snapshot. Compatible added modules/translations remain; App uses the user-approved AgriPulse screens. Wizard-specific browser tests are reference tests; active testMatch selects field-tools, offline-kit and sync. Review docs/ui/ as alternate-design history, not active UI acceptance.

On October 10, 2026 the user requested improving the React version to follow the comprehensive specification, emphasizing free offline access for rural users. React is again the default. Preserve legacy/ separately; do not copy its worker into public/.

## Architecture

The UI uses a cream/green card layout, mobile floating tool navigation and a native Language dropdown with full names. Styles live in src/index.css; Header.jsx owns the selector. Keep assets bundled and preserve 48px touch targets.

- src/components/: calculator, JSON-driven diagnostic flow, soil guide, access/install guide, encrypted logbook and vault controls.
- src/utils/agronomyCalculators.js validates nutrient arithmetic, adviser-supplied soil credit, calibrated caps and explicit label-rate tank conversion. Do not invent agronomic dosage rates.
- src/data/diagnosticFlow.json defines question/outcome nodes; src/locales/features.en.json supplies new guidance. Existing four language dictionaries remain bundled; new text falls back to English pending translation.
- src/sw.js is bundled by vite-plugin-pwa. PWA assets are cached; API responses are not.
- server/index.mjs serves dist/ and authenticated /api/v1 endpoints with SQLite in ignored runtime/.
- scripts/build-offline-kit.mjs generates a self-contained dist/agripulse-offline.html after the Vite build. It runs basic tools with no HTTP requests when opened as a local file; it is not a PWA installer or logbook.
- legacy/ holds the original simple prototype and ignored legacy/mock-data/.

## Commands

Vercel: vercel.json runs npm run build:vercel to publish dist/ with cloud controls disabled (VITE_CLOUD_ENABLED=false). The SQLite API requires persistent hosting; this deployment retains local encrypted backup export/restore. See docs/vercel.md. Standard npm run build keeps cloud features for the Node deployment.

Node 24: npm ci, npm run build, npm start. Default port 4173; chat preview uses PORT=4174 and PUBLIC_ORIGIN=http://localhost:4174. Development: npm run dev:api plus npm run dev. Tests: npm test, npm run lint, npm run test:e2e. E2E_PORT can select a separate browser-test port. npm run start:legacy / test:legacy operate the original app.

## Constraints

Tools are free and offline after initial caching. Do not claim first PWA installation, updates or cloud sync use zero data. Shared offline HTML is distinct from PWA installation; phone file handling requires device testing. Account setup is optional for core tools and local notes; local encryption passphrase is required for the logbook. Device loss can destroy phone-only records. Backups must be copied elsewhere; cloud recovery needs credentials and original passphrase.

Agronomic targets and diagnostic outcomes are demo content, not validated advice. No generic pesticide cap doses may be shown. Four language dictionaries do not imply new guidance or security controls are fully translated. Native-speaker review, crop-specific validation, officer authorization/dashboard and real-phone HTTPS acceptance remain pending. Do not claim POPIA compliance or partnerships.

GitHub: https://github.com/tshephiso123/agri-pulse. Preserve sample labels, the offline demo and runtime-data ignore rules. Update this file and instruction.md after meaningful changes.
