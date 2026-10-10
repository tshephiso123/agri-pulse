import { defineConfig } from '@playwright/test';
const port = process.env.E2E_PORT || '4184';
const origin = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/e2e',
  // Active AgriPulse screens. Alternate wizard tests remain as redesign references.
  testMatch: ['field-tools.spec.js', 'offline-kit.spec.js', 'sync.spec.js'],
  workers: 1,
  timeout: 45000,
  use: { baseURL: origin, browserName: 'chromium', ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) },
  webServer: { command: 'node server/index.mjs', url: origin + '/api/v1/health', env: { PORT: port, PUBLIC_ORIGIN: origin, DATABASE_PATH: ':memory:' }, reuseExistingServer: false }
});
