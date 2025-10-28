import { Page, Locator, expect } from '@playwright/test'
import { selectOption } from '../commonFunction/common'

export type TestUserType = {
  firstName: string
  lastName: string
  email: string
  organization: string
  active: 'Active' | 'Inactive' | string
}

export const testCreateUser: TestUserType = {
  firstName: 'test first name',
  lastName: 'test last name',
  email: 'test.test@example.com',
  organization: '',
  active: 'Active',
}

export const testUpdateUser: TestUserType = {
  firstName: 'test update first name',
  lastName: 'test update last name',
  email: 'test.update@example.com',
  organization: '',
  active: 'Inactive',
}

export class UserPage {
  readonly page: Page

  readonly btnCreate: Locator
  readonly btnEdit: Locator
  readonly btnSave: Locator
  readonly btnDelete: Locator
  readonly btnConfirmDelete: Locator

  readonly inputFirstName: Locator
  readonly inputLastName: Locator
  readonly inputEmail: Locator
  readonly fieldOrg: Locator
  readonly switchActive: Locator

  readonly searchInput: Locator
  readonly valueItems: Locator

  constructor(page: Page) {
    this.page = page

    this.btnCreate = page.getByRole('button', { name: /^create$/i })
    this.btnEdit = page.getByRole('button', { name: /^edit$/i })
    this.btnSave = page.getByRole('button', { name: /^save$/i })
    this.btnDelete = page.getByRole('button', { name: /^delete$/i })
    this.btnConfirmDelete = page.getByRole('button', { name: /^ok$/i })

    this.inputFirstName = page.locator('input[name="firstName"]')
    this.inputLastName = page.locator('input[name="lastName"]')
    this.inputEmail = page.locator('input[name="email"]')

    this.fieldOrg = page.locator('div[name="organizationName"]')
    this.switchActive = page.locator('[role="switch"]')

    this.searchInput = page.locator('input.rc-input').first()
    this.valueItems = page.locator('[class*="CustomFormView_value"]')
  }

  async goto(baseURL = '') {
    await this.page.goto(`${baseURL}/admin/users`)
    await expect(this.btnCreate).toBeVisible()
  }

  async createUser(orgIndex = 0): Promise<TestUserType> {
    await this.btnCreate.click()

    await this.inputFirstName.fill(testCreateUser.firstName)
    await this.inputLastName.fill(testCreateUser.lastName)
    await this.inputEmail.fill(testCreateUser.email)

    const organization =
      (await selectOption(
        this.page,
        'div[name="organizationName"]',
        orgIndex
      )) ?? ''

    await this.ensureActive(true)

    await this.btnSave.click()

    const created = await this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/users') &&
        resp.request().method() === 'POST' &&
        resp.ok()
    )
    expect(created.ok()).toBeTruthy()

    await this.expectUserVisibleByFirstName(testCreateUser.firstName)

    return { ...testCreateUser, organization }
  }

  async updateUser(orgIndex = 1): Promise<TestUserType> {
    await this.btnEdit.click()

    await this.inputFirstName.fill(testUpdateUser.firstName)
    await this.inputLastName.fill(testUpdateUser.lastName)
    await this.inputEmail.fill(testUpdateUser.email)

    const organization =
      (await selectOption(
        this.page,
        'div[name="organizationName"]',
        orgIndex
      )) ?? ''

    await this.ensureActive(false)

    await this.btnSave.click()

    const updated = await this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/users') &&
        (resp.request().method() === 'PUT' ||
          resp.request().method() === 'PATCH') &&
        resp.ok()
    )
    expect(updated.ok()).toBeTruthy()

    await this.expectUserVisibleByFirstName(testUpdateUser.firstName)

    return { ...testUpdateUser, organization }
  }

  async expectUserVisibleByFirstName(firstName: string) {
    await this.searchInput.fill(firstName)
    await expect(this.page.getByText(firstName)).toBeVisible()
  }

  async checkUserInfo(expectUser: TestUserType) {
    await this.searchInput.fill(expectUser.firstName)

    await expect(this.valueItems.nth(0)).toBeVisible()

    const firstName = (await this.valueItems.nth(0).textContent())?.trim()
    const lastName = (await this.valueItems.nth(1).textContent())?.trim()
    const email = (await this.valueItems.nth(2).textContent())?.trim()
    const organization = (await this.valueItems.nth(3).textContent())?.trim()
    const active = (await this.valueItems.nth(4).textContent())?.trim()

    expect(firstName).toBe(expectUser.firstName)
    expect(lastName).toBe(expectUser.lastName)
    expect(email).toBe(expectUser.email)
    expect(organization).toBe(expectUser.organization)
    expect(active).toBe(expectUser.active)
  }

  async deleteCurrentUser() {
    await this.btnDelete.click()
    await expect(this.btnConfirmDelete).toBeVisible()
    await this.btnConfirmDelete.click()

    const deleted = await this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/users') &&
        resp.request().method() === 'DELETE' &&
        resp.ok()
    )
    expect(deleted.ok()).toBeTruthy()
  }

  private async ensureActive(desired: boolean) {
    const ariaChecked = await this.switchActive.getAttribute('aria-checked')
    const now = ariaChecked === 'true'
    if (now !== desired) {
      await this.switchActive.click()
      await expect(this.switchActive).toHaveAttribute(
        'aria-checked',
        desired ? 'true' : 'false'
      )
    }
  }
}

export const testUserFlow = async (page: Page, baseURL: string) => {
  const users = new UserPage(page)

  await users.goto(baseURL)

  // Create
  const created = await users.createUser(0)
  await users.checkUserInfo(created)

  // Update
  const updated = await users.updateUser(1)
  await users.checkUserInfo(updated)

  // Delete
  await users.deleteCurrentUser()
}
