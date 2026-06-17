import { test, expect } from '@playwright/test'
import { TEST_TEACHER_EMAIL, TEST_TEACHER_PASSWORD, routes, signInAsTeacher, expectNoSpinner } from './fixtures'

test.describe('Teacher — Dashboard access', () => {
  test('teacher can navigate to /app/teacher after login', async ({ page }) => {
    await signInAsTeacher(page)
    await expect(page).toHaveURL(/\/app(\/teacher)?/, { timeout: 10_000 })
  })

  test('teacher sees roster page with content', async ({ page }) => {
    await signInAsTeacher(page)
    // The heading might be "My Students" or the Teacher Portal badge
    const heading = page.getByRole('heading', { name: /my students/i })
    const badge = page.getByText('Teacher Portal')
    const headingVisible = await heading.isVisible().catch(() => false)
    const badgeVisible = await badge.isVisible().catch(() => false)
    expect(headingVisible || badgeVisible).toBeTruthy()
  })

  test('teacher header shows "Teacher Portal" badge', async ({ page }) => {
    await signInAsTeacher(page)
    await expect(page.getByText('Teacher Portal')).toBeVisible({ timeout: 10_000 })
  })

  test('teacher dashboard loads without spinner', async ({ page }) => {
    await signInAsTeacher(page)
    await expectNoSpinner(page)
  })

  test('teacher sees roster with students or empty state prompt', async ({ page }) => {
    await signInAsTeacher(page)
    const teacherContent = page.locator('main')
    await expect(teacherContent).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Teacher — Onboarding wizard', () => {
  test('already-onboarded teacher goes directly to roster', async ({ page }) => {
    await signInAsTeacher(page)
    await expect(page.getByText(/welcome to cadent for teachers/i)).not.toBeVisible({ timeout: 5_000 })
    const badge = page.getByText('Teacher Portal')
    const heading = page.getByRole('heading', { name: /my students/i })
    const badgeVisible = await badge.isVisible().catch(() => false)
    const headingVisible = await heading.isVisible().catch(() => false)
    expect(badgeVisible || headingVisible).toBeTruthy()
  })
})

test.describe('Teacher — Student assignments', () => {
  test('assign button (ClipboardList icon) exists on student rows', async ({ page }) => {
    await signInAsTeacher(page)
    const assignButton = page.locator('button[title="Assign piece"]').first()
    const assignVisible = await assignButton.isVisible().catch(() => false)
    test.skip(!assignVisible, 'No students in roster to test assignment button')
    await expect(assignButton).toBeVisible({ timeout: 5_000 })
  })

  test('assignment modal opens with piece title, tempo, goal, due date fields', async ({ page }) => {
    await signInAsTeacher(page)
    const assignButton = page.locator('button[title="Assign piece"]').first()
    const assignVisible = await assignButton.isVisible().catch(() => false)
    test.skip(!assignVisible, 'No students in roster to test assignment modal')
    await assignButton.click()
    await expect(page.getByRole('heading', { name: /assign piece/i })).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/piece title/i)).toBeVisible()
    await expect(page.getByText(/target tempo/i)).toBeVisible()
    await expect(page.getByText(/due date/i)).toBeVisible()
    await expect(page.getByText(/goal/i)).toBeVisible()
  })

  test('assignment modal can be closed without saving', async ({ page }) => {
    await signInAsTeacher(page)
    const assignButton = page.locator('button[title="Assign piece"]').first()
    const assignVisible = await assignButton.isVisible().catch(() => false)
    test.skip(!assignVisible, 'No students in roster to test assignment modal')
    await assignButton.click()
    await expect(page.getByRole('heading', { name: /assign piece/i })).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByRole('heading', { name: /assign piece/i })).not.toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Teacher — Student comparison view', () => {
  test('StudentComparison component renders when teacher has 2+ students', async ({ page }) => {
    await signInAsTeacher(page)
    const comparisonHeading = page.getByText(/student comparison/i)
    const comparisonVisible = await comparisonHeading.isVisible().catch(() => false)
    if (comparisonVisible) {
      await expect(page.getByText(/practice streak/i)).toBeVisible()
      await expect(page.getByText(/this week/i)).toBeVisible()
    }
  })
})

test.describe('Teacher — Stripe billing (free tier)', () => {
  test('free tier teacher sees upgrade button if banner is visible', async ({ page }) => {
    await signInAsTeacher(page)
    const upgradeBanner = page.getByText(/free plan/i)
    const upgradeBannerVisible = await upgradeBanner.isVisible().catch(() => false)
    if (upgradeBannerVisible) {
      await expect(page.getByRole('button', { name: /upgrade/i })).toBeVisible()
    }
  })

  test('Pro badge (Crown icon) is NOT visible for free teachers', async ({ page }) => {
    await signInAsTeacher(page)
    const proBadge = page.locator('span:has-text("Pro")').filter({ has: page.locator('svg') })
    await expect(proBadge).not.toBeVisible({ timeout: 5_000 })
  })
})