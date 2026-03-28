import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioEngine } from '../../src/renderer/audio/engine'
import {
  MockAudioContext,
  MockMediaStream,
  flushPromises,
  installAudioGlobals,
  uninstallAudioGlobals
} from './audio-test-utils'

const enumerateAudioDevices = vi.fn()
const getInputStream = vi.fn()
const onDeviceChange = vi.fn()

vi.mock('../../src/renderer/audio/device-selector', () => ({
  enumerateAudioDevices: (...args: unknown[]) => enumerateAudioDevices(...args),
  getInputStream: (...args: unknown[]) => getInputStream(...args),
  onDeviceChange: (...args: unknown[]) => onDeviceChange(...args)
}))

describe('audio-engine', () => {
  let context: MockAudioContext
  let stream: MockMediaStream
  let removeDeviceChangeListener: ReturnType<typeof vi.fn>
  let animationFrameCallback: FrameRequestCallback | null
  let requestAnimationFrameSpy: ReturnType<typeof vi.fn>
  let cancelAnimationFrameSpy: ReturnType<typeof vi.fn>
  let deviceChangeHandler: (() => void) | null

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()

    context = new MockAudioContext()
    stream = new MockMediaStream()
    removeDeviceChangeListener = vi.fn()
    animationFrameCallback = null
    deviceChangeHandler = null

    enumerateAudioDevices.mockResolvedValue([
      { id: 'input-1', label: 'Interface', kind: 'audioinput' }
    ])
    getInputStream.mockResolvedValue(stream)
    onDeviceChange.mockImplementation((callback: () => void) => {
      deviceChangeHandler = callback
      return removeDeviceChangeListener
    })

    installAudioGlobals(() => context)

    requestAnimationFrameSpy = vi.fn((callback: FrameRequestCallback) => {
      animationFrameCallback = callback
      return 1
    })
    cancelAnimationFrameSpy = vi.fn()
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrameSpy)
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameSpy)
  })

  it('initializes the audio graph, resumes suspended contexts, and enumerates devices', async () => {
    context.state = 'suspended'
    const engine = new AudioEngine()

    await engine.initialize()
    await engine.connectInput('input-1')

    expect(engine.getContext()).toBe(context)
    expect(engine.getPipeline()).not.toBeNull()
    expect(context.createdAnalysers).toHaveLength(1)
    expect(context.resume).toHaveBeenCalledTimes(1)
    expect(getInputStream).toHaveBeenCalledWith('input-1')
    expect(engine.isRunning).toBe(true)
    expect(await engine.enumerateDevices()).toEqual([
      { id: 'input-1', label: 'Interface', kind: 'audioinput' }
    ])
  })

  it('emits normalized levels, forwards device changes, and cancels monitoring on disconnect', async () => {
    const engine = new AudioEngine()
    const levelCallback = vi.fn()
    const deviceCallback = vi.fn()

    await engine.initialize()
    engine.onLevel(levelCallback)
    engine.onDeviceChange(deviceCallback)

    const analyser = context.createdAnalysers[0]
    analyser.floatData.fill(1)

    await engine.connectInput('input-1')
    animationFrameCallback?.(0)

    expect(levelCallback).toHaveBeenCalledWith(1)

    deviceChangeHandler?.()
    expect(deviceCallback).toHaveBeenCalledTimes(1)

    engine.disconnectInput()

    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(1)
    expect(stream.tracks[0].stop).toHaveBeenCalledTimes(1)
    expect(engine.isRunning).toBe(false)
  })

  it('throws when connecting before initialization', async () => {
    const engine = new AudioEngine()

    await expect(engine.connectInput('input-1')).rejects.toThrow('Engine not initialized')
  })

  it('disposes the engine and closes the audio context', async () => {
    const engine = new AudioEngine()

    await engine.initialize()
    await engine.connectInput('input-1')
    await engine.dispose()
    await flushPromises()

    expect(removeDeviceChangeListener).toHaveBeenCalledTimes(1)
    expect(context.close).toHaveBeenCalledTimes(1)
    expect(engine.getContext()).toBeNull()
    expect(engine.getPipeline()).toBeNull()
  })

  it('switches the output device when the context supports setSinkId', async () => {
    const engine = new AudioEngine()

    await engine.initialize()
    await engine.setOutputDevice('speakers-1')

    expect(context.setSinkId).toHaveBeenCalledWith('speakers-1')
  })

  afterEach(() => {
    uninstallAudioGlobals()
  })
})
