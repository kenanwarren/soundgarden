import type {
  AudioBackendConfig,
  AudioDeviceInfo,
  AudioProcessorDescriptor,
  AnalysisData
} from '../types'

export interface IAudioBackend {
  initialize(config: AudioBackendConfig): Promise<void>
  dispose(): Promise<void>

  enumerateDevices(): Promise<AudioDeviceInfo[]>
  selectInputDevice(deviceId: string): Promise<void>
  selectOutputDevice(deviceId: string): Promise<void>

  startStream(): Promise<void>
  stopStream(): Promise<void>

  addProcessor(processor: AudioProcessorDescriptor): void
  removeProcessor(id: string): void
  reorderProcessors(ids: string[]): void
  setProcessorParam(processorId: string, param: string, value: number): void

  onAnalysisData(callback: (data: AnalysisData) => void): void
  offAnalysisData(callback: (data: AnalysisData) => void): void

  getLatencyEstimate(): number
  getSampleRate(): number
  isRunning(): boolean
}
