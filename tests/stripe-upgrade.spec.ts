import { test, expect } from './fixtures'
import { TEST_TEACHER_EMAIL, TEST_TEACHER_PASSWORD, routes, signInAsTeacher } from './fixtures'

/**
 * Stripe billing E2E tests.
 *
 * These tests cover:
 * 1. The webhook handler (via direct API calls)
 * 2. The upgrade redirect + polling (via URL params)
 * 3. The Stripe Checkout flow (manual only — requires Stripe test mode)
 *
 * The test teacher account (test2) may be on free or premium tier depending
 * on prior test runs. Tests that require a free-tier teacher should reset
 * the subscription status first via the Supabase API.
 */

test.describe('Stripe — Webhook handler', () => {
  test('POST to /api/stripe/webhook without signature returns 400', async ({ request }) => {
    const response = await request.post(`${routes.home}api/stripe/webhook`, {
      data: '{}',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('signature')
  })

  test('POST to /api/stripe/webhook with invalid signature returns 400', async ({ request }) => {
    const response = await request.post(`${routes.home}api/stripe/webhook`, {
      data: '{}',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1234,v1=invalid_signature',
      },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('signature')
  })
})

test.describe('Stripe — Upgrade redirect and polling', () => {
  test('teacher page with ?upgraded=true loads successfully without infinite spinner', async ({ page }) => {
    await signInAsTeacher(page)

    // Navigate to teacher page with ?upgraded=true (simulates Stripe redirect)
    await page.goto('/app/teacher?upgraded=true')

    // The page should resolve within 15 seconds — either:
    // - Shows "Processing your upgrade…" spinner briefly then loads roster (free tier)
    // - Skips spinner entirely and loads roster (already premium)
    // We just verify no infinite spinner is stuck on screen
    await page.waitForTimeout(5000) // Let any transient states settle

    // Check that "Processing your upgrade" spinner is NOT stuck on screen
    const processingText = page.getByText(/processing your upgrade/i)
    const isVisible = await processingText.isVisible().catch(() => false)
    expect(isVisible).toBe(false)

    // Page should not be blank — either roster content or auth loading state
    const pageContent = await page.locator('body').innerHTML()
    expect(pageContent.length).toBeGreaterThan(100) // Page has actual content
  })

  test('teacher page without ?upgraded=true loads normally (no spinner)', async ({ page }) => {
    await signInAsTeacher(page)
    // Normal load — no "Processing your upgrade" spinner
    const processingText = page.getByText(/processing your upgrade/i)
    await expect(processingText).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Stripe — Checkout page (manual test)', () => {
  // This test is skipped in CI because it requires manual Stripe test card interaction.
  // To run manually: set PLAYWRIGHT_STRIPE_CHECKOUT=true
  test.skip(() => !process.env.PLAYWRIGHT_STRIPE_CHECKOUT, 'Set PLAYWRIGHT_STRIPE_CHECKOUT=true to run Stripe checkout tests')

  test('free teacher can click Upgrade and complete Stripe Checkout with test card', async ({ page, context }) => {
    // Note: This test requires the teacher account to be on the free tier.
    // If the account is already premium, this test will fail.
    await signInAsTeacher(page)

    // Look for upgrade button/banner
    const upgradeButton = page.getByRole('button', { name: /upgrade/i })
    const upgradeVisible = await upgradeButton.isVisible().catch(() => false)
    test.skip(!upgradeVisible, 'Upgrade button not visible — account may already be premium')

    await upgradeButton.click()

    // Should redirect to Stripe Checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 })

    // Fill in Stripe Checkout test card details
    // Card number field is usually in an iframe, so we need to handle Stripe Elements
    const cardFrame = page.frameLocator('iframe').first()
    await cardFrame.getByLabel(/card number/i).fill('4242424242424242')
    await cardFrame.getByLabel(/expiry/i).fill('1234') // 12/34
    await cardFrame.getByLabel(/cvc/i).fill('123')
    await cardFrame.getByLabel(/name on card/i).fill('Test Teacher')

    // Click "Subscribe" or "Pay" button
    await page.getByRole('button', { name: /subscribe|pay/i }).click()

    // Should redirect back to /app/teacher?upgraded=true
    await page.waitForURL(/\/app\/teacher\?upgraded=true/, { timeout: 30_000 })

    // Should show processing spinner then load normally
    await page.waitForLoadState('networkidle')

    // After upgrade, the upgrade banner should be gone
    await expect(page.getByText(/free plan/i)).not.toBeVisible({ timeout: 30_000 })
  })
})