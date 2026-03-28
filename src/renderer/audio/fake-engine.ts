import type { AudioDeviceInfo } from './types'
import type { AudioPipeline } from './pipeline'
import type { E2EAudioMode } from '../utils/e2e-runtime'

export const DEFAULT_FAKE_INPUT_DEVICE_ID = 'e2e-input-1'
export const DEFAULT_FAKE_OUTPUT_DEVICE_ID = 'e2e-output-1'

const CONNECTED_LEVEL = 0.34
const CONNECTED_LATENCY_SECONDS = 0.012

const FAKE_AUDIO_DEVICES: AudioDeviceInfo[] = [
  {
    id: DEFAULT_FAKE_INPUT_DEVICE_ID,
    label: 'E2E USB Interface',
    kind: 'audioinput'
  },
  {
    id: DEFAULT_FAKE_OUTPUT_DEVICE_ID,
    label: 'E2E Studio Monitors',
    kind: 'audiooutput'
  }
]

export class FakeAudioEngine {
  private levelCallback: ((level: number) => void) | null = null
  private deviceChangeCallbacks: Array<() => void> = []
  private _isRunning = false

  constructor(private readonly mode: E2EAudioMode) {
    this._isRunning = mode === 'connected'
  }

  get isRunning(): boolean {
    return this._isRunning
  }

  get sampleRate(): number {
    return 48_000
  }

  get latencyEstimate(): number {
    return this._isRunning ? CONNECTED_LATENCY_SECONDS : 0
  }

  async initialize(): Promise<void> {
    return Promise.resolve()
  }

  async enumerateDevices(): Promise<AudioDeviceInfo[]> {
    return [...FAKE_AUDIO_DEVICES]
  }

  async connectInput(deviceId: string): Promise<void> {
    if (this.mode === 'permission-denied') {
      throw new Error('Microphone permission is blocked.')
    }

    if (deviceId !== DEFAULT_FAKE_INPUT_DEVICE_ID) {
      throw new Error('Selected input device is unavailable.')
    }

    this._isRunning = true
    this.levelCallback?.(CONNECTED_LEVEL)
  }

  disconnectInput(): void {
    this._isRunning = false
    this.levelCallback?.(0)
  }

  async setOutputDevice(deviceId: string): Promise<void> {
    if (deviceId !== DEFAULT_FAKE_OUTPUT_DEVICE_ID) {
      throw new Error('Selected output device is unavailable.')
    }
  }

  setMasterVolume(_volume: number): void {
    // No-op in e2e mode.
  }

  onDeviceChange(callback: () => void): () => void {
    this.deviceChangeCallbacks.push(callback)
    return () => {
      this.deviceChangeCallbacks = this.deviceChangeCallbacks.filter((cb) => cb !== callback)
    }
  }

  onLevel(callback: (level: number) => void): void {
    this.levelCallback = callback
    callback(this._isRunning ? CONNECTED_LEVEL : 0)
  }

  getPipeline(): AudioPipeline | null {
    return null
  }

  getContext(): AudioContext | null {
    return null
  }

  async dispose(): Promise<void> {
    this.disconnectInput()
    this.deviceChangeCallbacks = []
  }
}
