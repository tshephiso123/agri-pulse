# Vercel deployment from main

Import tshephiso123/agri-pulse into Vercel and select main as the Production Branch. Use the repository root, Vite framework, Node 24, install command npm ci, build command npm run build:vercel and output directory dist. These build settings are committed in vercel.json.

The Vercel deployment serves the calculator, diagnostics, soil guide, downloadable offline field kit and local encrypted logbook over HTTPS. Cloud account controls and shared writes are disabled at build time with VITE_CLOUD_ENABLED=false. Encrypted backup export/restore remains available offline.

The current Node SQLite backend cannot keep durable database files in Vercel Functions. Do not claim cloud recovery works on this static deployment. To enable it, separately design persistent API hosting and a same-origin proxy with matching origin/cookie protections, or migrate to an external database. Do not point the app at an arbitrary API URL; its security relies on same-origin requests.

After deploying, check /, /manifest.webmanifest, /sw.js and /agripulse-offline.html. Install on a phone over HTTPS, reopen with Airplane Mode and Wi-Fi disabled, then test local note persistence and external backup restore. Do not count browser emulation as final phone acceptance.

Vercel reference: https://vercel.com/docs/git and https://vercel.com/kb/guide/is-sqlite-supported-in-vercel
