# Sprint execution and acceptance

## Current launch

For Vercel import the GitHub repository and use main as Production Branch. Configuration lives in vercel.json; npm run build:vercel generates the offline/static version with local encrypted notes and backups. Cloud sync is not connected in this build. Follow docs/vercel.md for HTTPS and phone acceptance.

Use Node 24. Run npm ci, npm run build, npm start. Open http://localhost:4173; the chat preview is localhost:4174. Use fictional records. The active app is React; legacy/ preserves the original prototype.

## Demonstrate the selling point

1. Open the HTTPS PWA with connectivity, install it and wait for offline readiness. Switch on Airplane Mode with Wi-Fi disabled; close and reopen it.
2. Without an account, run the sample fertilizer calculator. Select crop/product/area. Explain kg, whole purchasing bags and measured 15 kg quantities; these are sample targets, not a complete NPK plan.
3. Show optional adviser-provided nitrogen credit. Enter kg/ha only, not raw laboratory ppm. Select sandy soil through the soil guide; show the placement/split-application caution.
4. Follow crop questions, use Back and Restart. Outcomes are possible causes; pesticide arithmetic requires the exact product label rate and never guesses bottle-cap dosing.
5. Read the jar observation and soil guidance offline. The jar cannot measure nutrient availability.
6. Create a local encryption passphrase and save a local note with no account. Reopen and unlock. Export an encrypted backup and copy it to another device.
7. For optional cloud recovery, register with a separate password, explicitly share a note, sync online, then restore on another browser profile using credentials and the original passphrase.
8. Download the offline field kit while connected, send the HTML file to another phone, and open it in a compatible browser with connectivity off. This shows basic information/arithmetic access without installing the PWA; it does not include a logbook.

## Acceptance

For the refreshed interface, check 320px and 390px widths, full-name language dropdown persistence after reload, keyboard focus, and navigation across all five tools. No external fonts or image requests are required.

Automated checks: npm test (20 tests including incoming localization checks), npm run lint, npm run build:vercel. Browser checks cover account-free offline field tools, local-file kit operation without HTTP requests, offline persistence and recovery, worker queue execution and conflicts. See test output for latest execution status.

Required device checks still pending: low-end Android installation and cold launch, small-screen readability, all language choices, local HTML opening via file manager, phone-to-phone transfer, destruction/replacement recovery, measured-cap usability. Native speakers must review existing translations and translate new guidance, which currently falls back to English.

## Owners and remaining work

- Frontend/PWA: installation and device acceptance; readable language selection.
- Backend: durable cloud deployment, recovery and backup workflows; no officer access without an explicit consent and key-sharing design.
- Content/QA: validated crop targets, diagnoses and translations; never use arbitrary treatment rates.
- Lead: verify actual distribution channels with farmers/cooperatives. Present free offline use without claiming zero download/update data costs or existing partnerships.

Maintain H42 feature freeze and H42–48 rehearsal/testing. Preserve the Airplane Mode demonstration. Keep officer dashboard work in Phase 2 until authorization, privacy and encryption-key access are designed.
