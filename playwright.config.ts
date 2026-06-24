import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for Cadent E2E tests.
 *
 * Tests run against the LIVE site at cadent.online by default.
 * Set BASE_URL=http://localhost:3002 to run against a local dev server.
 *
 * Multi-device: Desktop, Tablet (768px), Mobile (375px)
 * Multi-browser: Chromium, Firefox, WebKit (catches Chrome-specific bugs)
 * Multi-user: tests/multi-user.spec.ts uses two browser contexts (like incognito)
 *
 * Auth tests use real Supabase credentials (test accounts).
 * Override via env vars: PLAYWRIGHT_TEST_EMAIL, PLAYWRIGHT_TEST_PASSWORD, etc.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // auth tests share state, run serially for safety
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // serial — avoids Supabase rate limits and state collisions
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/html-report' }],
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
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        userAgent: undefined, // use default, not mobile UA
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
      },
    },
    // Uncomment Firefox/WebKit to catch browser-specific bugs:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
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