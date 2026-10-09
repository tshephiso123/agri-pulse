import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4184', browserName: 'chromium', ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) },
  webServer: { command: 'node server/index.mjs', url: 'http://127.0.0.1:4184/api/v1/health', env: { PORT: '4184', PUBLIC_ORIGIN: 'http://127.0.0.1:4184', DATABASE_PATH: ':memory:' }, reuseExistingServer: false }
});
