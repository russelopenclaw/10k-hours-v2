import { test, expect } from '@playwright/test'
import { BASE_URL, routes } from './fixtures'

test.describe('SEO — Landing page (/)', () => {
  test('has correct title', async ({ page }) => {
    await page.goto(routes.home)
    await expect(page).toHaveTitle(/cadent/i)
  })

  test('has meta description', async ({ page }) => {
    await page.goto(routes.home)
    const desc = page.locator('meta[name="description"]')
    await expect(desc).toHaveAttribute('content', /practice/i)
  })

  test('has canonical URL', async ({ page }) => {
    await page.goto(routes.home)
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://www.cadent.online')
  })

  test('has Open Graph title and description', async ({ page }) => {
    await page.goto(routes.home)
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /cadent/i)

    const ogDesc = page.locator('meta[property="og:description"]')
    await expect(ogDesc).toHaveAttribute('content', /practice/i)
  })

  test('has Twitter card tags', async ({ page }) => {
    await page.goto(routes.home)
    const twitterCard = page.locator('meta[name="twitter:card"]')
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image')

    const twitterTitle = page.locator('meta[name="twitter:title"]')
    await expect(twitterTitle).toHaveAttribute('content', /cadent/i)

    const twitterImage = page.locator('meta[name="twitter:image"]')
    await expect(twitterImage).toHaveAttribute('content', /cadent-logo/)
  })

  test('has JSON-LD structured data', async ({ page }) => {
    await page.goto(routes.home)
    const jsonLd = page.locator('script[type="application/ld+json"]')
    const content = await jsonLd.textContent()
    const parsed = JSON.parse(content!)

    expect(parsed['@type']).toBe('WebApplication')
    expect(parsed.name).toBe('Cadent')
    expect(parsed.url).toBe('https://www.cadent.online')
    expect(parsed.applicationCategory).toBe('MusicApplication')
  })

  test('has keywords meta tag', async ({ page }) => {
    await page.goto(routes.home)
    const keywords = page.locator('meta[name="keywords"]')
    await expect(keywords).toHaveAttribute('content', /music practice/i)
  })

  test('has Open Graph image', async ({ page }) => {
    await page.goto(routes.home)
    const ogImage = page.locator('meta[property="og:image"]')
    await expect(ogImage).toHaveAttribute('content', /cadent-logo/)
  })
})

test.describe('SEO — Login page', () => {
  test('has a title', async ({ page }) => {
    await page.goto(routes.login)
    await expect(page).toHaveTitle(/cadent/i)
  })
})

test.describe('SEO — App page', () => {
  test('app page has noindex', async ({ page }) => {
    await page.goto(routes.login)
    const form = page.locator('form')
    await form.getByLabel(/email/i).fill(process.env.PLAYWRIGHT_TEST_EMAIL || 'russelopenclaw+test1@gmail.com')
    await form.getByLabel(/password/i).fill(process.env.PLAYWRIGHT_TEST_PASSWORD || 'TestAccount2026!')
    await form.getByRole('button', { name: /^sign in$/i }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })

    const metaRobots = page.locator('meta[name="robots"]')
    await expect(metaRobots).toHaveAttribute('content', /noindex/)
  })
})

test.describe('SEO — robots.txt', () => {
  test('robots.txt disallows /app and /auth/', async ({ request }) => {
    const response = await request.get(routes.robots)
    expect(response.ok()).toBeTruthy()
    const text = await response.text()
    expect(text).toContain('Disallow: /app')
    expect(text).toContain('Disallow: /auth/')
    expect(text).toContain('Sitemap: https://www.cadent.online/sitemap.xml')
  })
})

test.describe('SEO — sitemap.xml', () => {
  test('sitemap contains home and login URLs', async ({ request }) => {
    const response = await request.get(routes.sitemap)
    expect(response.ok()).toBeTruthy()
    const text = await response.text()
    expect(text).toContain('https://www.cadent.online')
    expect(text).toContain('https://www.cadent.online/login')
  })
})