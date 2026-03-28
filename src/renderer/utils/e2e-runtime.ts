export type E2EAudioMode =
  | 'permission-denied'
  | 'offline-no-input'
  | 'offline-selected-input'
  | 'connected'

export interface E2ERuntimeConfig {
  enabled: boolean
  audioMode: E2EAudioMode | null
}

const VALID_AUDIO_MODES = new Set<E2EAudioMode>([
  'permission-denied',
  'offline-no-input',
  'offline-selected-input',
  'connected'
])

export function getE2ERuntimeConfig(): E2ERuntimeConfig {
  if (typeof window === 'undefined') {
    return { enabled: false, audioMode: null }
  }

  const runtime = window.api?.runtime?.e2e
  if (!runtime?.enabled) {
    return { enabled: false, audioMode: null }
  }

  const audioMode = VALID_AUDIO_MODES.has(runtime.audioMode as E2EAudioMode)
    ? (runtime.audioMode as E2EAudioMode)
    : 'offline-no-input'

  return {
    enabled: true,
    audioMode
  }
}
