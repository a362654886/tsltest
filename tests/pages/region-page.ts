import { Page, Locator, expect } from '@playwright/test'
import { selectMultiOption } from '../commonFunction/common'

export type TestRegionType = {
  name: string
  countries: string[]
}

export class RegionPage {
  readonly page: Page

  readonly btnCreate: Locator
  readonly btnSave: Locator
  readonly inputName: Locator
  readonly fieldCountry: Locator
  readonly table: Locator
  readonly searchInput: Locator

  constructor(page: Page) {
    this.page = page
    this.btnCreate = page.getByRole('button', { name: /create/i })
    this.btnSave = page.getByRole('button', { name: /save/i })

    this.inputName = page
      .locator('input[name="name"]')
      .or(page.getByPlaceholder('RegionName'))

    this.fieldCountry = page.locator('div[name="country"]')

    this.table = page.locator('table')
    this.searchInput = page.locator('input.rc-input').first()
  }

  async goto(baseURL = '') {
    await this.page.goto(`${baseURL}/admin/region`)
    await expect(this.btnCreate).toBeVisible()
  }

  async createRegion(
    region: TestRegionType,
    countryIndexes: number[]
  ): Promise<TestRegionType> {
    await this.btnCreate.click()

    await this.inputName.fill(region.name)

    const selectedCountries = await selectMultiOption(
      this.page,
      'div[name="country"]',
      countryIndexes
    )

    await this.btnSave.click()

    const saved = await this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/region') &&
        ['POST', 'PUT'].includes(resp.request().method()) &&
        resp.ok()
    )
    expect(saved.ok()).toBeTruthy()
    await expect(
      this.table.getByRole('cell', { name: region.name })
    ).toBeVisible()

    return { ...region, countries: selectedCountries }
  }

  async expectRegionVisible(name: string) {
    await this.searchInput.fill(name)
    const rowCell = this.page.locator(`td:has-text("${name}")`).first()
    await expect(rowCell).toBeVisible()
  }

  async deleteRegionByName(name: string) {
    const row = this.page.getByRole('row', { name })
    await expect(row).toBeVisible()

    const deleteBtn = row.getByRole('img').first()
    await deleteBtn.click()

    const confirm = this.page.getByRole('button', { name: /^delete$/i })
    await expect(confirm).toBeVisible()
    await confirm.click()

    const deleted = await this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/region') &&
        resp.request().method() === 'DELETE' &&
        resp.ok()
    )
    expect(deleted.ok()).toBeTruthy()

    await expect(this.page.getByRole('cell', { name })).toHaveCount(0)
  }
}

export const testRegionFlow = async (
  page: Page,
  baseURL: string,
  testData: TestRegionType = { name: 'test region name', countries: [] },
  countryIndexes: number[] = [1, 2]
) => {
  const regionPage = new RegionPage(page)

  await regionPage.goto(baseURL)

  const created = await regionPage.createRegion(testData, countryIndexes)

  await regionPage.expectRegionVisible(created.name)

  await regionPage.deleteRegionByName(created.name)
}

