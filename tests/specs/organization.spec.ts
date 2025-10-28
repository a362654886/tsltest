import { Page, expect, test } from '@playwright/test'
import {
  OrganizationInput,
  OrganizationPage,
  Role,
  testOrganizationFlow,
} from '../pages/organization-page'

const unique = (prefix: string) => `${prefix}-${Date.now()}`

test.describe('Organization E2E (no mock)', () => {
  test('create organization — select role by index', async ({
    page,
    baseURL,
  }) => {
    const payload: OrganizationInput = {
      name: unique('ACME-Labs'),
      startDate: '2024-01-02',
      endDate: '2024-12-31',
    }

    const created = await testOrganizationFlow(
      page,
      baseURL!,
      payload,
      /* roleSelectIndex */ 0
    )

    expect(created.name).toBe(payload.name)
    expect(created.startDate).toBe('2024-01-02')
    expect(created.endDate).toBe('2024-12-31')
  })

  test('create organization — select role by label text', async ({
    page,
    baseURL,
  }) => {
    const payload: OrganizationInput = {
      name: unique('Globex-Corp'),
      startDate: '2025-03-15',
      endDate: new Date('2025-09-30'),
      role: Role.Supervisor,
    }

    const created = await testOrganizationFlow(page, baseURL!, payload)

    expect(created.name).toBe(payload.name)
    expect(created.startDate).toBe('2025-03-15')
    expect(created.endDate).toBe('2025-09-30')
    expect(created.role).toBe(Role.Supervisor)
  })
})
