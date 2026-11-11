import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  globalSetup: './tests/browser/server.mjs',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: process.env.CHROME_CHANNEL || undefined
  }
});
