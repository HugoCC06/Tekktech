import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the production build (`npm run build` first).
 * Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to use an already-installed Chromium;
 * otherwise run `npx playwright install chromium` once.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions: { executablePath } } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 }, launchOptions: { executablePath } },
      testMatch: /mobile|responsive/,
    },
  ],
  webServer: {
    command: 'npx astro preview --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
