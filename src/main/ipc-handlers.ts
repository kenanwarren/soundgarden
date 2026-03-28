import { app, ipcMain } from 'electron'
import { readFile } from 'fs/promises'
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

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getVersion', () => {
    return process.env.npm_package_version ?? '0.1.0'
  })

  ipcMain.handle('data:load', async (_event, relativePath: string) => {
    const fullPath = resolveDataPath(relativePath)
    const raw = await readFile(fullPath, 'utf-8')
    return JSON.parse(raw)
  })
}
