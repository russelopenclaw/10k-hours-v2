import { test as base, expect, type Page, type Browser } from '@playwright/test'

// Test credentials — Supabase test accounts
// russelopenclaw+test1@gmail.com / TestAccount2026!  (student)
// russelopenclaw+test2@gmail.com / TestAccount2026!  (teacher)
// Override via env vars: PLAYWRIGHT_TEST_EMAIL, PLAYWRIGHT_TEST_PASSWORD

export const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || 'russelopenclaw+test1@gmail.com'
export const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || 'TestAccount2026!'
export const TEST_TEACHER_EMAIL = process.env.PLAYWRIGHT_TEST_TEACHER_EMAIL || 'russelopenclaw+test2@gmail.com'
export const TEST_TEACHER_PASSWORD = process.env.PLAYWRIGHT_TEST_TEACHER_PASSWORD || 'TestAccount2026!'

export const BASE_URL = process.env.BASE_URL || 'https://www.cadent.online'

// Routes
export const routes = {
  home: '/',
  login: '/login',
  app: '/app',
  teacherApp: '/app/teacher',
  authCallback: '/auth/callback',
  resetPassword: '/auth/reset-password',
  share: (token: string) => `/share/${token}`,
  robots: '/robots.txt',
  sitemap: '/sitemap.xml',
  manifest: '/manifest.json',
}

/**
 * Sign in as a student via the login form.
 * Waits for auth redirect and data to load.
 */
export async function signInAsStudent(page: Page) {
  await page.goto(routes.login)
  const form = page.locator('form')
  await form.getByLabel(/email/i).fill(TEST_EMAIL)
  await form.getByLabel(/password/i).fill(TEST_PASSWORD)
  await form.getByRole('button', { name: /^sign in$/i }).click()
  // Wait for redirect to /app (student dashboard)
  await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })
  // Wait for auth to resolve and content to load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

/**
 * Sign in as a teacher via the login form.
 * Waits for auth redirect to /app/teacher.
 */
export async function signInAsTeacher(page: Page) {
  await page.goto(routes.login)
  const form = page.locator('form')
  await form.getByLabel(/email/i).fill(TEST_TEACHER_EMAIL)
  await form.getByLabel(/password/i).fill(TEST_TEACHER_PASSWORD)
  await form.getByRole('button', { name: /^sign in$/i }).click()
  // Wait for redirect to /app (then AppContent redirects teachers to /app/teacher)
  await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })
  await page.waitForURL(/\/app(\/teacher)?/, { timeout: 10_000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

/**
 * Assert that NO infinite spinner is present on the page.
 * Checks for Tailwind animate-spin class (used by all Cadent spinners).
 * Use after page transitions and tab clicks to catch spinner hangs.
 */
export async function expectNoSpinner(page: Page, timeout = 5000) {
  // Wait a beat for spinners that should resolve
  await page.waitForTimeout(1000)
  const spinnerCount = await page.locator('.animate-spin').count()
  expect(spinnerCount, `Found ${spinnerCount} infinite spinner(s) on page`).toBe(0)
}

/**
 * Assert that a page section loads within a reasonable time (no infinite spinner).
 * Waits for the section to show content (not a loading state).
 */
export async function expectSectionLoaded(page: Page, selector: string, timeout = 10000) {
  const section = page.locator(selector)
  await expect(section).toBeVisible({ timeout })
  const spinners = section.locator('.animate-spin')
  const spinnerCount = await spinners.count()
  expect(spinnerCount, `Section "${selector}" still has ${spinnerCount} spinner(s)`).toBe(0)
}

/**
 * Multi-user test fixtures.
 * Creates two separate browser contexts (like two incognito windows)
 * so a teacher and student can interact simultaneously.
 *
 * Usage:
 *   import { multiUserTest as test, expect } from './fixtures'
 *   test('teacher assigns, student sees', async ({ teacherPage, studentPage }) => {
 *     await signInAsTeacher(teacherPage)
 *     await signInAsStudent(studentPage)
 *     // ... interact between the two
 *   })
 */
type MultiUserFixtures = {
  teacherPage: Page
  studentPage: Page
}

export const multiUserTest = base.extend<MultiUserFixtures>({
  teacherPage: async ({ browser }, use) => {
    const teacherContext = await browser.newContext()
    const teacherPage = await teacherContext.newPage()
    await use(teacherPage)
    await teacherContext.close()
  },
  studentPage: async ({ browser }, use) => {
    const studentContext = await browser.newContext()
    const studentPage = await studentContext.newPage()
    await use(studentPage)
    await studentContext.close()
  },
})

export { base as test, expect }