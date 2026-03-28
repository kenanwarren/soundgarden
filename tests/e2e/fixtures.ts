import path from 'node:path'
import {
  _electron as electron,
  expect,
  test as base,
  type ElectronApplication,
  type Page
} from '@playwright/test'

type ElectronFixtures = {
  app: ElectronApplication
  page: Page
}

export const test = base.extend<ElectronFixtures>({
  app: async ({}, use) => {
    const app = await electron.launch({
      args: [path.join(process.cwd(), '.')]
    })

    await use(app)
    await app.close()
  },

  page: async ({ app }, use) => {
    const page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await use(page)
  }
})

export { expect }
