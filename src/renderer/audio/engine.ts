import { enumerateAudioDevices, getInputStream, onDeviceChange } from './device-selector'
import { AudioPipeline } from './pipeline'
import type { AudioDeviceInfo } from './types'

export class AudioEngine {
  private context: AudioContext | null = null
  private pipeline: AudioPipeline | null = null
  private stream: MediaStream | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private analyserNode: AnalyserNode | null = null
  private removeDeviceChangeListener: (() => void) | null = null

  private _isRunning = false
  private deviceChangeCallbacks: Array<() => void> = []
  private levelCallback: ((level: number) => void) | null = null
  private animFrameId: number | null = null

  get isRunning(): boolean {
    return this._isRunning
  }

  get sampleRate(): number {
    return this.context?.sampleRate ?? 48000
  }

  get latencyEstimate(): number {
    if (!this.context) return 0
    return (this.context.baseLatency ?? 0) + (this.context.outputLatency ?? 0)
  }

  async initialize(): Promise<void> {
    this.context = new AudioContext({
      sampleRate: 48000,
      latencyHint: 'interactive'
    })

    this.analyserNode = this.context.createAnalyser()
    this.analyserNode.fftSize = 2048
    this.analyserNode.smoothingTimeConstant = 0.8

    this.pipeline = new AudioPipeline(this.context)
    this.pipeline.setAnalyserNode(this.analyserNode)

    this.removeDeviceChangeListener = onDeviceChange(() => {
      this.deviceChangeCallbacks.forEach((cb) => cb())
    })
  }

  async enumerateDevices(): Promise<AudioDeviceInfo[]> {
    return enumerateAudioDevices()
  }

  async connectInput(deviceId: string): Promise<void> {
    if (!this.context || !this.pipeline) {
      throw new Error('Engine not initialized')
    }

    // Resume context (Chromium suspends until a user gesture)
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }

    this.disconnectInput()

    this.stream = await getInputStream(deviceId)
    this.sourceNode = this.context.createMediaStreamSource(this.stream)

    // Connect source → pipeline (which handles the chain to destination + analyser tap)
    this.pipeline.connectSource(this.sourceNode)

    this._isRunning = true
    this.startLevelMonitoring()
  }

  disconnectInput(): void {
    this.stopLevelMonitoring()

    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }

    this.pipeline?.disconnectSource()
    this._isRunning = false
  }

  async setOutputDevice(deviceId: string): Promise<void> {
    if (!this.context) return
    // setSinkId is available in Chromium-based browsers
    if ('setSinkId' in this.context) {
      await (this.context as AudioContext & { setSinkId: (id: string) => Promise<void> }).setSinkId(
        deviceId
      )
    }
  }

  setMasterVolume(volume: number): void {
    this.pipeline?.setMasterVolume(volume)
  }

  onDeviceChange(callback: () => void): () => void {
    this.deviceChangeCallbacks.push(callback)
    return () => {
      this.deviceChangeCallbacks = this.deviceChangeCallbacks.filter((cb) => cb !== callback)
    }
  }

  onLevel(callback: (level: number) => void): void {
    this.levelCallback = callback
  }

  getPipeline(): AudioPipeline | null {
    return this.pipeline
  }

  getContext(): AudioContext | null {
    return this.context
  }

  async dispose(): Promise<void> {
    this.disconnectInput()
    this.removeDeviceChangeListener?.()

    if (this.context && this.context.state !== 'closed') {
      await this.context.close()
    }

    this.context = null
    this.pipeline = null
    this.analyserNode = null
  }

  private startLevelMonitoring(): void {
    if (!this.analyserNode || !this.levelCallback) return

    const dataArray = new Float32Array(this.analyserNode.fftSize)

    const tick = (): void => {
      if (!this.analyserNode || !this._isRunning) return

      this.analyserNode.getFloatTimeDomainData(dataArray)

      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / dataArray.length)
      const db = 20 * Math.log10(Math.max(rms, 1e-10))
      const normalized = Math.max(0, Math.min(1, (db + 60) / 60))

      this.levelCallback?.(normalized)
      this.animFrameId = requestAnimationFrame(tick)
    }

    this.animFrameId = requestAnimationFrame(tick)
  }

  private stopLevelMonitoring(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }
}
