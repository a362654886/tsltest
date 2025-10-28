import test from '@playwright/test'
import { testUserFlow } from '../pages/user-page'

test('User CRUD flow (no mock)', async ({ page, baseURL }) => {
  await testUserFlow(page, baseURL!)
})
