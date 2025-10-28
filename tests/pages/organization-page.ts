import { Page, Locator, expect } from '@playwright/test'
import { escapeRegExp, formatDateForInput } from '../commonFunction/common'

export enum Role {
  Admin = 'Admin',
  Supervisor = 'Supervisor',
  Staff = 'Staff',
}

export interface OrganizationInput {
  name: string
  startDate: string | number | Date
  endDate?: string | number | Date
  role?: Role | string | number
}

export class OrganizationPage {
  readonly page: Page
  readonly btnCreate: Locator
  readonly btnSave: Locator
  readonly inputName: Locator
  readonly inputStartDate: Locator
  readonly inputEndDate: Locator
  readonly fieldRole: Locator

  constructor(page: Page) {
    this.page = page

    this.btnCreate = page.getByRole('button', { name: /create/i })
    this.btnSave = page.getByRole('button', { name: /save/i })

    this.inputName = page
      .locator('input[name="name"]')
      .or(page.getByPlaceholder('OrganizationName'))
    this.inputStartDate = page
      .locator('input[name="startDate"]')
      .or(page.getByPlaceholder('startDate'))
    this.inputEndDate = page
      .locator('input[name="endDate"]')
      .or(page.getByPlaceholder('endDate'))

    this.fieldRole = page.locator('[name="role"], div[name="role"]')
  }

  async goto() {
    await this.page.goto('/organization')
    await expect(this.btnCreate).toBeVisible()
  }

  /**
   * @param org  organization data
   * @param roleSelectIndex
   */
  async edit(org: OrganizationInput, roleSelectIndex?: number) {
    await this.btnCreate.click()

    await this.inputName.fill(org.name)

    await this.inputStartDate.fill(formatDateForInput(org.startDate))
    if (org.endDate !== undefined) {
      await this.inputEndDate.fill(formatDateForInput(org.endDate))
    }

    let finalRole: string | undefined

    if (org.role !== undefined || roleSelectIndex !== undefined) {
      finalRole = await this.selectRole(
        typeof org.role === 'number' ? org.role : undefined,
        typeof org.role === 'string' ? org.role : undefined,
        roleSelectIndex
      )
    }

    await this.btnSave.click()

    await this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/organization') &&
        resp.request().method() === 'POST' &&
        resp.ok()
    )

    return {
      name: org.name,
      startDate: formatDateForInput(org.startDate),
      endDate: org.endDate ? formatDateForInput(org.endDate) : undefined,
      role: finalRole ?? (typeof org.role === 'string' ? org.role : undefined),
    }
  }

  private async selectRole(
    index?: number,
    labelText?: string,
    fallbackIndex?: number
  ): Promise<string> {
    const el = this.fieldRole.first()
    const tagName = await el.evaluate((n) =>
      (n as HTMLElement).tagName.toLowerCase()
    )

    if (tagName === 'select') {
      if (typeof labelText === 'string') {
        const result = await (el as Locator).selectOption({ label: labelText })
        return result[0] ?? labelText
      }
      if (typeof index === 'number' || typeof fallbackIndex === 'number') {
        const i = (index ?? fallbackIndex)!
        const options = await el.locator('option').allTextContents()
        const label = options[i]
        await (el as Locator).selectOption({ label })
        return label
      }
      const first = await el.locator('option').first().textContent()
      await (el as Locator).selectOption({ label: first ?? '' })
      return first?.trim() ?? ''
    }

    await el.click()
    const menu = this.page
      .locator(
        '[role="listbox"], [data-radix-popper-content-available], .ant-select-dropdown'
      )
      .first()

    if (typeof labelText === 'string') {
      const opt = menu
        .getByRole('option', {
          name: new RegExp(`^\\s*${escapeRegExp(labelText)}\\s*$`, 'i'),
        })
        .first()
      await opt.click()
      return labelText
    }

    const i = index ?? fallbackIndex ?? 0
    const allOptions = menu.locator('[role="option"], .ant-select-item-option')
    const count = await allOptions.count()
    if (count === 0) throw new Error('No options found in role dropdown.')
    const bounded = Math.max(0, Math.min(i, count - 1))
    const chosen = allOptions.nth(bounded)
    const text = (await chosen.textContent())?.trim() ?? ''
    await chosen.click()
    return text
  }
}

export const testOrganizationFlow = async (
  page: Page,
  baseURL: string,
  data: OrganizationInput,
  roleSelectIndex?: number
) => {
  const orgPage = new OrganizationPage(page)

  await page.goto(`${baseURL}/organization`)
  await orgPage.goto()

  const created = await orgPage.edit(data, roleSelectIndex)

  const rowCell = page.getByRole('cell', { name: created.name }).first()
  if (await rowCell.count()) {
    await expect(rowCell).toBeVisible()
  } else {
    await expect(page.getByText(created.name, { exact: false })).toBeVisible()
  }

  if (created.role) {
    await expect(
      page.getByText(String(created.role), { exact: false })
    ).toBeVisible()
  }

  return created
}
