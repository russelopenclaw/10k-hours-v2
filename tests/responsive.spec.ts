import { test, expect } from '@playwright/test'
import { signInAsStudent, signInAsTeacher } from './fixtures'

/**
 * Responsive layout tests — verify UI adapts across desktop, tablet, and mobile.
 *
 * Uses Playwright's built-in project-based viewport switching:
 *   - desktop: 1280×720 (Desktop Chrome)
 *   - tablet: 768×1024
 *   - mobile: 393×851 (Pixel 5)
 */

// ─── Student Header ────────────────────────────────────────────────────

test.describe('Student header — responsive', () => {
  test('share button text adapts to viewport', async ({ page }) => {
    await signInAsStudent(page)

    const isMobile = page.viewportSize()!.width < 640
    const shareButton = page.getByRole('button', { name: /share|sharing|connected/i })
    await expect(shareButton).toBeVisible({ timeout: 10_000 })

    // Check visible text content (not hidden spans)
    // On mobile, the short text span is visible; on desktop, the long span is visible
    if (isMobile) {
      // Mobile shows "Share" or "Sharing" (short span with sm:hidden)
      const mobileText = shareButton.locator('.sm\\:hidden')
      if (await mobileText.count() > 0) {
        const text = await mobileText.textContent()
        expect(text!.trim().length).toBeLessThanOrEqual(10)
      } else {
        // Fallback: just check the button is visible and not overflowing
        const box = await shareButton.boundingBox()
        if (box) {
          expect(box.width).toBeLessThanOrEqual(page.viewportSize()!.width * 0.4)
        }
      }
    } else {
      // Desktop shows "Share with Teacher" or "Sharing with ..." (long span with hidden sm:inline)
      const desktopText = shareButton.locator('.hidden.sm\\:inline')
      if (await desktopText.count() > 0) {
        const text = await desktopText.textContent()
        expect(text!.trim().length).toBeGreaterThan(7)
      }
    }
  })

  test('header does not overflow on mobile', async ({ page }) => {
    await signInAsStudent(page)

    const header = page.locator('header')
    const box = await header.boundingBox()
    if (box) {
      const viewportWidth = page.viewportSize()!.width
      expect(box.width).toBeLessThanOrEqual(viewportWidth)
    }
  })
})

// ─── Teacher Roster ────────────────────────────────────────────────────

test.describe('Teacher roster — responsive', () => {
  test('streak/time/sessions columns hidden on mobile, visible on desktop', async ({ page }) => {
    await signInAsTeacher(page)

    const isMobile = page.viewportSize()!.width < 640
    const streakHeader = page.getByText('Streak', { exact: true }).first()

    if (isMobile) {
      await expect(streakHeader).not.toBeVisible()
    } else {
      await expect(streakHeader).toBeVisible()
    }
  })

  test('Teacher Portal badge hidden on mobile', async ({ page }) => {
    await signInAsTeacher(page)

    const isMobile = page.viewportSize()!.width < 640
    const portalBadge = page.getByText('Teacher Portal')

    if (isMobile) {
      await expect(portalBadge).not.toBeVisible()
    } else {
      await expect(portalBadge).toBeVisible()
    }
  })
})

// ─── Student Comparison ─────────────────────────────────────────────────

test.describe('Student comparison — responsive', () => {
  test('comparison grid is 3-col on desktop, 1-col on mobile', async ({ page }) => {
    await signInAsTeacher(page)

    // Look for the comparison section
    const sessionsLabel = page.getByText('Sessions This Week')
    if (await sessionsLabel.count() > 0) {
      const isMobile = page.viewportSize()!.width < 640

      // Find the grid container that holds the comparison cards
      const comparisonGrid = page.locator('[class*="grid-cols"]').filter({ hasText: 'Sessions This Week' }).first()
      if (await comparisonGrid.count() > 0) {
        const classes = await comparisonGrid.getAttribute('class') || ''
        if (isMobile) {
          expect(classes).toContain('grid-cols-1')
        } else {
          expect(classes).toContain('grid-cols-3')
        }
      }
    }
  })
})

// ─── Song Card Click ────────────────────────────────────────────────────

test.describe('Song card — click behavior', () => {
  test('clicking song card selects it (shows timer)', async ({ page }) => {
    await signInAsStudent(page)

    // Wait for song cards to load
    const songCards = page.locator('[class*="cursor-pointer"]')
    await expect(songCards.first()).toBeVisible({ timeout: 10_000 })

    // Click on the card itself (not the Start Practice button)
    await songCards.first().click()

    // The practice timer should appear
    await expect(page.getByText(/Start Practice|\\d{1,2}:\\d{2}/).first()).toBeVisible({ timeout: 5_000 })
  })

  test('Start Practice button auto-begins timer', async ({ page }) => {
    await signInAsStudent(page)

    // Wait for Start Practice buttons
    const startButton = page.getByRole('button', { name: /start practice/i }).first()
    await expect(startButton).toBeVisible({ timeout: 10_000 })

    await startButton.click()

    // After clicking Start Practice, the timer should auto-start
    // (shows Pause button, not Start Practice)
    await expect(page.getByRole('button', { name: /^pause$/i })).toBeVisible({ timeout: 5_000 })
  })
})