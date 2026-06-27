import { test, expect } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD, routes } from './fixtures'

test.describe('Stability — Page load performance', () => {
  test('home page loads within 5 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto(routes.home)
    await page.locator('body').isVisible()
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000)
  })

  test('login page loads within 5 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto(routes.login)
    await page.locator('body').isVisible()
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000)
  })
})

test.describe('Stability — Console errors', () => {
  test('home page has no critical console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto(routes.home)
    await page.waitForLoadState('networkidle')

    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR') && !e.includes('429')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('login page has no critical console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto(routes.login)
    await page.waitForLoadState('networkidle')

    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('net::ERR') && !e.includes('429')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Stability — Responsive design', () => {
  test('landing page renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(routes.home)
    await expect(page.locator('body')).toBeVisible()
    await expect(page.getByText(/cadent/i).first()).toBeVisible()
  })

  test('login page renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(routes.login)
    // On mobile, the left panel is hidden but the form is still visible
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('login page renders on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto(routes.login)
    // Desktop shows the side panel with "Welcome back" heading
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })
})

test.describe('Stability — Accessibility basics', () => {
  test('login form has proper labels', async ({ page }) => {
    await page.goto(routes.login)
    const form = page.locator('form')
    const inputs = form.locator('input[required]')
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        await expect(label).toBeVisible()
      }
    }
  })

  test('login page has correct lang attribute', async ({ page }) => {
    await page.goto(routes.login)
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBe('en')
  })
})

test.describe('Stability — Dark theme', () => {
  test('dark class is applied to html element', async ({ page }) => {
    await page.goto(routes.home)
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

  test('body has dark background class', async ({ page }) => {
    await page.goto(routes.home)
    const body = page.locator('body')
    const classes = await body.getAttribute('class')
    expect(classes).toContain('bg-')
  })
})

test.describe('Stability — Image assets', () => {
  test('logo images load on login page', async ({ page }) => {
    await page.goto(routes.login)
    const images = page.locator('img[alt="Cadent"]')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const naturalWidth = await images.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth)
      expect(naturalWidth).toBeGreaterThan(0)
    }
  })
})

test.describe('Stability — HTTPS and security', () => {
  test('site is served over HTTPS in production', async ({ page }) => {
    if (!process.env.BASE_URL || process.env.BASE_URL.includes('cadent.online')) {
      await page.goto(routes.home)
      const url = page.url()
      expect(url).toContain('https')
    }
  })

  test('no mixed content warnings', async ({ page }) => {
    if (!process.env.BASE_URL || process.env.BASE_URL.includes('cadent.online')) {
      const mixedContent: string[] = []
      page.on('request', (req) => {
        if (req.url().startsWith('http://') && !req.url().includes('localhost')) {
          mixedContent.push(req.url())
        }
      })

      await page.goto(routes.home)
      await page.waitForLoadState('networkidle')

      expect(mixedContent).toHaveLength(0)
    }
  })
})