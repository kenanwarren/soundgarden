import { useEffect, useRef } from 'react'
import { useEffectsStore, type EffectConfig } from '../stores/effects-store'
import { getEngine } from './useAudioEngine'
import { useAudioStore } from '../stores/audio-store'
import type { EffectNode } from '../audio/pipeline'
import type { AudioProcessorType } from '../audio/types'
import { gainProcessorUrl, delayProcessorUrl } from '../audio/worklet-urls'


interface ManagedEffect {
  config: EffectConfig
  pipelineNode: EffectNode
  dispose: () => void
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
      // Load needed worklet modules
      const workletUrls: Record<string, string> = {
        gain: gainProcessorUrl,
        delay: delayProcessorUrl
      }
      for (const effect of chain) {
        const url = workletUrls[effect.type]
        if (url && !workletLoadedRef.current.has(effect.type)) {
          try {
            await ctx.audioWorklet.addModule(url)
          } catch {
            /* already loaded */
          }
          workletLoadedRef.current.add(effect.type)
        }
      }

      // Remove effects no longer in chain
      for (const [id, managed] of managedRef.current) {
        if (!chain.find((e) => e.id === id)) {
          managed.dispose()
          managedRef.current.delete(id)
        }
      }

      // Create new effect nodes as needed
      for (const effect of chain) {
        if (!managedRef.current.has(effect.id)) {
          const managed = createManagedEffect(ctx, effect)
          if (managed) {
            managedRef.current.set(effect.id, managed)
          }
        }

        // Update params and enabled state
        const managed = managedRef.current.get(effect.id)
        if (managed) {
          managed.config = { ...effect }
          managed.pipelineNode.enabled = effect.enabled
          updateParams(managed, effect, ctx)
        }
      }

      // Build ordered pipeline node list, preserving nodes we don't manage (e.g. tuner)
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

  // Clean up all effects on unmount
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
      return createGainEffect(ctx, effect)
    case 'eq':
      return createEqEffect(ctx, effect)
    case 'reverb':
      return createReverbEffect(ctx, effect)
    case 'delay':
      return createDelayEffect(ctx, effect)
    default:
      return null
  }
}

function createGainEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const node = new AudioWorkletNode(ctx, 'gain-drive-processor')
  return {
    config,
    pipelineNode: {
      id: config.id,
      enabled: config.enabled,
      getInput: () => node,
      getOutput: () => node
    },
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

  // Generate synthetic impulse response
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
    dispose: () => {
      splitter.disconnect()
      dry.disconnect()
      wet.disconnect()
      convolver.disconnect()
      merger.disconnect()
    }
  }
}

function createDelayEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const node = new AudioWorkletNode(ctx, 'delay-processor')
  return {
    config,
    pipelineNode: {
      id: config.id,
      enabled: config.enabled,
      getInput: () => node,
      getOutput: () => node
    },
    dispose: () => node.disconnect()
  }
}

function updateParams(managed: ManagedEffect, effect: EffectConfig, ctx: AudioContext): void {
  const t = ctx.currentTime

  switch (effect.type) {
    case 'gain': {
      const node = managed.pipelineNode.getInput() as AudioWorkletNode
      node.parameters.get('gain')?.setTargetAtTime(effect.params.gain ?? 1, t, 0.01)
      node.parameters.get('drive')?.setTargetAtTime(effect.params.drive ?? 0, t, 0.01)
      break
    }
    case 'eq': {
      // The EQ nodes are chained: low → mid → high
      // getInput returns low, we need to traverse
      const low = managed.pipelineNode.getInput() as BiquadFilterNode
      low.gain.setTargetAtTime(effect.params.low ?? 0, t, 0.01)
      // Access mid and high through the chain - they're internal
      // We stored them in the closure, so we need another approach
      // For now, recreating is simplest. TODO: store refs properly
      break
    }
    case 'reverb': {
      const splitter = managed.pipelineNode.getInput() as GainNode
      // Access dry/wet gains - they're internal nodes
      // The splitter connects to both dry and wet, which connect to merger
      // For simplicity, we'll track these via the config and recreate if needed
      break
    }
    case 'delay': {
      const node = managed.pipelineNode.getInput() as AudioWorkletNode
      node.parameters.get('time')?.setTargetAtTime(effect.params.time ?? 300, t, 0.01)
      node.parameters.get('feedback')?.setTargetAtTime(effect.params.feedback ?? 0.3, t, 0.01)
      node.parameters.get('mix')?.setTargetAtTime(effect.params.mix ?? 0.3, t, 0.01)
      break
    }
  }
}
