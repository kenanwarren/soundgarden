import { contextBridge, ipcRenderer } from 'electron'

const runtime = {
  e2e: {
    enabled: process.env['SOUNDGARDEN_E2E'] === '1',
    audioMode: process.env['SOUNDGARDEN_E2E_AUDIO_MODE'] ?? null
  }
}

const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  loadData: (relativePath: string): Promise<unknown> =>
    ipcRenderer.invoke('data:load', relativePath),
  loadDataDir: (relativeDir: string): Promise<unknown[]> =>
    ipcRenderer.invoke('data:load-dir', relativeDir),
  runtime
}

contextBridge.exposeInMainWorld('api', api)
