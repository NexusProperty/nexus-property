import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  retries: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
}); 