import { useEffect, useCallback } from 'react'
import { AudioEngine } from '../audio/engine'
import { AudioPipeline } from '../audio/pipeline'
import { FakeAudioEngine, DEFAULT_FAKE_INPUT_DEVICE_ID, DEFAULT_FAKE_OUTPUT_DEVICE_ID } from '../audio/fake-engine'
import type { AudioDeviceInfo } from '../audio/types'
import { useAudioStore } from '../stores/audio-store'
import { useAppSettingsStore } from '../stores/app-settings-store'
import { useUiStore } from '../stores/ui-store'
import type { PermissionState } from '../utils/system-status'
import { getE2ERuntimeConfig, type E2EAudioMode } from '../utils/e2e-runtime'

interface AudioEngineLike {
  readonly isRunning: boolean
  readonly sampleRate: number
  readonly latencyEstimate: number
  initialize(): Promise<void>
  enumerateDevices(): Promise<AudioDeviceInfo[]>
  connectInput(deviceId: string): Promise<void>
  disconnectInput(): void
  setOutputDevice(deviceId: string): Promise<void>
  setMasterVolume(volume: number): void
  onDeviceChange(callback: () => void): () => void
  onLevel(callback: (level: number) => void): void
  getPipeline(): AudioPipeline | null
  getContext(): AudioContext | null
  dispose(): Promise<void>
}

const engineRef = { current: null as AudioEngineLike | null }
let globalInitialized = false

export function getEngine(): AudioEngineLike | null {
  return engineRef.current
}

function normalizePermissionState(state: string): PermissionState {
  if (state === 'granted' || state === 'denied' || state === 'prompt') {
    return state
  }
  return 'unknown'
}

async function syncDevices(engine: AudioEngineLike): Promise<void> {
  const { setDevicesLoading, setDevices, setLastRecoverableError } = useAudioStore.getState()
  const { audio, setAudioSetting } = useAppSettingsStore.getState()
  const permissionState = useAudioStore.getState().permissionState

  setDevicesLoading(true)

  try {
    const devices = await engine.enumerateDevices()
    const inputDevices = devices.filter((device) => device.kind === 'audioinput')
    const outputDevices = devices.filter((device) => device.kind === 'audiooutput')
    let nextError: string | null = null

    setDevices(devices)

    if (audio.inputDeviceId && !inputDevices.some((device) => device.id === audio.inputDeviceId)) {
      engine.disconnectInput()
      setAudioSetting('inputDeviceId', null)
      useAudioStore.getState().setConnected(false)
      nextError = 'Your saved input device is unavailable. Select another input to continue.'
      useUiStore.getState().pushNotice({
        tone: 'warning',
        title: 'Input device unavailable',
        description: 'Your saved input device was removed or is no longer available.'
      })
    }

    if (
      audio.outputDeviceId &&
      !outputDevices.some((device) => device.id === audio.outputDeviceId)
    ) {
      setAudioSetting('outputDeviceId', null)
      nextError =
        'Your saved output device is unavailable. Soundgarden switched back to the default output.'
      useUiStore.getState().pushNotice({
        tone: 'warning',
        title: 'Output device unavailable',
        description: 'Soundgarden switched back to the default output.'
      })
    }

    if (devices.length === 0) {
      nextError = 'No audio devices were found.'
    }

    if (permissionState === 'denied' && nextError === null) {
      nextError = 'Microphone access is blocked. Grant permission to use live audio features.'
    }

    setLastRecoverableError(nextError)
  } catch (err) {
    setLastRecoverableError('Could not enumerate audio devices.')
    useUiStore.getState().pushNotice({
      tone: 'error',
      title: 'Audio device scan failed',
      description: String(err)
    })
  } finally {
    setDevicesLoading(false)
  }
}

async function initializeE2EEngine(
  engine: FakeAudioEngine,
  mode: E2EAudioMode,
  setInputLevel: (level: number) => void,
  setPermissionState: (state: PermissionState) => void,
  setConnected: (connected: boolean) => void
): Promise<void> {
  const setAudioSetting = useAppSettingsStore.getState().setAudioSetting
  const initialAudio = useAppSettingsStore.getState().audio

  if (mode !== 'permission-denied' && !initialAudio.outputDeviceId) {
    setAudioSetting('outputDeviceId', DEFAULT_FAKE_OUTPUT_DEVICE_ID)
  }

  if ((mode === 'offline-selected-input' || mode === 'connected') && !initialAudio.inputDeviceId) {
    setAudioSetting('inputDeviceId', DEFAULT_FAKE_INPUT_DEVICE_ID)
  }

  setPermissionState(mode === 'permission-denied' ? 'denied' : 'granted')

  await syncDevices(engine)

  engine.onLevel((level) => setInputLevel(level))
  engine.onDeviceChange(() => {
    void syncDevices(engine)
  })

  const { audio } = useAppSettingsStore.getState()

  if (audio.outputDeviceId) {
    try {
      await engine.setOutputDevice(audio.outputDeviceId)
    } catch {
      setAudioSetting('outputDeviceId', null)
    }
  }

  if (mode === 'connected' && audio.inputDeviceId) {
    try {
      await engine.connectInput(audio.inputDeviceId)
      setConnected(true)
    } catch (err) {
      setConnected(false)
      useAudioStore
        .getState()
        .setLastRecoverableError('Soundgarden could not reconnect to the saved input device.')
      useUiStore.getState().pushNotice({
        tone: 'warning',
        title: 'Reconnect failed',
        description: String(err)
      })
    }
  } else {
    setConnected(false)
    setInputLevel(0)
  }

  engine.setMasterVolume(audio.monitoringEnabled ? audio.masterVolume : 0)
}

/**
 * Call this once at the App level to initialize the audio engine.
 * The engine persists for the lifetime of the app (not tied to page navigation).
 */
export function useAudioEngineInit() {
  const { setInputLevel, setPermissionState, setConnected, setLastRecoverableError } =
    useAudioStore()

  useEffect(() => {
    if (globalInitialized) return
    globalInitialized = true

    const runtimeConfig = getE2ERuntimeConfig()
    const e2eAudioMode = runtimeConfig.enabled ? runtimeConfig.audioMode ?? 'offline-no-input' : null
    const engine: AudioEngineLike = e2eAudioMode ? new FakeAudioEngine(e2eAudioMode) : new AudioEngine()
    engineRef.current = engine
    let cancelled = false
    let permissionStatus: PermissionStatus | null = null
    let removePermissionListener: (() => void) | null = null

    const setupPermissionTracking = async () => {
      if (!('permissions' in navigator) || !navigator.permissions?.query) return

      try {
        permissionStatus = await navigator.permissions.query({
          name: 'microphone' as PermissionName
        })
        setPermissionState(normalizePermissionState(permissionStatus.state))

        const handlePermissionChange = () => {
          setPermissionState(normalizePermissionState(permissionStatus?.state ?? 'unknown'))
        }

        permissionStatus.addEventListener('change', handlePermissionChange)
        removePermissionListener = () =>
          permissionStatus?.removeEventListener('change', handlePermissionChange)
      } catch {
        setPermissionState('unknown')
      }
    }

    void engine.initialize().then(async () => {
      if (cancelled) return

      if (e2eAudioMode && engine instanceof FakeAudioEngine) {
        await initializeE2EEngine(
          engine,
          e2eAudioMode,
          setInputLevel,
          setPermissionState,
          setConnected
        )
        return
      }

      await setupPermissionTracking()

      // Request permission first with a temp stream to get device labels.
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        tempStream.getTracks().forEach((track) => track.stop())
        setPermissionState('granted')
        setLastRecoverableError(null)
      } catch (err) {
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setPermissionState('denied')
          setLastRecoverableError(
            'Microphone access is blocked. Grant permission to use live audio features.'
          )
        }
      }

      await syncDevices(engine)

      if (cancelled) return

      engine.onLevel((level) => setInputLevel(level))
      engine.onDeviceChange(() => {
        void syncDevices(engine)
      })

      const { audio } = useAppSettingsStore.getState()

      if (audio.outputDeviceId) {
        try {
          await engine.setOutputDevice(audio.outputDeviceId)
        } catch {
          useAppSettingsStore.getState().setAudioSetting('outputDeviceId', null)
        }
      }

      if (audio.autoReconnect && audio.inputDeviceId) {
        try {
          await engine.connectInput(audio.inputDeviceId)
          setConnected(true)
          setLastRecoverableError(null)
        } catch (err) {
          setConnected(false)
          setLastRecoverableError('Soundgarden could not reconnect to the saved input device.')
          useUiStore.getState().pushNotice({
            tone: 'warning',
            title: 'Reconnect failed',
            description: String(err)
          })
        }
      }

      engine.setMasterVolume(audio.monitoringEnabled ? audio.masterVolume : 0)
    })

    return () => {
      cancelled = true
      removePermissionListener?.()
      void engine.dispose()
      engineRef.current = null
      globalInitialized = false
    }
  }, [setConnected, setInputLevel, setLastRecoverableError, setPermissionState])
}

/**
 * Use in any page component to get audio connect/disconnect controls.
 */
export function useAudioEngine() {
  const isConnected = useAudioStore((s) => s.isConnected)
  const inputDeviceId = useAppSettingsStore((s) => s.audio.inputDeviceId)
  const outputDeviceId = useAppSettingsStore((s) => s.audio.outputDeviceId)
  const masterVolume = useAppSettingsStore((s) => s.audio.masterVolume)
  const monitoringEnabled = useAppSettingsStore((s) => s.audio.monitoringEnabled)
  const setConnected = useAudioStore((s) => s.setConnected)
  const setLastRecoverableError = useAudioStore((s) => s.setLastRecoverableError)

  const connect = useCallback(
    async (deviceId: string) => {
      const engine = engineRef.current
      if (!engine) return

      try {
        await engine.connectInput(deviceId)
        setConnected(true)
        setLastRecoverableError(null)
      } catch (err) {
        setConnected(false)
        setLastRecoverableError('Soundgarden could not connect to the selected input device.')
        useUiStore.getState().pushNotice({
          tone: 'error',
          title: 'Input connection failed',
          description: String(err)
        })
      }
    },
    [setConnected, setLastRecoverableError]
  )

  const disconnect = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return

    engine.disconnectInput()
    setConnected(false)
  }, [setConnected])

  useEffect(() => {
    const engine = engineRef.current
    if (engine && outputDeviceId) {
      void engine.setOutputDevice(outputDeviceId).catch((err) => {
        useAudioStore
          .getState()
          .setLastRecoverableError('Soundgarden could not switch to the selected output device.')
        useUiStore.getState().pushNotice({
          tone: 'warning',
          title: 'Output switch failed',
          description: String(err)
        })
      })
    }
  }, [outputDeviceId])

  useEffect(() => {
    const engine = engineRef.current
    if (engine) {
      engine.setMasterVolume(monitoringEnabled ? masterVolume : 0)
    }
  }, [masterVolume, monitoringEnabled])

  return {
    isConnected,
    inputDeviceId,
    connect,
    disconnect,
    engine: engineRef.current
  }
}
