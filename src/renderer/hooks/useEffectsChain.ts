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
  noisegateProcessorUrl
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
  noisegate: noisegateProcessorUrl
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
          } catch {
            /* already loaded */
          }
          workletLoadedRef.current.add(effect.type)
        }
      }

      for (const [id, managed] of managedRef.current) {
        if (!chain.find((e) => e.id === id)) {
          managed.dispose()
          managedRef.current.delete(id)
        }
      }

      for (const effect of chain) {
        if (!managedRef.current.has(effect.id)) {
          const managed = createManagedEffect(ctx, effect)
          if (managed) {
            managedRef.current.set(effect.id, managed)
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
        (n) => !managedRef.current.has(n.id)
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

  return {
    chain,
    addEffect: useEffectsStore.getState().addEffect,
    removeEffect: useEffectsStore.getState().removeEffect,
    toggleEffect: useEffectsStore.getState().toggleEffect,
    setParam: useEffectsStore.getState().setParam,
    reorderEffects: useEffectsStore.getState().reorderEffects
  }
}

function createManagedEffect(ctx: AudioContext, effect: EffectConfig): ManagedEffect | null {
  switch (effect.type) {
    case 'gain':
    case 'delay':
    case 'chorus':
    case 'compressor':
    case 'noisegate':
      return createWorkletEffect(ctx, effect)
    case 'eq':
      return createEqEffect(ctx, effect)
    case 'reverb':
      return createReverbEffect(ctx, effect)
    default:
      return null
  }
}

const WORKLET_NAMES: Record<string, string> = {
  gain: 'gain-drive-processor',
  delay: 'delay-processor',
  chorus: 'chorus-processor',
  compressor: 'compressor-processor',
  noisegate: 'noisegate-processor'
}

function createWorkletEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const node = new AudioWorkletNode(ctx, WORKLET_NAMES[config.type])
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
    case 'noisegate': {
      const node = managed.internals.node as AudioWorkletNode
      for (const [param, value] of Object.entries(effect.params)) {
        node.parameters.get(param)?.setTargetAtTime(value, t, 0.01)
      }
      break
    }
  }
}
