import type { EffectConfig } from '../../stores/effects-store'
import type { ManagedEffect } from './types'

// Seeded PRNG so reverb IR is deterministic across creates
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return (s >>> 0) / 0xffffffff
  }
}

let cachedImpulse: AudioBuffer | null = null
let cachedSampleRate: number = 0

function getReverbImpulse(ctx: AudioContext): AudioBuffer {
  if (cachedImpulse && cachedSampleRate === ctx.sampleRate) return cachedImpulse

  const impulseLength = Math.floor(ctx.sampleRate * 1.5)
  const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate)
  const rand = seededRandom(42)

  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < impulseLength; i++) {
      data[i] = (rand() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4))
    }
  }

  cachedImpulse = impulse
  cachedSampleRate = ctx.sampleRate
  return impulse
}

export function createReverbEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const splitter = ctx.createGain()
  const dry = ctx.createGain()
  const wet = ctx.createGain()
  const convolver = ctx.createConvolver()
  const merger = ctx.createGain()

  convolver.buffer = getReverbImpulse(ctx)

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

export function updateReverbParams(managed: ManagedEffect, config: EffectConfig, t: number): void {
  const dry = managed.internals.dry as GainNode
  const wet = managed.internals.wet as GainNode
  const mix = config.params.mix ?? 0.3
  dry.gain.setTargetAtTime(1 - mix, t, 0.01)
  wet.gain.setTargetAtTime(mix, t, 0.01)
}

export function createCabinetEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const splitter = ctx.createGain()
  const dry = ctx.createGain()
  const wet = ctx.createGain()
  const convolver = ctx.createConvolver()
  const merger = ctx.createGain()

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

export function updateCabinetParams(managed: ManagedEffect, config: EffectConfig, t: number): void {
  const dry = managed.internals.dry as GainNode
  const wet = managed.internals.wet as GainNode
  const mix = config.params.mix ?? 0.8
  dry.gain.setTargetAtTime(1 - mix, t, 0.01)
  wet.gain.setTargetAtTime(mix, t, 0.01)
}
