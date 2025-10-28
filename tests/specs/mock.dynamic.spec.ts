import { test, expect } from '@playwright/test'

test('dynamic mock by request body', async ({ page, baseURL }) => {
  await page.route('**/api/users', async (route) => {
    const req = route.request()
    if (req.method() === 'POST') {
      const body = req.postDataJSON?.() ?? {}
      if (body?.email?.endsWith('@example.com')) {
        return route.fulfill({
          status: 201,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: 'user-aaa', ...body, active: true }),
        })
      }
      return route.fulfill({
        status: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Only *@example.com allowed' }),
      })
    }
    return route.fallback()
  })

  await page.goto(`${baseURL}/admin/users`)
  await page.getByRole('button', { name: /create/i }).click()

  await page.fill('input[name="firstName"]', 'demo')
  await page.fill('input[name="lastName"]', 'user')
  await page.fill('input[name="email"]', `pro-${Date.now()}@example.com`)

  await page.getByRole('button', { name: /save/i }).click()

  // 条件等待：响应 201 + UI 提示
  await page.waitForResponse(
    (r) =>
      r.url().includes('/api/users') &&
      r.request().method() === 'POST' &&
      r.ok()
  )
  await expect(page.getByText(/created|success/i)).toBeVisible()
})
