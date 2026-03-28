// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useEffectsStore } from '../../src/renderer/stores/effects-store'
import { useAudioStore } from '../../src/renderer/stores/audio-store'
import { useEffectsChain } from '../../src/renderer/hooks/useEffectsChain'
import {
  MockAudioContext,
  MockPipeline,
  flushPromises,
  installAudioGlobals,
  uninstallAudioGlobals
} from './audio-test-utils'

const getEngine = vi.fn()

vi.mock('../../src/renderer/hooks/useAudioEngine', () => ({
  getEngine: (...args: unknown[]) => getEngine(...args)
}))
vi.mock('../../src/renderer/audio/worklet-urls', () => ({
  gainProcessorUrl: 'gain-url',
  delayProcessorUrl: 'delay-url',
  chorusProcessorUrl: 'chorus-url',
  compressorProcessorUrl: 'compressor-url',
  noisegateProcessorUrl: 'noisegate-url',
  namProcessorUrl: 'nam-url',
  namWasmUrl: 'nam-wasm-url',
  tremoloProcessorUrl: 'tremolo-url',
  phaserProcessorUrl: 'phaser-url',
  flangerProcessorUrl: 'flanger-url',
  distortionProcessorUrl: 'distortion-url',
  wahProcessorUrl: 'wah-url',
  pitchshiftProcessorUrl: 'pitchshift-url',
  cleanboostProcessorUrl: 'cleanboost-url',
  autoswellProcessorUrl: 'autoswell-url',
  limiterProcessorUrl: 'limiter-url',
  ringmodProcessorUrl: 'ringmod-url',
  bitcrusherProcessorUrl: 'bitcrusher-url',
  octaverProcessorUrl: 'octaver-url',
  rotaryProcessorUrl: 'rotary-url',
  shimmerProcessorUrl: 'shimmer-url',
  harmonizerProcessorUrl: 'harmonizer-url',
  looperProcessorUrl: 'looper-url'
}))

describe('useEffectsChain', () => {
  let context: MockAudioContext
  let pipeline: MockPipeline

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useRealTimers()

    context = new MockAudioContext()
    pipeline = new MockPipeline()
    getEngine.mockReturnValue({
      getContext: () => context,
      getPipeline: () => pipeline
    })
    useEffectsStore.setState({ chain: [], nextId: 1 })
    useAudioStore.setState({
      isConnected: true,
      inputDevices: [],
      outputDevices: [],
      inputLevel: 0,
      devicesLoading: false,
      permissionState: 'unknown',
      lastRecoverableError: null
    })

    installAudioGlobals(() => context)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        arrayBuffer: async () => new ArrayBuffer(16)
      })
    )
  })

  afterEach(() => {
    cleanup()
    uninstallAudioGlobals()
  })

  it('loads each worklet module once per effect type and keeps parameter updates isolated', async () => {
    const { result } = renderHook(() => useEffectsChain())

    act(() => {
      result.current.addEffect('gain')
      result.current.addEffect('gain')
    })

    await waitFor(() => expect(context.audioWorklet.addModule).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(context.createdWorklets).toHaveLength(2))

    expect(context.audioWorklet.addModule).toHaveBeenCalledWith('gain-url')
    expect(pipeline.effectNodes).toHaveLength(2)

    act(() => {
      result.current.setParam('gain-1', 'gain', 1.75)
    })

    await waitFor(() =>
      expect(context.createdWorklets[0].getParam('gain').value).toBe(1.75)
    )

    expect(context.createdWorklets[1].getParam('gain').value).toBe(1)
  })

  it('disposes managed nodes when effects are removed from the chain', async () => {
    const { result } = renderHook(() => useEffectsChain())

    act(() => {
      result.current.addEffect('chorus')
    })

    await waitFor(() => expect(context.createdWorklets).toHaveLength(1))

    const chorusNode = context.createdWorklets[0]

    act(() => {
      result.current.removeEffect('chorus-1')
    })

    await waitFor(() => expect(chorusNode.disconnectCalls).toBe(1))
    expect(pipeline.effectNodes).toEqual([])
  })

  it('handles nam and cabinet failure paths and forwards looper commands', async () => {
    context.decodeAudioData.mockRejectedValue(new Error('decode failed'))

    const { result } = renderHook(() => useEffectsChain())

    act(() => {
      result.current.addEffect('nam')
      result.current.addEffect('cabinet')
      result.current.addEffect('looper')
    })

    await waitFor(() => expect(pipeline.effectNodes).toHaveLength(3))
    await flushPromises()

    const namNode = context.createdWorklets.find((node) => node.processorName === 'nam-processor')
    const looperNode = context.createdWorklets.find(
      (node) => node.processorName === 'looper-processor'
    )

    expect(namNode?.port.postMessage).toHaveBeenCalledWith({
      type: 'initWasm',
      wasmBytes: expect.any(ArrayBuffer)
    })

    vi.useFakeTimers()
    const namPromise = result.current.loadNamModel('nam-1', { model: 'blob' })
    await act(async () => {
      vi.advanceTimersByTime(10_000)
      await Promise.resolve()
    })

    await expect(namPromise).resolves.toEqual({
      success: false,
      error: 'Timeout loading model'
    })

    await expect(result.current.loadCabinetIR('cabinet-2', new ArrayBuffer(8))).resolves.toEqual({
      success: false,
      error: 'Error: decode failed'
    })

    result.current.sendLooperCommand('looper-3', 'toggleRecord')

    expect(looperNode?.port.postMessage).toHaveBeenCalledWith({ type: 'toggleRecord' })
  })
})
