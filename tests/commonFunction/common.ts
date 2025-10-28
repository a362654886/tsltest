import { Page } from '@playwright/test'

export const formatDateForInput = (value: string | number | Date): string => {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime()))
    throw new Error(`Invalid date: ${String(value)}`)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const escapeRegExp = (s: string) => {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const selectOption = async (
  page: Page,
  element: string,
  index: number
) => {
  // click element to open selection
  await page.click(element)
  // select first one element
  const option = await page.locator('.rc-select-item-option').nth(index)
  //get option text
  const optionText = await option.textContent()
  //select this option
  await option.click()

  return optionText
}

export const selectMultiOption = async (
  page: Page,
  element: string,
  indexes: number[]
) => {
  const result: string[] = []
  // click element to open selection
  await page.click(element)
  for (let i = 0; i <= indexes.length; i++) {
    const option = await page.locator('.rc-select-item-option').nth(i)
    // Get option text
    const optionText = await option.textContent()
    await option.click()
    result.push(optionText as string)
  }
  await page.click(element)

  return result
}
