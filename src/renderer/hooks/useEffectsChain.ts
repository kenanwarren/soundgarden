import { useEffect, useRef } from 'react'
import { useEffectsStore, type EffectConfig } from '../stores/effects-store'
import { getEngine } from './useAudioEngine'
import { useAudioStore } from '../stores/audio-store'
import type { EffectNode } from '../audio/pipeline'
import {
  gainProcessorUrl,
  delayProcessorUrl,
  chorusProcessorUrl,
  compressorProcessorUrl,
  noisegateProcessorUrl,
  namProcessorUrl,
  namWasmUrl,
  tremoloProcessorUrl,
  phaserProcessorUrl,
  flangerProcessorUrl,
  distortionProcessorUrl,
  wahProcessorUrl,
  pitchshiftProcessorUrl,
  cleanboostProcessorUrl,
  autoswellProcessorUrl,
  limiterProcessorUrl,
  ringmodProcessorUrl,
  bitcrusherProcessorUrl,
  octaverProcessorUrl,
  rotaryProcessorUrl,
  shimmerProcessorUrl,
  harmonizerProcessorUrl,
  looperProcessorUrl
} from '../audio/worklet-urls'

interface ManagedEffect {
  config: EffectConfig
  pipelineNode: EffectNode
  internals: Record<string, AudioNode>
  dispose: () => void
}

const WORKLET_URLS: Record<string, string> = {
  gain: gainProcessorUrl,
  delay: delayProcessorUrl,
  chorus: chorusProcessorUrl,
  compressor: compressorProcessorUrl,
  noisegate: noisegateProcessorUrl,
  nam: namProcessorUrl,
  tremolo: tremoloProcessorUrl,
  phaser: phaserProcessorUrl,
  flanger: flangerProcessorUrl,
  distortion: distortionProcessorUrl,
  wah: wahProcessorUrl,
  pitchshift: pitchshiftProcessorUrl,
  cleanboost: cleanboostProcessorUrl,
  autoswell: autoswellProcessorUrl,
  limiter: limiterProcessorUrl,
  ringmod: ringmodProcessorUrl,
  bitcrusher: bitcrusherProcessorUrl,
  octaver: octaverProcessorUrl,
  rotary: rotaryProcessorUrl,
  shimmer: shimmerProcessorUrl,
  harmonizer: harmonizerProcessorUrl,
  looper: looperProcessorUrl
}

export function useEffectsChain() {
  const chain = useEffectsStore((s) => s.chain)
  const isConnected = useAudioStore((s) => s.isConnected)
  const managedRef = useRef<Map<string, ManagedEffect>>(new Map())
  const workletLoadedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isConnected) return

    const engine = getEngine()
    if (!engine) return

    const ctx = engine.getContext()
    const pipeline = engine.getPipeline()
    if (!ctx || !pipeline) return

    const sync = async () => {
      for (const effect of chain) {
        const url = WORKLET_URLS[effect.type]
        if (url && !workletLoadedRef.current.has(effect.type)) {
          try {
            await ctx.audioWorklet.addModule(url)
            workletLoadedRef.current.add(effect.type)
          } catch (err) {
            console.error(`Failed to load worklet for ${effect.type}:`, err)
          }
        }
      }

      const disposedIds = new Set<string>()
      for (const [id, managed] of managedRef.current) {
        if (!chain.find((e) => e.id === id)) {
          managed.dispose()
          managedRef.current.delete(id)
          disposedIds.add(id)
        }
      }

      for (const effect of chain) {
        if (!managedRef.current.has(effect.id)) {
          try {
            const managed = createManagedEffect(ctx, effect)
            if (managed) {
              managedRef.current.set(effect.id, managed)
            }
          } catch (err) {
            console.error(`Failed to create effect ${effect.type}:`, err)
          }
        }

        const managed = managedRef.current.get(effect.id)
        if (managed) {
          managed.config = { ...effect }
          managed.pipelineNode.enabled = effect.enabled
          updateParams(managed, effect, ctx)
        }
      }

      const existingNodes = pipeline.getEffectNodes()
      const unmanagedNodes = existingNodes.filter(
        (n) => !managedRef.current.has(n.id) && !disposedIds.has(n.id)
      )

      const pipelineNodes: EffectNode[] = [...unmanagedNodes]
      for (const effect of chain) {
        const managed = managedRef.current.get(effect.id)
        if (managed) {
          pipelineNodes.push(managed.pipelineNode)
        }
      }

      pipeline.setEffectNodes(pipelineNodes)
    }

    sync()
  }, [chain, isConnected])

  useEffect(() => {
    return () => {
      for (const managed of managedRef.current.values()) {
        managed.dispose()
      }
      managedRef.current.clear()
    }
  }, [])

  const loadNamModel = (effectId: string, modelData: Record<string, unknown>): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const managed = managedRef.current.get(effectId)
      if (!managed || managed.config.type !== 'nam') {
        resolve({ success: false, error: 'Effect not found' })
        return
      }
      const node = managed.internals.node as AudioWorkletNode

      const timeout = setTimeout(() => {
        node.port.removeEventListener('message', handleMessage)
        resolve({ success: false, error: 'Timeout loading model' })
      }, 10000)

      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'modelLoaded' || e.data.type === 'modelError') {
          clearTimeout(timeout)
          node.port.removeEventListener('message', handleMessage)
          resolve({ success: e.data.success ?? false, error: e.data.error })
        }
      }

      node.port.addEventListener('message', handleMessage)
      node.port.postMessage({ type: 'loadModel', modelData })
    })
  }

  const loadCabinetIR = async (effectId: string, audioData: ArrayBuffer): Promise<{ success: boolean; error?: string }> => {
    const managed = managedRef.current.get(effectId)
    if (!managed || managed.config.type !== 'cabinet') {
      return { success: false, error: 'Effect not found' }
    }
    const engine = getEngine()
    const ctx = engine?.getContext()
    if (!ctx) return { success: false, error: 'No audio context' }

    try {
      const buffer = await ctx.decodeAudioData(audioData)
      const convolver = managed.internals.convolver as ConvolverNode
      convolver.buffer = buffer
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  const sendLooperCommand = (effectId: string, command: string) => {
    const managed = managedRef.current.get(effectId)
    if (!managed || managed.config.type !== 'looper') return
    const node = managed.internals.node as AudioWorkletNode
    node.port.postMessage({ type: command })
  }

  return {
    chain,
    addEffect: useEffectsStore.getState().addEffect,
    removeEffect: useEffectsStore.getState().removeEffect,
    toggleEffect: useEffectsStore.getState().toggleEffect,
    setParam: useEffectsStore.getState().setParam,
    reorderEffects: useEffectsStore.getState().reorderEffects,
    loadNamModel,
    loadCabinetIR,
    sendLooperCommand
  }
}

function createManagedEffect(ctx: AudioContext, effect: EffectConfig): ManagedEffect | null {
  switch (effect.type) {
    case 'gain':
    case 'delay':
    case 'chorus':
    case 'compressor':
    case 'noisegate':
    case 'nam':
    case 'tremolo':
    case 'phaser':
    case 'flanger':
    case 'distortion':
    case 'wah':
    case 'pitchshift':
    case 'cleanboost':
    case 'autoswell':
    case 'limiter':
    case 'ringmod':
    case 'bitcrusher':
    case 'octaver':
    case 'rotary':
    case 'shimmer':
    case 'harmonizer':
    case 'looper':
      return createWorkletEffect(ctx, effect)
    case 'eq':
      return createEqEffect(ctx, effect)
    case 'reverb':
      return createReverbEffect(ctx, effect)
    case 'cabinet':
      return createCabinetEffect(ctx, effect)
    case 'graphiceq':
      return createGraphicEqEffect(ctx, effect)
    case 'parameq':
      return createParametricEqEffect(ctx, effect)
    default:
      return null
  }
}

const WORKLET_NAMES: Record<string, string> = {
  gain: 'gain-drive-processor',
  delay: 'delay-processor',
  chorus: 'chorus-processor',
  compressor: 'compressor-processor',
  noisegate: 'noisegate-processor',
  nam: 'nam-processor',
  tremolo: 'tremolo-processor',
  phaser: 'phaser-processor',
  flanger: 'flanger-processor',
  distortion: 'distortion-processor',
  wah: 'wah-processor',
  pitchshift: 'pitchshift-processor',
  cleanboost: 'cleanboost-processor',
  autoswell: 'autoswell-processor',
  limiter: 'limiter-processor',
  ringmod: 'ringmod-processor',
  bitcrusher: 'bitcrusher-processor',
  octaver: 'octaver-processor',
  rotary: 'rotary-processor',
  shimmer: 'shimmer-processor',
  harmonizer: 'harmonizer-processor',
  looper: 'looper-processor'
}

let namWasmBytesCache: ArrayBuffer | null = null

async function fetchNamWasmBytes(): Promise<ArrayBuffer | null> {
  if (namWasmBytesCache) return namWasmBytesCache
  try {
    const resp = await fetch(namWasmUrl)
    namWasmBytesCache = await resp.arrayBuffer()
    return namWasmBytesCache
  } catch (err) {
    console.warn('Failed to fetch NAM WASM module:', err)
    return null
  }
}

function createWorkletEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const node = new AudioWorkletNode(ctx, WORKLET_NAMES[config.type])
  if (config.type === 'nam') {
    node.port.addEventListener('message', (e: MessageEvent) => {
      if (e.data?.type === 'modelError') {
        console.error('NAM model runtime error:', e.data.error)
      }
    })
    node.port.start()
    fetchNamWasmBytes().then((bytes) => {
      if (bytes) node.port.postMessage({ type: 'initWasm', wasmBytes: bytes })
    })
  }
  if (config.type === 'looper') {
    node.port.start()
  }

  return {
    config,
    pipelineNode: {
      id: config.id,
      enabled: config.enabled,
      getInput: () => node,
      getOutput: () => node
    },
    internals: { node },
    dispose: () => node.disconnect()
  }
}

function createEqEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const low = ctx.createBiquadFilter()
  low.type = 'lowshelf'
  low.frequency.value = 200

  const mid = ctx.createBiquadFilter()
  mid.type = 'peaking'
  mid.frequency.value = 1000
  mid.Q.value = 1.0

  const high = ctx.createBiquadFilter()
  high.type = 'highshelf'
  high.frequency.value = 4000

  low.connect(mid)
  mid.connect(high)

  return {
    config,
    pipelineNode: {
      id: config.id,
      enabled: config.enabled,
      getInput: () => low,
      getOutput: () => high
    },
    internals: { low, mid, high },
    dispose: () => {
      low.disconnect()
      mid.disconnect()
      high.disconnect()
    }
  }
}

function createReverbEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const splitter = ctx.createGain()
  const dry = ctx.createGain()
  const wet = ctx.createGain()
  const convolver = ctx.createConvolver()
  const merger = ctx.createGain()

  const impulseLength = Math.floor(ctx.sampleRate * 1.5)
  const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < impulseLength; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4))
    }
  }
  convolver.buffer = impulse

  splitter.connect(dry)
  splitter.connect(convolver)
  convolver.connect(wet)
  dry.connect(merger)
  wet.connect(merger)

  const mix = config.params.mix ?? 0.3
  dry.gain.value = 1 - mix
  wet.gain.value = mix

  return {
    config,
    pipelineNode: {
      id: config.id,
      enabled: config.enabled,
      getInput: () => splitter,
      getOutput: () => merger
    },
    internals: { splitter, dry, wet, convolver, merger },
    dispose: () => {
      splitter.disconnect()
      dry.disconnect()
      wet.disconnect()
      convolver.disconnect()
      merger.disconnect()
    }
  }
}

function createCabinetEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const splitter = ctx.createGain()
  const dry = ctx.createGain()
  const wet = ctx.createGain()
  const convolver = ctx.createConvolver()
  const merger = ctx.createGain()

  // Default flat IR (passthrough) until a cab IR is loaded
  const irLength = 512
  const ir = ctx.createBuffer(2, irLength, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    ir.getChannelData(ch)[0] = 1
  }
  convolver.buffer = ir

  splitter.connect(dry)
  splitter.connect(convolver)
  convolver.connect(wet)
  dry.connect(merger)
  wet.connect(merger)

  const mix = config.params.mix ?? 0.8
  dry.gain.value = 1 - mix
  wet.gain.value = mix

  return {
    config,
    pipelineNode: {
      id: config.id,
      enabled: config.enabled,
      getInput: () => splitter,
      getOutput: () => merger
    },
    internals: { splitter, dry, wet, convolver, merger },
    dispose: () => {
      splitter.disconnect()
      dry.disconnect()
      wet.disconnect()
      convolver.disconnect()
      merger.disconnect()
    }
  }
}

function createGraphicEqEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const bands = [
    { freq: 60, type: 'lowshelf' as BiquadFilterType },
    { freq: 250, type: 'peaking' as BiquadFilterType },
    { freq: 1000, type: 'peaking' as BiquadFilterType },
    { freq: 4000, type: 'peaking' as BiquadFilterType },
    { freq: 8000, type: 'peaking' as BiquadFilterType },
    { freq: 12000, type: 'highshelf' as BiquadFilterType }
  ]
  const nodes = bands.map(({ freq, type }) => {
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    if (type === 'peaking') f.Q.value = 1.4
    return f
  })
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1])

  return {
    config,
    pipelineNode: {
      id: config.id,
      enabled: config.enabled,
      getInput: () => nodes[0],
      getOutput: () => nodes[nodes.length - 1]
    },
    internals: { band60: nodes[0], band250: nodes[1], band1k: nodes[2], band4k: nodes[3], band8k: nodes[4], band12k: nodes[5] },
    dispose: () => nodes.forEach((n) => n.disconnect())
  }
}

function createParametricEqEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const defaults = [
    { freq: 100, gain: 0, q: 1 },
    { freq: 500, gain: 0, q: 1 },
    { freq: 2000, gain: 0, q: 1 },
    { freq: 8000, gain: 0, q: 1 }
  ]
  const nodes = defaults.map(({ freq, gain, q }) => {
    const f = ctx.createBiquadFilter()
    f.type = 'peaking'
    f.frequency.value = freq
    f.gain.value = gain
    f.Q.value = q
    return f
  })
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1])

  return {
    config,
    pipelineNode: {
      id: config.id,
      enabled: config.enabled,
      getInput: () => nodes[0],
      getOutput: () => nodes[nodes.length - 1]
    },
    internals: { band1: nodes[0], band2: nodes[1], band3: nodes[2], band4: nodes[3] },
    dispose: () => nodes.forEach((n) => n.disconnect())
  }
}

function updateParams(managed: ManagedEffect, effect: EffectConfig, ctx: AudioContext): void {
  const t = ctx.currentTime

  switch (effect.type) {
    case 'gain': {
      const node = managed.internals.node as AudioWorkletNode
      node.parameters.get('gain')?.setTargetAtTime(effect.params.gain ?? 1, t, 0.01)
      node.parameters.get('drive')?.setTargetAtTime(effect.params.drive ?? 0, t, 0.01)
      break
    }
    case 'eq': {
      const low = managed.internals.low as BiquadFilterNode
      const mid = managed.internals.mid as BiquadFilterNode
      const high = managed.internals.high as BiquadFilterNode
      low.gain.setTargetAtTime(effect.params.low ?? 0, t, 0.01)
      mid.gain.setTargetAtTime(effect.params.mid ?? 0, t, 0.01)
      high.gain.setTargetAtTime(effect.params.high ?? 0, t, 0.01)
      break
    }
    case 'reverb': {
      const dry = managed.internals.dry as GainNode
      const wet = managed.internals.wet as GainNode
      const mix = effect.params.mix ?? 0.3
      dry.gain.setTargetAtTime(1 - mix, t, 0.01)
      wet.gain.setTargetAtTime(mix, t, 0.01)
      break
    }
    case 'delay':
    case 'chorus':
    case 'compressor':
    case 'noisegate':
    case 'tremolo':
    case 'phaser':
    case 'flanger':
    case 'distortion':
    case 'wah':
    case 'pitchshift':
    case 'cleanboost':
    case 'autoswell':
    case 'limiter':
    case 'ringmod':
    case 'bitcrusher':
    case 'octaver':
    case 'rotary':
    case 'shimmer':
    case 'harmonizer':
    case 'looper': {
      const node = managed.internals.node as AudioWorkletNode
      for (const [param, value] of Object.entries(effect.params)) {
        node.parameters.get(param)?.setTargetAtTime(value, t, 0.01)
      }
      break
    }
    case 'cabinet': {
      const dry = managed.internals.dry as GainNode
      const wet = managed.internals.wet as GainNode
      const mix = effect.params.mix ?? 0.8
      dry.gain.setTargetAtTime(1 - mix, t, 0.01)
      wet.gain.setTargetAtTime(mix, t, 0.01)
      break
    }
    case 'graphiceq': {
      const bandKeys = ['band60', 'band250', 'band1k', 'band4k', 'band8k', 'band12k'] as const
      for (const key of bandKeys) {
        const node = managed.internals[key] as BiquadFilterNode
        node.gain.setTargetAtTime(effect.params[key] ?? 0, t, 0.01)
      }
      break
    }
    case 'parameq': {
      for (let i = 1; i <= 4; i++) {
        const node = managed.internals[`band${i}`] as BiquadFilterNode
        node.frequency.setTargetAtTime(effect.params[`freq${i}`] ?? 1000, t, 0.01)
        node.gain.setTargetAtTime(effect.params[`gain${i}`] ?? 0, t, 0.01)
        node.Q.setTargetAtTime(effect.params[`q${i}`] ?? 1, t, 0.01)
      }
      break
    }
    case 'nam': {
      const node = managed.internals.node as AudioWorkletNode
      for (const [name, value] of Object.entries(effect.params)) {
        node.port.postMessage({ type: 'setParam', name, value })
      }
      break
    }
  }
}
