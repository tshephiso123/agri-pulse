# Phase 4 acceptance and screenshot gallery

AgriSmart starts with language selection and four short farm setup steps. Crop check offers maize, tomato, beans and cabbage. Maize results show immediate management guidance; other crops show general inspection and adviser guidance pending a validated crop-specific diagnostic library. See [content scope](../crop-checks.md).

The scripted browser run includes all earlier phase and encrypted-sync regressions. It tests 360×640, 390×844, 768×1024, 1366×768, 360×320 and 640×360, English, strings expanded 40%, and 200% root text. Primary actions must remain in the viewport; long content scrolls inside the shell. PWA checks validate the manifest, icons, Chromium installability and a cold offline reload.

Each phone/desktop gallery folder contains PNG screenshots and a states.json inventory. Screens include farm validation/storage error and retry, crop results/guidance, calculator, loading/failing storage, saved records, editing/deletion, encrypted backup/restore, account controls and real encrypted conflict resolution. Failure/latency injection exists only in tests. All records and accounts used for verification are fictional.

Lighthouse reports are in [lighthouse/360.html](lighthouse/360.html) and [lighthouse/1366.html](lighthouse/1366.html), with machine-readable scores in lighthouse/summary.json. These are accessibility snapshots, not performance scores. Automated checks supplement real Android keyboard/font/install testing and fluent-speaker/agronomic review, which remain pending.

Reproduce browser checks after npm run build:

```powershell
node node_modules/@playwright/test/cli.js test --config playwright.ui.config.js --workers=1
```

Reproduce the separate accessibility audit against a running production server:

```powershell
npm install --prefix .tools/lighthouse --no-save --no-package-lock lighthouse
node scripts/audit-ui-accessibility.mjs http://127.0.0.1:4193
```

The audit uses the installed Microsoft Edge on Windows. Its isolated ignored tooling does not change app dependencies.

Final verification: 100 browser scenarios passed (88 in the complete run, plus 12 targeted rechecks for Windows screenshot-write interruptions). There were no application/assertion failures in that final run. The bounded filesystem retry resolves those interruptions. All 17 Node cases, lint, build and intended contrast checks pass; all 62 Lighthouse accessibility snapshots score 100 without failed audits. Six galleries contain 546 screenshots. See acceptance.json, browser-results.json and browser-recheck-results.json for the recorded evidence.
