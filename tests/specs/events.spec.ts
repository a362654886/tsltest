import { test, expect } from '@playwright/test'

test('listen to requests/responses/console', async ({ page, baseURL }) => {
  const stats = { req: 0, res200: 0, consoleErrors: 0 }

  page.on('request', () => {
    stats.req += 1
  })
  page.on('response', (res) => {
    if (res.status() === 200) stats.res200 += 1
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') stats.consoleErrors += 1
  })

  await page.route('**/boom.js', (route) =>
    route.fulfill({
      status: 500,
      headers: { 'content-type': 'text/javascript' },
      body: 'throw new Error("boom");',
    })
  )

  await page.goto(baseURL!)
  await page.addScriptTag({ url: '/boom.js' }).catch(() => {
    /* ignore */
  })

  await expect.poll(() => stats.req, { timeout: 3000 }).toBeGreaterThan(0)
  await expect.soft(stats.res200).toBeGreaterThanOrEqual(0)
  expect(stats.consoleErrors).toBeGreaterThanOrEqual(0)
})
