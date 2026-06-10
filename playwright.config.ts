import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for Cadent E2E tests.
 *
 * Tests run against the LIVE site at cadent.online by default.
 * Set BASE_URL=http://localhost:3002 to run against a local dev server.
 *
 * Auth tests use real Supabase credentials (test accounts).
 * Store them in .env.test or set PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD env vars.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // auth tests share state, run serially for safety
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // serial — avoids Supabase rate limits and state collisions
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/html' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://www.cadent.online',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.BASE_URL?.includes('localhost')
    ? {
        command: 'npm run dev',
        url: 'http://localhost:3002',
        reuseExistingServer: true,
        timeout: 60_000,
      }
    : undefined,
})