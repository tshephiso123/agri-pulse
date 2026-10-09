# Sprint execution and handoff

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
