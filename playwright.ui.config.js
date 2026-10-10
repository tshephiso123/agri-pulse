import { defineConfig } from '@playwright/test';
import config from './playwright.config.js';
export default defineConfig({ ...config, testMatch: '**/*.spec.js', use: { ...config.use, launchOptions: { args: ['--disable-gpu', '--renderer-process-limit=2'] }, baseURL: 'http://127.0.0.1:4190' }, webServer: { ...config.webServer, url: 'http://127.0.0.1:4190/api/v1/health', env: { ...config.webServer.env, PORT: '4190', PUBLIC_ORIGIN: 'http://127.0.0.1:4190' } } });
