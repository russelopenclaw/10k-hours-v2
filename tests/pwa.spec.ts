import { test, expect } from '@playwright/test'
import { routes } from './fixtures'

test.describe('PWA — Web App Manifest', () => {
  test('manifest.json is valid and complete', async ({ request }) => {
    const response = await request.get(routes.manifest)
    expect(response.ok()).toBeTruthy()
    const manifest = await response.json()

    expect(manifest.name).toBe('Cadent — Music Practice Tracker')
    expect(manifest.short_name).toBe('Cadent')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.background_color).toBeTruthy()
    expect(manifest.theme_color).toBeTruthy()
    expect(manifest.orientation).toBe('portrait-primary')
  })

  test('manifest has required icons', async ({ request }) => {
    const response = await request.get(routes.manifest)
    const manifest = await response.json()

    expect(manifest.icons).toBeDefined()
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)

    const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192')
    expect(icon192).toBeDefined()
    expect(icon192.type).toBe('image/png')

    const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512')
    expect(icon512).toBeDefined()
    expect(icon512.type).toBe('image/png')
  })

  test('manifest icons are accessible', async ({ request }) => {
    const response = await request.get(routes.manifest)
    const manifest = await response.json()

    for (const icon of manifest.icons) {
      const iconResponse = await request.get(icon.src)
      expect(iconResponse.ok(), `Icon ${icon.src} should be accessible`).toBeTruthy()
    }
  })

  test('manifest categories include music and education', async ({ request }) => {
    const response = await request.get(routes.manifest)
    const manifest = await response.json()

    expect(manifest.categories).toContain('music')
    expect(manifest.categories).toContain('education')
  })
})

test.describe('PWA — Service Worker', () => {
  test('sw.js is accessible', async ({ request }) => {
    const response = await request.get('/sw.js')
    expect(response.ok()).toBeTruthy()
    const text = await response.text()
    expect(text).toContain('install')
    expect(text).toContain('activate')
    expect(text).toContain('fetch')
  })

  test('service worker has cache-first strategy for static assets', async ({ request }) => {
    const response = await request.get('/sw.js')
    const text = await response.text()
    expect(text).toContain('cacheFirst')
    expect(text).toContain('networkFirst')
    expect(text).toContain('supabase.co')
  })

  test('service worker caches app shell on install', async ({ request }) => {
    const response = await request.get('/sw.js')
    const text = await response.text()
    expect(text).toContain('APP_SHELL')
    expect(text).toContain('/login')
    expect(text).toContain('/manifest.json')
    expect(text).toContain('/icon-192.png')
  })
})

test.describe('PWA — Meta tags', () => {
  test('has apple-mobile-web-app-capable meta tag', async ({ page }) => {
    await page.goto(routes.home)
    const meta = page.locator('meta[name="apple-mobile-web-app-capable"]')
    await expect(meta).toHaveAttribute('content', 'yes')
  })

  test('has apple-touch-icon link', async ({ page }) => {
    await page.goto(routes.home)
    const link = page.locator('link[rel="apple-touch-icon"]')
    await expect(link).toHaveAttribute('href', '/icon-192.png')
  })

  test('has theme-color meta', async ({ page }) => {
    await page.goto(routes.home)
    // Next.js Viewport exports theme-color as <meta name="theme-color">
    const meta = page.locator('meta[name="theme-color"]')
    await expect(meta).toHaveAttribute('content', '#0F1115')
  })

  test('manifest link tag exists in HTML head', async ({ page }) => {
    await page.goto(routes.home)
    const link = page.locator('link[rel="manifest"]')
    await expect(link).toHaveAttribute('href', '/manifest.json')
  })

  test('viewport meta is set correctly', async ({ page }) => {
    await page.goto(routes.home)
    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveAttribute('content', /width=device-width/)
  })
})

test.describe('PWA — Icon assets', () => {
  test('icon-192.png is accessible', async ({ request }) => {
    const response = await request.get('/icon-192.png')
    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('image/png')
  })

  test('icon-512.png is accessible', async ({ request }) => {
    const response = await request.get('/icon-512.png')
    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('image/png')
  })

  test('cadent-logo.png is accessible', async ({ request }) => {
    const response = await request.get('/cadent-logo.png')
    expect(response.ok()).toBeTruthy()
  })
})