import { app, ipcMain } from 'electron'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

function resolveDataPath(relativePath: string): string {
  if (relativePath.includes('..') || !relativePath.endsWith('.json')) {
    throw new Error(`Invalid data path: ${relativePath}`)
  }

  if (is.dev) {
    return join(app.getAppPath(), 'resources', 'data', relativePath)
  }
  return join(process.resourcesPath, 'data', relativePath)
}

const LOADABLE_DIRS = ['songs', 'practice-paths']

function resolveDataDir(relativeDir: string): string {
  if (relativeDir.includes('..') || !LOADABLE_DIRS.includes(relativeDir)) {
    throw new Error(`Invalid data directory: ${relativeDir}`)
  }

  if (is.dev) {
    return join(app.getAppPath(), 'resources', 'data', relativeDir)
  }
  return join(process.resourcesPath, 'data', relativeDir)
}

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getVersion', () => {
    return process.env.npm_package_version ?? '0.1.0'
  })

  ipcMain.handle('data:load', async (_event, relativePath: string) => {
    const fullPath = resolveDataPath(relativePath)
    const raw = await readFile(fullPath, 'utf-8')
    return JSON.parse(raw)
  })

  ipcMain.handle('data:load-dir', async (_event, relativeDir: string) => {
    const dirPath = resolveDataDir(relativeDir)
    const entries = await readdir(dirPath)
    const jsonFiles = entries.filter((f) => f.endsWith('.json')).sort()
    const items = await Promise.all(
      jsonFiles.map(async (f) => {
        const raw = await readFile(join(dirPath, f), 'utf-8')
        return JSON.parse(raw)
      })
    )
    return items
  })
}
