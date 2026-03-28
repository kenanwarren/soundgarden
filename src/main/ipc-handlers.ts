import { ipcMain } from 'electron'

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getVersion', () => {
    return process.env.npm_package_version ?? '0.1.0'
  })
}
