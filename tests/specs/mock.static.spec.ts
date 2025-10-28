import { test, expect } from '@playwright/test'

test.describe('Mock: API + Static Assets', () => {
  test('mock /api/organization + block heavy images', async ({
    page,
    baseURL,
  }) => {
    await page.route('**/api/organization', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: 'org-mock-1', ok: true }),
        })
      }
      return route.fallback()
    })

    await page.route('**/*.{png,jpg,jpeg,webp,svg}', (route) =>
      route.fulfill({ status: 204, body: '' })
    )

    await page.goto(`${baseURL}/organization`)
    await page.getByRole('button', { name: /create/i }).click()
    await page.locator('input[name="name"]').fill(`mock-${Date.now()}`)
    await page.getByRole('button', { name: /save/i }).click()

    await page.waitForResponse(
      (r) =>
        r.url().includes('/api/organization') &&
        r.request().method() === 'POST' &&
        r.ok()
    )
    await expect(page.getByText(/created|saved|success/i)).toBeVisible({
      timeout: 5000,
    })
  })
})
