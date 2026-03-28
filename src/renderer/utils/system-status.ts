export type PermissionState = 'unknown' | 'prompt' | 'granted' | 'denied'
export type LatencyBand = 'offline' | 'good' | 'playable' | 'high'
export type SignalBand = 'offline' | 'silent' | 'low' | 'healthy' | 'hot' | 'clipping'

export interface SystemStatus {
  permissionState: PermissionState
  isConnected: boolean
  inputDeviceId: string | null
  inputDeviceLabel: string
  outputDeviceId: string | null
  outputDeviceLabel: string
  inputLevel: number
  signalBand: SignalBand
  signalLabel: string
  latencyMs: number | null
  latencyBand: LatencyBand
  latencyLabel: string
  activeMode: string
  lastRecoverableError: string | null
  devicesLoading: boolean
}

export function getLatencyBand(latencyMs: number | null, isConnected: boolean): LatencyBand {
  if (!isConnected || latencyMs === null) return 'offline'
  if (latencyMs <= 15) return 'good'
  if (latencyMs <= 35) return 'playable'
  return 'high'
}

export function getLatencyLabel(latencyBand: LatencyBand, latencyMs: number | null): string {
  if (latencyBand === 'offline' || latencyMs === null) return 'Offline'
  if (latencyBand === 'good') return `Good (${latencyMs.toFixed(1)}ms)`
  if (latencyBand === 'playable') return `Playable (${latencyMs.toFixed(1)}ms)`
  return `High (${latencyMs.toFixed(1)}ms)`
}

export function getSignalBand(level: number, isConnected: boolean): SignalBand {
  if (!isConnected) return 'offline'
  if (level < 0.03) return 'silent'
  if (level < 0.18) return 'low'
  if (level < 0.8) return 'healthy'
  if (level < 0.95) return 'hot'
  return 'clipping'
}

export function getSignalLabel(signalBand: SignalBand): string {
  switch (signalBand) {
    case 'offline':
      return 'Offline'
    case 'silent':
      return 'No signal'
    case 'low':
      return 'Too low'
    case 'healthy':
      return 'Healthy'
    case 'hot':
      return 'Hot'
    case 'clipping':
      return 'Clipping'
  }
}
