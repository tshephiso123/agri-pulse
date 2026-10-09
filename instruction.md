# Sprint execution and handoff

## Translation acceptance for the MVP

Use the bundled language packs so the demo does not depend on a translation API or Cloud account. See docs/translations.md for the Google/Azure comparison and the machine-draft limitations. Run tests/localization.test.mjs and tests/e2e/localization.spec.js for key/token completeness, legacy Sepedi preference migration, offline language switching, persistence, translated validation and phone overflow. Fluent-speaker review is pending. Chemical instructions stay English until reviewed; keep the sample-data labels visible.

## UI verification additions

Run the existing build, lint, storage/backend and browser acceptance checks after UI work. tests/e2e/ui.spec.js adds calculator validation and stale-result checks, a 375 px layout check, and Escape/focus restoration for the delete dialog. Browser checks supplement the real-phone acceptance checklist below; they do not replace it. Draft local-language helper text needs fluent-speaker review.

## Current demo after backend merge

The active app is the React/Vite version from backend. Run `npm ci`, `npm run build`, then `npm start`, and open http://localhost:4173. The historical sprint checklist below applies to the preserved legacy/ prototype. Use this flow for the merged demo:

1. Online, load the built PWA and create a Farm Logbook encryption passphrase of at least 12 characters. Keep it available to unlock after reopening.
2. Register a fictional cloud account with a different account password. Uncheck Local-Only for records intended to sync.
3. Install the PWA, enable Airplane Mode with Wi-Fi disabled, then reopen. Use the calculator and symptom tree.
4. Unlock the vault, save a fictional shared note offline and confirm pending status and persistence after reopening.
5. Reconnect; use manual sync if needed. Confirm acknowledgement. The backend stores farmer-owned encrypted records; it has no officer plaintext table.
6. Deployment needs HTTPS, persistent DATABASE_PATH, matching PUBLIC_ORIGIN and NODE_ENV=production. See docs/backend.md.

Real-phone acceptance remains pending. Active checks: `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`.

## Historical prototype sprint plan

## Sprint 0 readiness

The local stack and prototype are ready. GitHub repository: https://github.com/tshephiso123/agri-pulse. Before starting the 48-hour clock, assign four named owners, select an HTTPS host that runs Node, install the app on the demo phone and agree on the fictional demo field. Deployment credentials and named team members have not been supplied. Do not invent them.

## Sprint 1: H3–H10 — offline shell and data

| Owner | Work | Acceptance |
| --- | --- | --- |
| Frontend / PWA | Validate manifest, icons, installation, cache and phone layout | Installed phone app opens after closing it and enabling Airplane Mode |
| Offline data / backend | Verify IndexedDB, API persistence and stable IDs | Saved note survives reload; retry produces one server record |
| Content / design / QA | Review three crop samples and symptom tree; document sample limits | No missing tree nodes; sample labels visible; choices readable on phone |
| Lead / pitch | Assign owners, deploy HTTPS, start problem slides and demo script | Shared URL works; Sprint 1 acceptance evidence recorded |

Start with `npm run check`, `npm test`, then `npm start`. Open http://localhost:4173 on the development machine. Deploy the same project with the start command `npm start`, and a persistent writable directory if mock records must survive host restarts. Hosting platforms may provide PORT. No package installation is needed.

### Offline acceptance checklist

1. On a real phone, open the HTTPS URL while online. Wait for the offline-ready message. Install from the browser menu or iPhone Share → Add to Home Screen.
2. Close the app, enable Airplane Mode with Wi-Fi also disabled, and reopen the installed app. Confirm the offline indicator and all tool screens.
3. Calculate maize for 2 ha: sample output must be 100 kg. Confirm zero/negative field sizes are rejected.
4. Follow the symptom tree, go Back, change an answer and Restart. Add an outcome to the logbook.
5. Save a fictional note for North field. Reload and reopen; confirm the note remains Pending sync.
6. Reconnect with the app open. Confirm Synced, then open Officer view and find the same note. Press Sync now twice; there must still be one server record.
7. Stop the server while browser connectivity remains online. Save a second note; it must remain pending. Restart the server and manually retry; confirm recovery.
8. Repeat steps 1–6 twice from a clean install before the final pitch. Clearing browser site storage deletes local notes: use fictional test data only.

Record device/browser, deployed URL, date, result and bug links below. Do not count browser network emulation as the final phone test.

| Check | Evidence | Status |
| --- | --- | --- |
| Syntax and automated contracts | npm run check / npm test: syntax valid; 4 tests pass, including cached asset paths | Passed |
| HTTPS deployment | Awaiting host selection | Pending |
| Phone installation and cold offline launch | Awaiting real device | Pending |
| Offline storage and reconnect sync | Awaiting real device | Pending |

## Later gates

- H10–20: calculator and symptom flow accepted offline; lead cuts incomplete extras at H20.
- H20–30: logbook, pending status and retry tested; arrange sleep shifts.
- H30–42: reconnect sync, officer view, small-screen polish and backup video. Freeze at H42.
- H42–48: only demo-blocking fixes, two timed rehearsals, submission before deadline.

Cut order: officer UI → automatic sync (keep manual sync) → two crops/six outcomes. Preserve the Airplane Mode demo.

## 90-second demo

Show installed AgriPulse and sample-data label. Enable Airplane Mode. Calculate 2 ha of maize, explore a symptom, save a field note, and reload to demonstrate persistence. Reconnect, sync, then show the officer record. Explain that agronomic validation, authentication and production cloud durability are future work.

## Early FAW diagnosis acceptance (9 October 2026)

Open the app directly on the maize FAW checklist; the calculator and logbook are supplementary. Demonstrate early leaf signs, Yes/No/Not sure answers, immediate numbered guidance and restart. In Sepedi, verify every question and management step with a fluent local speaker. New Sepedi copy is a draft, not accepted natural-language localization; arrange review with farmers from Ga-Matlapa and Mankweng and an agricultural extension adviser.

Automated regression: tests/e2e/faw.spec.js covers the default screen, incomplete answers, no-reported-signs and uncertain outcomes, clearing stale results, reset, and Sepedi guidance after a cold offline reload at 375 px. Existing calculator tests explicitly navigate to the secondary calculator. Keep the original encrypted logbook/sync checks. Lint and production build passed; all 16 unit/backend/storage/localization checks passed with local-server access enabled. Browser results are recorded after the current run.

Real-device gate: load online, wait for service-worker installation, close, enable Airplane Mode with Wi-Fi disabled and reopen. Complete the Sepedi checklist and read all reference material and management steps without connectivity. External source links require internet; the on-screen reference summary does not. Preserve the existing fictional-note offline persistence/reconnect demo. Diagnostic accuracy, local contact information, actual phone acceptance and fluent-speaker sign-off remain pending.
Browser verification: all 11 scenarios passed across the full run and the recovery-test rerun. The alternate-port run exposed a hard-coded recovery URL; sync.spec.js now derives the app origin from the current page. Sepedi cold offline reload and phone layout passed in Edge emulation, not on a real phone.

## UI brief phase gates — current

Follow the user's four-phase order and stop with screenshots at each checkpoint. Phase 1 acceptance runs `node scripts/check-ui-contrast.mjs`, `node --test tests/localization.test.mjs`, the production build and `node node_modules/@playwright/test/cli.js test --config playwright.ui.config.js`. Screenshots are saved under docs/ui/phase1/. The browser suite checks language selection, all three homes, hidden wizard tabs, primary-action bounds and no document overflow at 360×640, 390×844, 768×1024, 1366×768, 360×320 and 640×360, in English, +40% pseudo text and 200% root text. Offline reload, language persistence, dialog focus restoration and Chromium's actual platform-font report are also checked. This simulates enlarged Android text; a real Android/font-setting test remains pending.

Phase 2: finish calculator flow and update its regression navigation. Phase 3: shared data-defined diagnosis/logbook steps, 3 recent entries, All entries pages of 3 below 700px and 5 otherwise, all security/account/conflict handlers preserved. Phase 4: full state screenshots in one scripted run, all existing regressions, Lighthouse and changelog. New UI copy must remain English only until the localization lead supplies translations. Do not treat older end-to-end selectors or the prior acceptance report as proof of this new UI's complete flow.
Phase 1 result: production build passed; all 19 phase-1 browser checks passed in one final scripted run; all 4 localization checks and intended contrast usages passed. Full old tool regressions and Lighthouse have not yet been accepted for the redesign.

## Phase 2 calculator acceptance

Run `node node_modules/@playwright/test/cli.js test --config playwright.ui.config.js` after the production build. The calculator matrix completes all five steps at six sizes in English, pseudo-locale +40% and simulated 200% text, checking both action buttons remain inside the viewport. It checks invalid area recovery, review details, unchanged known outputs, stale-result removal, retained inputs, restart and home return. Additional cases cover keyboard Enter, tomato/LAN, minimum area, excessive output, and cold offline calculator use in nso/ve/ts with English fallback for untranslated new UI keys. Screenshots of every calculator screen/error and scrolled result details are saved under docs/ui/phase2/. The sample maize/urea calculation for 2 ha is 435 kg under the active formula; the historical prototype's 100 kg checklist is not this calculator's acceptance value.

The production build, changed-file lint, all 17 unit/backend/storage/localization checks, and intended token contrast checks passed. Record the final browser-matrix result after completion. Phase 3/4 full-flow regression, Lighthouse and real Android acceptance remain pending.

Final phase-2 browser result: all 41 phase-1/phase-2 checks passed in one final run (19 shell checks, 22 calculator checks). Every calculator step and its error/results are covered at all six viewports, in English, +40% pseudo text and simulated 200% text. Cold offline calculations passed in nso/ve/ts. Screenshots were visually checked at phone/desktop sizes and the short enlarged-text action layout. No real-device or Lighthouse acceptance is claimed. Stop here for screenshot review before phase 3.
The adapted existing ui.spec.js calculator regression also passed separately through the new navigation.

## Phase 3 diagnosis and logbook acceptance

Check the corrected Logbook home has no passphrase input when unlocked. Run the combined playwright.ui.config.js suite after building. Phase-3 coverage completes diagnosis, all six possible-outbreak management steps, protection, add/review/save, details/edit and recent/paged entries at all six sizes in English, +40% pseudo strings and simulated 200% text. Actions must be reachable and the document must not overflow. The offline case verifies wrong-passphrase recovery, cold reload, full note details, encrypted backup and locking. The account/conflict case verifies explicit sharing, actual encrypted upload, reviewed remote content and the resolved server version.

Use sequential Node tests (`node --test --test-concurrency=1 tests/*.test.mjs`) on this Windows host to avoid memory exhaustion from concurrent workers. The UI browser launch uses disabled GPU and a reduced renderer count following an environmental renderer crash. These browser settings do not change app behavior. Phase 4 still owns full legacy e2e navigation migration, remaining state screenshots and Lighthouse. Stop with screenshots for the user's phase-3 review.

The final focused regression also checks edited notes have an explicit label association and the delete dialog keeps a scrollable message body plus pinned actions at 360×320 with 200% text. It verifies Escape restores focus and deletion completes through the existing encrypted-store handler.

Phase-3 checkpoint results: all 63 combined phase-1/phase-2/phase-3 browser checks passed in one run, and all 17 backend/storage/localization tests passed sequentially. Build, changed-file lint and contrast checks passed. The final minor dialog spacing/protection progress/strong-border adjustments are rechecked separately with phone, desktop and large-text deletion cases. Do not count this checkpoint as the phase-4 full-state gallery, Lighthouse, complete old e2e selector migration or real-device validation.

Branding adjustment: confirm AgriSmart in the header, document title and PWA manifest, and no decorative icon above any tool-home heading. Preserve existing database/encryption/backup/sync identifiers. This is a presentation adjustment; phase 4 remains pending.
