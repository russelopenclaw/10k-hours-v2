/**
 * Regression tests for the specific bugs we've been fixing:
 * - Infinite spinners on tab switch after Chrome tab suspension
 * - Base UI error #31 (DropdownMenuLabel outside DropdownMenuGroup)
 * - Teacher header showing gear instead of name+dropdown
 * - Change Display Name modal hanging on "Updating..."
 * - Assignment badge not appearing on tab
 * - Teacher "badge" should say "Teacher Portal"
 * - Sign out should redirect to /login
 */
import { test, expect } from '@playwright/test'
import { signInAsStudent, signInAsTeacher, expectNoSpinner, routes } from './fixtures'

test.describe('Student Dashboard — Regression', () => {
  test('student dashboard loads without infinite spinner', async ({ page }) => {
    await signInAsStudent(page)
    // The main content area should render — no persistent spinner
    await expect(page.getByRole('heading', { name: 'Cadent' })).toBeVisible({ timeout: 10_000 })
    await expectNoSpinner(page)
  })

  test('student header shows display name (not just email)', async ({ page }) => {
    await signInAsStudent(page)
    // The user menu trigger should show the display name, not just an icon
    const menuTrigger = page.locator('[data-slot="dropdown-menu-trigger"]')
    await expect(menuTrigger).toBeVisible({ timeout: 10_000 })
    // Should contain text (the display name), not just an icon
    const text = await menuTrigger.textContent()
    expect(text?.trim().length, 'Menu trigger should show display name, not empty').toBeGreaterThan(0)
  })

  test('student can open Change Display Name from dropdown', async ({ page }) => {
    await signInAsStudent(page)
    // Open user menu
    await page.locator('[data-slot="dropdown-menu-trigger"]').click()
    // "Change Display Name" should be in the dropdown
    await expect(page.getByRole('menuitem', { name: /change display name/i })).toBeVisible()
  })

  test('student can change display name — modal closes after save', async ({ page }) => {
    await signInAsStudent(page)
    const menuTrigger = page.locator('[data-slot="dropdown-menu-trigger"]').first()
    const originalName = await menuTrigger.textContent()

    // Open dropdown and click "Change Display Name"
    await menuTrigger.click()
    await page.getByRole('menuitem', { name: /change display name/i }).click()

    // Dialog should appear
    await expect(page.getByRole('heading', { name: /change display name/i })).toBeVisible()

    // Clear the existing name and type a new one
    // Use getByRole('textbox') to avoid strict mode violation with dialog aria-label
    const nameInput = page.getByRole('textbox', { name: /display name/i })
    await nameInput.clear()
    await nameInput.fill('Test Student Playwright')

    // Click Update
    await page.getByRole('button', { name: /update name/i }).click()

    // Should show success screen
    await expect(page.getByText(/display name updated successfully/i)).toBeVisible({ timeout: 10_000 })

    // Click Done to close
    await page.getByRole('button', { name: /done/i }).click()

    // Modal should close
    await expect(page.getByRole('heading', { name: /change display name/i })).not.toBeVisible({ timeout: 5_000 })

    // The header should now show the new name
    await expect(menuTrigger).toContainText('Test Student Playwright', { timeout: 5_000 })

    // Reset the name back to avoid polluting other tests
    await menuTrigger.click()
    await page.getByRole('menuitem', { name: /change display name/i }).click()
    const resetInput = page.getByRole('textbox', { name: /display name/i })
    await resetInput.clear()
    await resetInput.fill(originalName?.trim() || 'Test1')
    await page.getByRole('button', { name: /update name/i }).click()
    await expect(page.getByText(/display name updated successfully/i)).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /done/i }).click()
    await expect(page.getByRole('heading', { name: /change display name/i })).not.toBeVisible({ timeout: 5_000 })
  })

  test('Assignments tab loads without infinite spinner', async ({ page }) => {
    await signInAsStudent(page)
    // Click on the Assignments tab
    await page.getByRole('tab', { name: /assignments/i }).click()
    // Wait for content to appear (either assignments list or empty state)
    await page.waitForTimeout(3000)
    // No spinner should be spinning indefinitely
    await expectNoSpinner(page)
    // Should see either "No assignments yet" or assignment content
    const noAssignments = page.getByText(/no assignments yet/i)
    const assignmentContent = page.locator('[data-slot="card"]')
    const hasContent = await noAssignments.isVisible().catch(() => false) || await assignmentContent.first().isVisible().catch(() => false)
    expect(hasContent, 'Assignments tab should show content or empty state, not a spinner').toBeTruthy()
  })

  test('Analytics tab loads without infinite spinner', async ({ page }) => {
    await signInAsStudent(page)
    // Click on the Analytics tab
    await page.getByRole('tab', { name: /analytics/i }).click()
    await page.waitForTimeout(3000)
    await expectNoSpinner(page)
    // Should show either analytics content or "No practice data yet"
    const noData = page.getByText(/no practice data yet/i)
    const analyticsContent = page.getByText(/practice analytics/i)
    const hasContent = await noData.isVisible().catch(() => false) || await analyticsContent.isVisible().catch(() => false)
    expect(hasContent, 'Analytics tab should show content or empty state, not a spinner').toBeTruthy()
  })

  test('Library tab loads without infinite spinner', async ({ page }) => {
    await signInAsStudent(page)
    // Library is the default tab — should already be loaded
    await expectNoSpinner(page)
    // Should see song library content or "Add your first song" empty state
    const addSong = page.getByRole('button', { name: /add song/i })
    await expect(addSong).toBeVisible({ timeout: 10_000 })
  })

  test('student dropdown does NOT throw Base UI error #31', async ({ page }) => {
    await signInAsStudent(page)
    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    // Open the user menu dropdown
    await page.locator('[data-slot="dropdown-menu-trigger"]').first().click()

    // The dropdown should open without errors
    await expect(page.getByRole('menuitem', { name: /change display name/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /sign out/i })).toBeVisible()

    // No Base UI error #31 should appear
    const baseUIErrors = consoleErrors.filter(e => e.includes('#31') || e.includes('Base UI'))
    expect(baseUIErrors, `Found Base UI errors: ${baseUIErrors.join(', ')}`).toHaveLength(0)
  })

  test('sign out redirects to /login', async ({ page }) => {
    await signInAsStudent(page)
    // Open user menu
    await page.locator('[data-slot="dropdown-menu-trigger"]').first().click()
    // Click Sign Out
    await page.getByRole('menuitem', { name: /sign out/i }).click()
    // Should redirect to /login
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10_000 })
  })
})

test.describe('Teacher Dashboard — Regression', () => {
  test('teacher dashboard loads without infinite spinner', async ({ page }) => {
    await signInAsTeacher(page)
    await expect(page.getByRole('heading', { name: 'Cadent' })).toBeVisible({ timeout: 10_000 })
    await expectNoSpinner(page)
  })

  test('teacher header shows "Teacher Portal" badge (not just "Teacher")', async ({ page }) => {
    await signInAsTeacher(page)
    await expect(page.getByText('Teacher Portal')).toBeVisible({ timeout: 10_000 })
  })

  test('teacher header shows name+dropdown (NOT gear icon)', async ({ page }) => {
    await signInAsTeacher(page)
    // The header should show the teacher's name as a dropdown trigger, not a gear icon
    const menuTrigger = page.locator('[data-slot="dropdown-menu-trigger"]').first()
    await expect(menuTrigger).toBeVisible({ timeout: 10_000 })
    // Should contain text (the display name), not just an SVG gear icon
    const text = await menuTrigger.textContent()
    expect(text?.trim().length, 'Teacher header should show name, not gear icon').toBeGreaterThan(0)
  })

  test('teacher dropdown has Change Display Name option', async ({ page }) => {
    await signInAsTeacher(page)
    await page.locator('[data-slot="dropdown-menu-trigger"]').first().click()
    await expect(page.getByRole('menuitem', { name: /change display name/i })).toBeVisible()
  })

  test('teacher dropdown does NOT throw Base UI error #31', async ({ page }) => {
    await signInAsTeacher(page)
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.locator('[data-slot="dropdown-menu-trigger"]').first().click()
    await expect(page.getByRole('menuitem', { name: /change display name/i })).toBeVisible()

    const baseUIErrors = consoleErrors.filter(e => e.includes('#31') || e.includes('Base UI'))
    expect(baseUIErrors, `Found Base UI errors: ${baseUIErrors.join(', ')}`).toHaveLength(0)
  })

  test('teacher can change display name — success screen then close', async ({ page }) => {
    await signInAsTeacher(page)
    const menuTrigger = page.locator('[data-slot="dropdown-menu-trigger"]').first()
    const originalName = await menuTrigger.textContent()

    await menuTrigger.click()
    await page.getByRole('menuitem', { name: /change display name/i }).click()
    await expect(page.getByRole('heading', { name: /change display name/i })).toBeVisible()

    const nameInput = page.getByRole('textbox', { name: /display name/i })
    await nameInput.clear()
    await nameInput.fill('Test Teacher Playwright')

    await page.getByRole('button', { name: /update name/i }).click()

    // Should show success screen
    await expect(page.getByText(/display name updated successfully/i)).toBeVisible({ timeout: 10_000 })

    // Click Done to close
    await page.getByRole('button', { name: /done/i }).click()
    await expect(page.getByRole('heading', { name: /change display name/i })).not.toBeVisible({ timeout: 5_000 })

    // Reset name back
    await menuTrigger.click()
    await page.getByRole('menuitem', { name: /change display name/i }).click()
    const resetInput = page.getByRole('textbox', { name: /display name/i })
    await resetInput.clear()
    await resetInput.fill(originalName?.trim() || 'Teacher')
    await page.getByRole('button', { name: /update name/i }).click()
    await expect(page.getByText(/display name updated successfully/i)).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /done/i }).click()
    await expect(page.getByRole('heading', { name: /change display name/i })).not.toBeVisible({ timeout: 5_000 })
  })

  test('teacher sign out redirects to /login', async ({ page }) => {
    await signInAsTeacher(page)
    await page.locator('[data-slot="dropdown-menu-trigger"]').first().click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10_000 })
  })
})

test.describe('Student Dashboard — Back button', () => {
  test('pressing back after navigation does not show infinite spinner', async ({ page }) => {
    // Sign in and wait for dashboard to load
    await signInAsStudent(page)
    await expectNoSpinner(page)

    // Wait for "My Songs" heading to confirm full load
    await page.locator('h2, h3, h1').filter({ hasText: 'My Songs' }).waitFor({ timeout: 10_000 })

    // Navigate away within the same origin (to avoid auth session issues)
    await page.goto('https://www.cadent.online/privacy')
    await page.waitForLoadState('networkidle')

    // Go back — should restore dashboard without infinite spinner
    await page.goBack()
    // Wait for content to appear (spinner should be skipped via sessionStorage)
    await page.locator('h2, h3, h1').filter({ hasText: 'My Songs' }).waitFor({ timeout: 15_000 })

    // Give inline spinners time to resolve
    await page.waitForTimeout(2000)

    // No full-page spinner should be stuck
    const fullPageSpinnerCount = await page.locator('.min-h-screen > .animate-spin, .min-h-screen .animate-spin.rounded-full').count()
    expect(fullPageSpinnerCount, 'Full-page spinner should not be stuck after back navigation').toBe(0)

    // Should still be on /app
    await expect(page).toHaveURL(/\/app/, { timeout: 5_000 })
  })
})

test.describe('Student Dashboard — Console errors', () => {
  test('dashboard has no critical console errors after load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await signInAsStudent(page)
    await expectNoSpinner(page)

    // Wait for realtime subscriptions to connect
    await page.waitForTimeout(3000)

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR')
    )
    // Ignore realtime channel errors that might happen in test (no actual data changes)
    const filteredErrors = criticalErrors.filter(
      (e) => !e.includes('[Realtime]') && !e.includes('WebSocket')
    )
    expect(filteredErrors).toHaveLength(0)
  })
})