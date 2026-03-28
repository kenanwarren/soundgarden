import { vi } from 'vitest'

export class MockAudioParam {
  value = 0
  setTargetAtTimeCalls: Array<[number, number, number]> = []
  setValueAtTimeCalls: Array<[number, number]> = []
  exponentialRampToValueAtTimeCalls: Array<[number, number]> = []

  setTargetAtTime(value: number, startTime: number, timeConstant: number): void {
    this.value = value
    this.setTargetAtTimeCalls.push([value, startTime, timeConstant])
  }

  setValueAtTime(value: number, startTime: number): void {
    this.value = value
    this.setValueAtTimeCalls.push([value, startTime])
  }

  exponentialRampToValueAtTime(value: number, endTime: number): void {
    this.value = value
    this.exponentialRampToValueAtTimeCalls.push([value, endTime])
  }
}

export class MockAudioNode {
  readonly connections: MockAudioNode[] = []
  disconnectCalls = 0

  constructor(readonly label: string) {}

  connect(node: MockAudioNode): MockAudioNode {
    this.connections.push(node)
    return node
  }

  disconnect(): void {
    this.disconnectCalls += 1
    this.connections.length = 0
  }
}

export class MockGainNode extends MockAudioNode {
  readonly gain = new MockAudioParam()

  constructor(label: string) {
    super(label)
  }
}

export class MockBiquadFilterNode extends MockAudioNode {
  type: BiquadFilterType = 'peaking'
  readonly frequency = new MockAudioParam()
  readonly gain = new MockAudioParam()
  readonly Q = new MockAudioParam()

  constructor(label: string) {
    super(label)
  }
}

export class MockAnalyserNode extends MockAudioNode {
  fftSize = 2048
  smoothingTimeConstant = 0.8
  floatData = new Float32Array(2048)
  getFloatTimeDomainDataCalls = 0
  getFloatFrequencyDataCalls = 0

  constructor(label: string) {
    super(label)
  }

  getFloatTimeDomainData(target: Float32Array): void {
    this.getFloatTimeDomainDataCalls += 1
    target.set(this.floatData.subarray(0, target.length))
  }

  getFloatFrequencyData(target: Float32Array): void {
    this.getFloatFrequencyDataCalls += 1
    target.fill(-120)
  }
}

export class MockConvolverNode extends MockAudioNode {
  buffer: AudioBuffer | null = null

  constructor(label: string) {
    super(label)
  }
}

export class MockOscillatorNode extends MockAudioNode {
  readonly frequency = { value: 0 }
  readonly start = vi.fn<(time?: number) => void>()
  readonly stop = vi.fn<(time?: number) => void>()

  constructor(label: string) {
    super(label)
  }
}

export class MockAudioWorkletPort {
  readonly postMessage = vi.fn<(message: unknown) => void>()
  readonly start = vi.fn<() => void>()
  private readonly listeners = new Set<(event: MessageEvent) => void>()

  addEventListener(_type: 'message', listener: (event: MessageEvent) => void): void {
    this.listeners.add(listener)
  }

  removeEventListener(_type: 'message', listener: (event: MessageEvent) => void): void {
    this.listeners.delete(listener)
  }

  emit(data: unknown): void {
    const event = { data } as MessageEvent
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

export class MockAudioWorkletNode extends MockAudioNode {
  readonly parameters = {
    get: (name: string): MockAudioParam => {
      const existing = this.parameterStore.get(name)
      if (existing) return existing
      const param = new MockAudioParam()
      this.parameterStore.set(name, param)
      return param
    }
  }
  readonly port = new MockAudioWorkletPort()
  private readonly parameterStore = new Map<string, MockAudioParam>()

  constructor(
    readonly context: MockAudioContext,
    readonly processorName: string
  ) {
    super(`worklet:${processorName}`)
    this.context.createdWorklets.push(this)
  }

  getParam(name: string): MockAudioParam {
    return this.parameters.get(name)
  }
}

export class MockMediaStreamTrack {
  readonly stop = vi.fn<() => void>()
}

export class MockMediaStream {
  readonly tracks = [new MockMediaStreamTrack()]

  getTracks(): MockMediaStreamTrack[] {
    return this.tracks
  }
}

export class MockAudioContext {
  readonly destination = new MockAudioNode('destination')
  readonly createdGains: MockGainNode[] = []
  readonly createdAnalysers: MockAnalyserNode[] = []
  readonly createdBiquads: MockBiquadFilterNode[] = []
  readonly createdConvolvers: MockConvolverNode[] = []
  readonly createdOscillators: MockOscillatorNode[] = []
  readonly createdMediaStreamSources: MockAudioNode[] = []
  readonly createdWorklets: MockAudioWorkletNode[] = []
  readonly audioWorklet = {
    addModule: vi.fn<(url: string) => Promise<void>>().mockResolvedValue()
  }
  readonly resume = vi.fn<() => Promise<void>>().mockResolvedValue()
  readonly close = vi.fn<() => Promise<void>>().mockResolvedValue()
  readonly setSinkId = vi.fn<(id: string) => Promise<void>>().mockResolvedValue()
  readonly decodeAudioData = vi.fn<(data: ArrayBuffer) => Promise<AudioBuffer>>()
  currentTime = 0
  sampleRate = 48_000
  baseLatency = 0.01
  outputLatency = 0.002
  state: AudioContextState = 'running'

  constructor(init?: Partial<Pick<MockAudioContext, 'sampleRate' | 'baseLatency' | 'outputLatency' | 'state'>>) {
    if (init?.sampleRate !== undefined) this.sampleRate = init.sampleRate
    if (init?.baseLatency !== undefined) this.baseLatency = init.baseLatency
    if (init?.outputLatency !== undefined) this.outputLatency = init.outputLatency
    if (init?.state !== undefined) this.state = init.state

    this.decodeAudioData.mockImplementation(async () => this.createBuffer(2, 128, this.sampleRate))
  }

  createGain(): MockGainNode {
    const node = new MockGainNode(`gain:${this.createdGains.length}`)
    this.createdGains.push(node)
    return node
  }

  createAnalyser(): MockAnalyserNode {
    const node = new MockAnalyserNode(`analyser:${this.createdAnalysers.length}`)
    this.createdAnalysers.push(node)
    return node
  }

  createMediaStreamSource(_stream: MediaStream): MockAudioNode {
    const node = new MockAudioNode(`media-source:${this.createdMediaStreamSources.length}`)
    this.createdMediaStreamSources.push(node)
    return node
  }

  createBiquadFilter(): MockBiquadFilterNode {
    const node = new MockBiquadFilterNode(`biquad:${this.createdBiquads.length}`)
    this.createdBiquads.push(node)
    return node
  }

  createConvolver(): MockConvolverNode {
    const node = new MockConvolverNode(`convolver:${this.createdConvolvers.length}`)
    this.createdConvolvers.push(node)
    return node
  }

  createOscillator(): MockOscillatorNode {
    const node = new MockOscillatorNode(`oscillator:${this.createdOscillators.length}`)
    this.createdOscillators.push(node)
    return node
  }

  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer {
    const channelData = Array.from({ length: channels }, () => new Float32Array(length))
    return {
      sampleRate,
      length,
      duration: length / sampleRate,
      numberOfChannels: channels,
      getChannelData: (channel: number) => channelData[channel]
    } as AudioBuffer
  }
}

export class MockPipeline {
  effectNodes: Array<{ id: string; enabled: boolean; getInput(): MockAudioNode; getOutput(): MockAudioNode }> = []
  readonly masterGainNode = new MockGainNode('pipeline-master')
  readonly setEffectNodes = vi.fn((nodes: typeof this.effectNodes) => {
    this.effectNodes = nodes
  })
  readonly getEffectNodes = vi.fn(() => this.effectNodes)
  readonly getMasterGainNode = vi.fn(() => this.masterGainNode)
}

export function installAudioGlobals(contextFactory: () => MockAudioContext): void {
  class AudioContextStub {
    constructor() {
      return contextFactory() as unknown as AudioContextStub
    }
  }

  vi.stubGlobal('AudioContext', AudioContextStub)
  vi.stubGlobal('AudioWorkletNode', MockAudioWorkletNode)
}

export function uninstallAudioGlobals(): void {
  vi.unstubAllGlobals()
}

export async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}
