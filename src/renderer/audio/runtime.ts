import { AudioEngine } from './engine'
import { AudioPipeline } from './pipeline'
import {
  FakeAudioEngine,
  DEFAULT_FAKE_INPUT_DEVICE_ID,
  DEFAULT_FAKE_OUTPUT_DEVICE_ID
} from './fake-engine'
import type { AudioDeviceInfo } from './types'
import { useAudioStore } from '../stores/audio-store'
import { useAppSettingsStore } from '../stores/app-settings-store'
import { useUiStore } from '../stores/ui-store'
import type { PermissionState } from '../utils/system-status'
import { getE2ERuntimeConfig, type E2EAudioMode } from '../utils/e2e-runtime'

export interface AudioEngineLike {
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

export interface AudioRuntimeState {
  isReady: boolean
  isConnected: boolean
  inputDevices: AudioDeviceInfo[]
  outputDevices: AudioDeviceInfo[]
  inputLevel: number
  devicesLoading: boolean
  permissionState: PermissionState
  lastRecoverableError: string | null
  inputDeviceId: string | null
  outputDeviceId: string | null
  sampleRate: number | null
  latencyEstimateMs: number | null
}

export interface AudioRuntimeCommands {
  initialize: () => Promise<void>
  dispose: () => Promise<void>
  refreshDevices: () => Promise<void>
  connectInput: (deviceId: string, options?: { reconnect?: boolean }) => Promise<void>
  disconnectInput: () => void
  reconnectSelectedInput: () => Promise<void>
  applyOutputDevice: (deviceId: string | null) => Promise<void>
  applyMonitoring: (volume: number, enabled: boolean) => void
}

const engineRef = { current: null as AudioEngineLike | null }
let runtimeInitialized = false
let removePermissionListener: (() => void) | null = null
let removeDeviceChangeListener: (() => void) | null = null

function normalizePermissionState(state: string): PermissionState {
  if (state === 'granted' || state === 'denied' || state === 'prompt') {
    return state
  }
  return 'unknown'
}

function updateEngineMetrics(engine: AudioEngineLike | null): void {
  useAudioStore
    .getState()
    .setEngineMetrics(engine?.sampleRate ?? null, engine ? engine.latencyEstimate * 1000 : null)
}

function clearRuntimeState(): void {
  useAudioStore.getState().setRuntimeReady(false)
  useAudioStore.getState().setConnected(false)
  useAudioStore.getState().setInputLevel(0)
  useAudioStore.getState().setDevices([])
  useAudioStore.getState().setDevicesLoading(false)
  useAudioStore.getState().setEngineMetrics(null, null)
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
      useAudioStore.getState().setInputLevel(0)
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

async function setupPermissionTracking(): Promise<void> {
  if (!('permissions' in navigator) || !navigator.permissions?.query) return

  try {
    const permissionStatus = await navigator.permissions.query({
      name: 'microphone' as PermissionName
    })

    useAudioStore.getState().setPermissionState(normalizePermissionState(permissionStatus.state))

    const handlePermissionChange = () => {
      useAudioStore
        .getState()
        .setPermissionState(normalizePermissionState(permissionStatus.state ?? 'unknown'))
    }

    permissionStatus.addEventListener('change', handlePermissionChange)
    removePermissionListener = () =>
      permissionStatus.removeEventListener('change', handlePermissionChange)
  } catch {
    useAudioStore.getState().setPermissionState('unknown')
  }
}

async function initializeE2EEngine(engine: FakeAudioEngine, mode: E2EAudioMode): Promise<void> {
  const setAudioSetting = useAppSettingsStore.getState().setAudioSetting
  const initialAudio = useAppSettingsStore.getState().audio

  if (mode !== 'permission-denied' && !initialAudio.outputDeviceId) {
    setAudioSetting('outputDeviceId', DEFAULT_FAKE_OUTPUT_DEVICE_ID)
  }

  if ((mode === 'offline-selected-input' || mode === 'connected') && !initialAudio.inputDeviceId) {
    setAudioSetting('inputDeviceId', DEFAULT_FAKE_INPUT_DEVICE_ID)
  }

  useAudioStore.getState().setPermissionState(mode === 'permission-denied' ? 'denied' : 'granted')

  await syncDevices(engine)
  updateEngineMetrics(engine)

  engine.onLevel((level) => useAudioStore.getState().setInputLevel(level))
  removeDeviceChangeListener = engine.onDeviceChange(() => {
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
    await connectInput(audio.inputDeviceId, { reconnect: true })
  } else {
    useAudioStore.getState().setConnected(false)
    useAudioStore.getState().setInputLevel(0)
  }

  applyMonitoring(audio.masterVolume, audio.monitoringEnabled)
}

export function getEngine(): AudioEngineLike | null {
  return engineRef.current
}

export function getAudioRuntimeState(): AudioRuntimeState {
  const audioState = useAudioStore.getState()
  const appSettings = useAppSettingsStore.getState().audio

  return {
    isReady: audioState.isReady,
    isConnected: audioState.isConnected,
    inputDevices: audioState.inputDevices,
    outputDevices: audioState.outputDevices,
    inputLevel: audioState.inputLevel,
    devicesLoading: audioState.devicesLoading,
    permissionState: audioState.permissionState,
    lastRecoverableError: audioState.lastRecoverableError,
    inputDeviceId: appSettings.inputDeviceId,
    outputDeviceId: appSettings.outputDeviceId,
    sampleRate: audioState.sampleRate,
    latencyEstimateMs: audioState.latencyEstimateMs
  }
}

export async function initializeAudioRuntime(): Promise<void> {
  if (runtimeInitialized) return

  runtimeInitialized = true
  useAudioStore.getState().setRuntimeReady(false)

  const runtimeConfig = getE2ERuntimeConfig()
  const e2eAudioMode = runtimeConfig.enabled
    ? (runtimeConfig.audioMode ?? 'offline-no-input')
    : null
  const engine: AudioEngineLike = e2eAudioMode
    ? new FakeAudioEngine(e2eAudioMode)
    : new AudioEngine()

  engineRef.current = engine

  try {
    await engine.initialize()
    updateEngineMetrics(engine)

    if (e2eAudioMode && engine instanceof FakeAudioEngine) {
      await initializeE2EEngine(engine, e2eAudioMode)
      useAudioStore.getState().setRuntimeReady(true)
      return
    }

    await setupPermissionTracking()

    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      tempStream.getTracks().forEach((track) => track.stop())
      useAudioStore.getState().setPermissionState('granted')
      useAudioStore.getState().setLastRecoverableError(null)
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        useAudioStore.getState().setPermissionState('denied')
        useAudioStore
          .getState()
          .setLastRecoverableError(
            'Microphone access is blocked. Grant permission to use live audio features.'
          )
      }
    }

    await syncDevices(engine)

    engine.onLevel((level) => useAudioStore.getState().setInputLevel(level))
    removeDeviceChangeListener = engine.onDeviceChange(() => {
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
      await connectInput(audio.inputDeviceId, { reconnect: true })
    }

    applyMonitoring(audio.masterVolume, audio.monitoringEnabled)
    useAudioStore.getState().setRuntimeReady(true)
  } catch (err) {
    runtimeInitialized = false
    engineRef.current = null
    clearRuntimeState()
    useAudioStore.getState().setLastRecoverableError('Soundgarden could not initialize audio.')
    useUiStore.getState().pushNotice({
      tone: 'error',
      title: 'Audio initialization failed',
      description: String(err)
    })
  }
}

export async function disposeAudioRuntime(): Promise<void> {
  if (!runtimeInitialized) return

  const engine = engineRef.current

  runtimeInitialized = false
  removePermissionListener?.()
  removePermissionListener = null
  removeDeviceChangeListener?.()
  removeDeviceChangeListener = null

  if (engine) {
    await engine.dispose()
  }

  engineRef.current = null
  clearRuntimeState()
}

export async function refreshAudioRuntimeDevices(): Promise<void> {
  const engine = engineRef.current
  if (!engine) return
  await syncDevices(engine)
}

export async function connectInput(
  deviceId: string,
  options: { reconnect?: boolean } = {}
): Promise<void> {
  const engine = engineRef.current
  if (!engine) return

  try {
    await engine.connectInput(deviceId)
    useAudioStore.getState().setConnected(true)
    useAudioStore.getState().setLastRecoverableError(null)
    updateEngineMetrics(engine)
  } catch (err) {
    useAudioStore.getState().setConnected(false)
    useAudioStore.getState().setInputLevel(0)
    useAudioStore
      .getState()
      .setLastRecoverableError(
        options.reconnect
          ? 'Soundgarden could not reconnect to the saved input device.'
          : 'Soundgarden could not connect to the selected input device.'
      )
    useUiStore.getState().pushNotice({
      tone: options.reconnect ? 'warning' : 'error',
      title: options.reconnect ? 'Reconnect failed' : 'Input connection failed',
      description: String(err)
    })
  }
}

export function disconnectInput(): void {
  const engine = engineRef.current
  if (!engine) return

  engine.disconnectInput()
  useAudioStore.getState().setConnected(false)
  useAudioStore.getState().setInputLevel(0)
}

export async function reconnectSelectedInput(): Promise<void> {
  const deviceId = useAppSettingsStore.getState().audio.inputDeviceId
  if (!deviceId) return
  await connectInput(deviceId, { reconnect: true })
}

export async function applyOutputDevice(deviceId: string | null): Promise<void> {
  const engine = engineRef.current
  if (!engine || !deviceId) return

  try {
    await engine.setOutputDevice(deviceId)
    updateEngineMetrics(engine)
  } catch (err) {
    useAudioStore
      .getState()
      .setLastRecoverableError('Soundgarden could not switch to the selected output device.')
    useUiStore.getState().pushNotice({
      tone: 'warning',
      title: 'Output switch failed',
      description: String(err)
    })
  }
}

export function applyMonitoring(volume: number, enabled: boolean): void {
  engineRef.current?.setMasterVolume(enabled ? volume : 0)
}

export const audioRuntimeCommands: AudioRuntimeCommands = {
  initialize: initializeAudioRuntime,
  dispose: disposeAudioRuntime,
  refreshDevices: refreshAudioRuntimeDevices,
  connectInput,
  disconnectInput,
  reconnectSelectedInput,
  applyOutputDevice,
  applyMonitoring
}
