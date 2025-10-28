import test, { Page } from '@playwright/test'
import {
  RegionPage,
  testRegionFlow,
  TestRegionType,
} from '../pages/region-page'

test.describe('Region CRUD flow (no mock)', () => {
  test('create → verify → delete', async ({ page, baseURL }) => {
    await testRegionFlow(
      page,
      baseURL!,
      { name: `test-region-${Date.now()}`, countries: [] },
      [1, 2]
    )
  })
})
