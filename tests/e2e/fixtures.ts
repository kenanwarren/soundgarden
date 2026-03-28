import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  _electron as electron,
  expect,
  test as base,
  type ElectronApplication,
  type Page
} from '@playwright/test'

export type TestAudioMode =
  | 'permission-denied'
  | 'offline-no-input'
  | 'offline-selected-input'
  | 'connected'

type RelaunchOptions = {
  audioMode?: TestAudioMode
}

type StorageEntries = Record<string, string | null>

type ElectronFixtures = {
  app: ElectronApplication
  page: Page
  soundgarden: {
    app: () => ElectronApplication
    page: () => Page
    relaunch: (options?: RelaunchOptions) => Promise<Page>
    reload: () => Promise<Page>
    gotoHash: (hash: string) => Promise<Page>
    seedStorage: (entries: StorageEntries, options?: { reload?: boolean }) => Promise<Page>
    clearStorage: (options?: { reload?: boolean }) => Promise<Page>
  }
}

export function persistedState<T>(state: T): string {
  return JSON.stringify({ state, version: 0 })
}

export const test = base.extend<ElectronFixtures>({
  soundgarden: async ({ browserName: _browserName }, use) => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'soundgarden-e2e-'))
    let currentOptions: RelaunchOptions = {
      audioMode: 'offline-no-input'
    }
    let currentApp: ElectronApplication | null = null
    let currentPage: Page | null = null

    const launch = async (options: RelaunchOptions = currentOptions): Promise<Page> => {
      currentOptions = { ...currentOptions, ...options }
      currentApp = await electron.launch({
        args: [path.join(process.cwd(), '.')],
        env: {
          ...process.env,
          SOUNDGARDEN_E2E: '1',
          SOUNDGARDEN_E2E_AUDIO_MODE: currentOptions.audioMode ?? 'offline-no-input',
          SOUNDGARDEN_E2E_USER_DATA_DIR: userDataDir
        }
      })

      currentPage = await currentApp.firstWindow()
      await currentPage.waitForLoadState('domcontentloaded')
      return currentPage
    }

    const getApp = (): ElectronApplication => {
      if (!currentApp) {
        throw new Error('Electron app is not running.')
      }

      return currentApp
    }

    const getPage = (): Page => {
      if (!currentPage) {
        throw new Error('Electron page is not available.')
      }

      return currentPage
    }

    const controller = {
      app: getApp,
      page: getPage,
      relaunch: async (options: RelaunchOptions = {}): Promise<Page> => {
        if (currentApp) {
          await currentApp.close()
        }

        return launch(options)
      },
      reload: async (): Promise<Page> => {
        const page = getPage()
        await page.reload({ waitUntil: 'domcontentloaded' })
        currentPage = page
        return page
      },
      gotoHash: async (hash: string): Promise<Page> => {
        const page = getPage()
        await page.evaluate((nextHash) => {
          window.location.hash = nextHash
        }, hash)
        await page.waitForFunction((nextHash) => window.location.hash === nextHash, hash)
        return page
      },
      seedStorage: async (
        entries: StorageEntries,
        options: { reload?: boolean } = {}
      ): Promise<Page> => {
        const page = getPage()
        await page.evaluate((values) => {
          Object.entries(values).forEach(([key, value]) => {
            if (value === null) {
              window.localStorage.removeItem(key)
              return
            }

            window.localStorage.setItem(key, value)
          })
        }, entries)

        if (options.reload !== false) {
          return controller.reload()
        }

        return page
      },
      clearStorage: async (options: { reload?: boolean } = {}): Promise<Page> => {
        const page = getPage()
        await page.evaluate(() => {
          window.localStorage.clear()
        })

        if (options.reload !== false) {
          return controller.reload()
        }

        return page
      }
    }

    await launch()
    await use(controller)

    if (currentApp) {
      await currentApp.close()
    }
    fs.rmSync(userDataDir, { recursive: true, force: true })
  },

  app: async ({ soundgarden }, use) => {
    await use(soundgarden.app())
  },

  page: async ({ soundgarden }, use) => {
    await use(soundgarden.page())
  }
})

export { expect }
