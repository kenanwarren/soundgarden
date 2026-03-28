import { contextBridge, ipcRenderer } from 'electron'

const runtime = {
  e2e: {
    enabled: process.env['SOUNDGARDEN_E2E'] === '1',
    audioMode: process.env['SOUNDGARDEN_E2E_AUDIO_MODE'] ?? null
  }
}

const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  runtime
}

contextBridge.exposeInMainWorld('api', api)
