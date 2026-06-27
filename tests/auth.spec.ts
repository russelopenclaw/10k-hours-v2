import { test, expect } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD, routes, signInAsStudent, expectNoSpinner } from './fixtures'

test.describe('Authentication', () => {
  test.describe('Login page', () => {
    test('shows login form by default', async ({ page }) => {
      await page.goto(routes.login)
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
      const form = page.locator('form')
      await expect(form.getByLabel(/email/i)).toBeVisible()
      await expect(form.getByLabel(/password/i)).toBeVisible()
      await expect(form.getByRole('button', { name: /^sign in$/i })).toBeVisible()
    })

    test('has toggle to switch to signup', async ({ page }) => {
      await page.goto(routes.login)
      await page.getByRole('button', { name: /create account/i }).first().click()
      await expect(page.getByRole('heading', { name: /create your free account/i })).toBeVisible()
      await expect(page.getByLabel(/full name/i)).toBeVisible()
    })

    test('has toggle to switch back to signin from signup', async ({ page }) => {
      await page.goto(routes.login)
      await page.getByRole('button', { name: /create account/i }).first().click()
      await page.getByRole('button', { name: 'Sign In', exact: true }).click()
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    })

    test('has forgot password link', async ({ page }) => {
      await page.goto(routes.login)
      await page.getByRole('button', { name: /forgot password/i }).click()
      await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible()
    })

    test('shows signup mode when URL has ?mode=signup', async ({ page }) => {
      await page.goto(`${routes.login}?mode=signup`)
      await expect(page.getByRole('heading', { name: /create your free account/i })).toBeVisible()
    })

    test('sign up / sign in toggle footer link works', async ({ page }) => {
      await page.goto(routes.login)
      await page.getByRole('button', { name: /sign up free/i }).click()
      await expect(page.getByRole('heading', { name: /create your free account/i })).toBeVisible()
    })
  })

  test.describe('Sign in flow', () => {
    test('can sign in with valid credentials and see dashboard (no spinner)', async ({ page }) => {
      await signInAsStudent(page)
      // Dashboard should be fully loaded — no infinite spinners
      await expectNoSpinner(page)
      // Should see the Cadent header
      await expect(page.getByRole('heading', { name: 'Cadent' })).toBeVisible()
    })

    test('shows error with invalid credentials', async ({ page }) => {
      await page.goto(routes.login)
      const form = page.locator('form')
      await form.getByLabel(/email/i).fill('nonexistent@test.com')
      await form.getByLabel(/password/i).fill('wrongpassword123')
      await form.getByRole('button', { name: /^sign in$/i }).click()

      await expect(page.getByText(/invalid login credentials/i)).toBeVisible({ timeout: 10_000 })
    })

    test('sign in form requires email and password', async ({ page }) => {
      await page.goto(routes.login)
      const form = page.locator('form')
      const emailInput = form.getByLabel(/email/i)
      const passwordInput = form.getByLabel(/password/i)
      await expect(emailInput).toHaveAttribute('required', '')
      await expect(passwordInput).toHaveAttribute('required', '')
    })
  })

  test.describe('Sign up flow', () => {
    test('shows signup form fields', async ({ page }) => {
      await page.goto(`${routes.login}?mode=signup`)
      await expect(page.getByLabel(/full name/i)).toBeVisible()
      const form = page.locator('form')
      await expect(form.getByLabel(/email/i)).toBeVisible()
      await expect(form.getByLabel(/password/i)).toBeVisible()
      await expect(form.getByRole('button', { name: /create account/i })).toBeVisible()
    })

    test('has teacher toggle', async ({ page }) => {
      await page.goto(`${routes.login}?mode=signup`)
      await expect(page.getByText(/i'm a teacher/i)).toBeVisible()
    })

    test('signup form has minimum password length', async ({ page }) => {
      await page.goto(`${routes.login}?mode=signup`)
      const passwordInput = page.locator('input[minLength="6"]')
      await expect(passwordInput).toBeVisible()
    })
  })

  test.describe('Logout flow', () => {
    test('can log out via user menu and redirects to login', async ({ page }) => {
      await signInAsStudent(page)
      // Open user menu dropdown (name + chevron) — use .first() because Header renders desktop + mobile
      await page.locator('[data-slot="dropdown-menu-trigger"]').first().click()
      // Click "Sign Out"
      await page.getByRole('menuitem', { name: /sign out/i }).click()
      // Should redirect back to login
      await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10_000 })
    })
  })

  test.describe('Protected routes', () => {
    test('unauthenticated /app redirects to login (client-side)', async ({ page }) => {
      await page.goto(routes.app)
      // AuthProvider handles redirect client-side, not server-side
      await expect(page).toHaveURL(new RegExp(routes.login), { timeout: 15_000 })
    })

    test('unauthenticated /auth/reset-password page renders', async ({ page }) => {
      await page.goto(routes.resetPassword)
      await expect(page.getByText(/reset/i)).toBeVisible()
    })
  })

  test.describe('Auth callback', () => {
    test('auth callback without code redirects to home', async ({ page }) => {
      await page.goto(routes.authCallback)
      await expect(page).toHaveURL(routes.home, { timeout: 10_000 })
    })
  })
})