# AgriPulse agent context

## Offline language packs (9 October 2026)

The six-hour MVP uses bundled Google Translate public-UI drafts for Sepedi (`nso`), Xitsonga (`ts`) and Tshivenda (`ve`), with English fallback. No runtime translation API or Cloud credentials are required. The wrong legacy `se` preference migrates to `nso`. UI helpers, errors, states and crop labels now use the central catalog. Chemical instructions remain English pending review; symptoms include English references. All non-English packs are machine drafts requiring fluent-speaker review. See docs/translations.md for the provider comparison, preparation sources and acceptance checks.

## UI refresh (9 October 2026)

The React screens use adapted shadcn/ui Button, Input, Card, Alert, Empty, Skeleton and Radix Dialog components in src/components/ui/. Lucide supplies locally bundled open-source SVG icons for empty states. Desktop navigation uses a side menu; phones retain large bottom navigation buttons. Calculator results clear when inputs change. Logbook and vault operations display distinct error and success alerts, with loading feedback and a storage retry action. Encryption, Local-Only consent and the existing sync engine are preserved.

The new tests/e2e/ui.spec.js checks invalid calculator input, stale-result clearing, phone overflow and delete-dialog focus restoration. Draft localized UI copy is now bundled; fluent-speaker review is still pending.

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

## Early diagnosis pivot (9 October 2026) — current scope

The default screen and first navigation item are now the early maize FAW checklist for Ga-Matlapa and Mankweng. src/components/FawDiagnosis.jsx provides three observations with Yes/No/Not sure answers, required-answer validation, cautious possible/uncertain/no-reported-sign outcomes, fresh guidance after changed answers, and restart. Existing calculator, logbook, encryption and sync remain available; the former symptom library is supplementary.

English and draft Sepedi cover every new diagnostic instruction and management step. Xitsonga and Tshivenda retain their existing UI packs; the new FAW guidance explicitly falls back to English. No runtime translation, image recognition, account or network request is required for the checklist. Vite's existing precache includes its bundled content after an initial online load.

Nonchemical scouting, hand removal of identified eggs/young larvae, recording and adviser escalation draw on FAO and CIMMYT (2018); source links are on the screen. No pesticide dose is prescribed in the new flow. This user-authorized pivot supersedes the historical prohibition on adding management guidance. Sample labels remain: this is not a validated diagnostic engine. Fluent Sepedi review, local agronomic validation and real-phone Airplane Mode acceptance remain required before field release. No mock or personal records were committed.

## UI refinement checkpoint — phase 1 (9 October 2026)

The user's updated UI brief overrides conflicting historical layout guidance. The shell alone has h-dvh/overflow-hidden; body is not locked. First launch asks for a full-name language choice. Tool homes show navigation and one pinned primary action; entering a wizard hides mobile tabs. Shared Wizard, SharedStates, token-based controls and a connection dialog are in place. Steps can scroll without moving the action bar. New UI keys are English only with bundled fallback; docs/ui/translations-needed.md lists nso/ve/ts work for a localization lead.

There are eight color tokens including strong interaction borders and dark warning text. scripts/check-ui-contrast.mjs records all 28 pairs and enforces intended text/control uses in docs/ui/. A self-hosted Noto Sans variable WOFF2 subset is precached. Public Sans was rejected after glyph inspection; Noto Sans retains the requested U+1E00–U+1EFF source range and all 10 specified Tshivenda characters. No runtime dependency was added.

Work stops at each phase for screenshot review, as requested. Calculator, FAW and protection presentation drafts started before the phase override and remain unaccepted until phases 2–3. Logbook paging and full state/wizard integration remain phase 3 work; complete end-to-end regression and Lighthouse verification remain phase 4. Encryption/storage/sync/API logic was not edited. See docs/ui/review-and-plan.md and phase-1 screenshots in docs/ui/phase1/.

## UI refinement checkpoint — phase 2 (9 October 2026)

The calculator in src/components/NpkCalculator.jsx now uses five data-defined Wizard steps (crop, fertilizer, area, review, result). Crop/product choices use large icon-labelled radio cards. The existing maize/urea defaults, formula, rounding, area validation and unsafe-output checks are preserved. Review shows chosen details before calculation; Back and Calculate again retain inputs and clear stale results. New UI copy is English only and listed in docs/ui/translations-needed.md. Short-height layout improvements preserve pinned actions with 200% text; progress painting now uses semantic tokens. Sample labels remain on home, crop, review and result. No storage, encryption, sync or API implementation was changed.

Phase-2 screenshots/checks live in tests/e2e/phase2.spec.js and docs/ui/phase2/. playwright.ui.config.js includes both phase-1 and phase-2 acceptance. The existing calculator regression in ui.spec.js now follows the wizard. The remaining old diagnosis/logbook localization and UI flows are pending phases 3–4. Stop for screenshots at the end of this phase, per the user's instruction.

Phase-2 checkpoint verification: production build and changed-file lint passed; all 17 unit/backend/storage/localization checks passed; all 41 phase-1/phase-2 browser checks passed in the final run. The screenshot checkpoint is complete; phase 3 diagnosis/logbook and phase 4 full-state work remain pending.

## UI refinement checkpoint — phase 3 (9 October 2026)

The legacy Logbook scrolling wrapper and always-visible passphrase controls are removed. The unlocked home shows three recent record summaries and one Add entry action. Protection, account tools and encrypted backup are separate bounded Wizard screens. A data-defined three-step entry flow separates activity/category, notes and sharing review; new entries default to phone-only consent. Full notes are available on entry details. All entries pages contain three items below 700px viewport height and five otherwise. Edit/delete, expected record versions, encrypted storage and sync implementation are preserved.

Diagnosis uses the shared Wizard for observations, result, individual management steps and references. Supplementary symptom examples also have data-defined steps, including the existing English treatment samples. Back now respects each flow's explicit handler, including the first management step. Icons accompany FAW and symptom choices. Conflict review displays one pending record at a time, fetches the reviewed cloud version, and applies an explicit radio choice using that reviewed version; phone-only conflict semantics are preserved. New copy is English only and documented for localization.

Phase-3 automated acceptance and screenshots are in tests/e2e/phase3.spec.js and docs/ui/phase3/. Phase 4 remains the complete legacy selector migration, full state screenshot pass and Lighthouse. Real Android and local-language/agronomic review remain pending. No records or mocks are committed.

Phase-3 verification: the combined phase-1/phase-2/phase-3 suite passed all 63 browser cases in one run. All 17 Node backend/storage/localization tests passed with sequential workers. Changed-file lint, production build and intended contrast pairs pass. Final dialog spacing, protection-step count and strong navigation/dialog borders received a focused phone/desktop/delete regression rerun. Screenshots are in docs/ui/phase3/. Phase 4 and real-device acceptance remain pending.

## Branding adjustment (9 October 2026)

At the user's request, the displayed app name, browser title and installable PWA name are now AgriSmart. Decorative icons above the three tool-home headings are removed; navigation and labelled controls retain their icons. Internal storage names, encryption identifiers, backup format and sync headers retain their compatibility identifiers to preserve existing records. Phase 4 remains pending.
