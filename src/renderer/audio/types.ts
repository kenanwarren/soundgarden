export interface AudioDeviceInfo {
  id: string
  label: string
  kind: 'audioinput' | 'audiooutput'
}

export interface AudioEngineState {
  isRunning: boolean
  inputDeviceId: string | null
  outputDeviceId: string | null
  sampleRate: number
  inputLevel: number
  masterVolume: number
}

export interface AudioBackendConfig {
  sampleRate: number
  latencyHint: AudioContextLatencyCategory
}

export interface AnalysisData {
  type: 'level' | 'pitch'
  value: number
  confidence?: number
}

export type AudioProcessorType =
  | 'gain'
  | 'eq'
  | 'reverb'
  | 'delay'
  | 'chorus'
  | 'compressor'
  | 'noisegate'
  | 'nam'
  | 'tuner'
  | 'tremolo'
  | 'phaser'
  | 'flanger'
  | 'distortion'
  | 'wah'
  | 'pitchshift'
  | 'cabinet'
  | 'cleanboost'
  | 'autoswell'
  | 'limiter'
  | 'ringmod'
  | 'bitcrusher'
  | 'octaver'
  | 'rotary'
  | 'graphiceq'
  | 'parameq'
  | 'shimmer'
  | 'harmonizer'
  | 'looper'

export interface AudioProcessorDescriptor {
  id: string
  type: AudioProcessorType
  enabled: boolean
  params: Record<string, number>
}
