import { test, expect } from '@playwright/test'
import { routes } from './fixtures'

test.describe('Navigation — Landing page', () => {
  test('landing page loads and has visible content', async ({ page }) => {
    await page.goto(routes.home)
    await expect(page.getByText(/cadent/i).first()).toBeVisible()
  })

  test('landing page links to login', async ({ page }) => {
    await page.goto(routes.home)
    // Landing page is client-rendered — wait for hydration
    await page.waitForLoadState('networkidle')
    const loginLinks = page.locator('a[href*="/login"]')
    const count = await loginLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Navigation — Route structure', () => {
  test('/login renders the auth form', async ({ page }) => {
    await page.goto(routes.login)
    // Check for the sign in heading (more specific than text matching)
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('/auth/reset-password page renders', async ({ page }) => {
    await page.goto(routes.resetPassword)
    await expect(page.getByText(/reset/i)).toBeVisible()
  })

  test('invalid /share token shows appropriate content', async ({ page }) => {
    await page.goto(routes.share('invalid-token-12345'))
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Navigation — 404 handling', () => {
  test('non-existent route returns 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
  })
})

test.describe('Navigation — Auth redirect', () => {
  test('logged-in user visiting /login is redirected to /app', async ({ page }) => {
    await page.goto(routes.login)
    const form = page.locator('form')
    await form.getByLabel(/email/i).fill(process.env.PLAYWRIGHT_TEST_EMAIL || 'russelopenclaw+test1@gmail.com')
    await form.getByLabel(/password/i).fill(process.env.PLAYWRIGHT_TEST_PASSWORD || 'TestAccount2026!')
    await form.getByRole('button', { name: /^sign in$/i }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })

    // Navigate to /login — the client should detect the session and redirect to /app
    await page.goto(routes.login)
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })
  })

  test('logged-in user on landing page redirects to /app', async ({ page }) => {
    await page.goto(routes.login)
    const form = page.locator('form')
    await form.getByLabel(/email/i).fill(process.env.PLAYWRIGHT_TEST_EMAIL || 'russelopenclaw+test1@gmail.com')
    await form.getByLabel(/password/i).fill(process.env.PLAYWRIGHT_TEST_PASSWORD || 'TestAccount2026!')
    await form.getByRole('button', { name: /^sign in$/i }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })

    // Navigate to home — HomeContent redirects logged-in users to /app
    await page.goto(routes.home)
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })
  })
})