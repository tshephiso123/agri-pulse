import { execSync } from 'node:child_process';
// Vercel hosts the free offline tools. Its filesystem cannot persist our SQLite API.
execSync('npm run build', { stdio: 'inherit', env: { ...process.env, VITE_CLOUD_ENABLED: 'false' } });
