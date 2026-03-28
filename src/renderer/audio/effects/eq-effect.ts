import type { EffectConfig } from '../../stores/effects-store'
import type { ManagedEffect } from './types'

export function createEqEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
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

export function updateEqParams(managed: ManagedEffect, config: EffectConfig, t: number): void {
  const low = managed.internals.low as BiquadFilterNode
  const mid = managed.internals.mid as BiquadFilterNode
  const high = managed.internals.high as BiquadFilterNode
  low.gain.setTargetAtTime(config.params.low ?? 0, t, 0.01)
  mid.gain.setTargetAtTime(config.params.mid ?? 0, t, 0.01)
  high.gain.setTargetAtTime(config.params.high ?? 0, t, 0.01)
}

export function createGraphicEqEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
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
    internals: {
      band60: nodes[0],
      band250: nodes[1],
      band1k: nodes[2],
      band4k: nodes[3],
      band8k: nodes[4],
      band12k: nodes[5]
    },
    dispose: () => nodes.forEach((n) => n.disconnect())
  }
}

export function updateGraphicEqParams(
  managed: ManagedEffect,
  config: EffectConfig,
  t: number
): void {
  const bandKeys = ['band60', 'band250', 'band1k', 'band4k', 'band8k', 'band12k'] as const
  for (const key of bandKeys) {
    const node = managed.internals[key] as BiquadFilterNode
    node.gain.setTargetAtTime(config.params[key] ?? 0, t, 0.01)
  }
}

export function createParametricEqEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
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

export function updateParametricEqParams(
  managed: ManagedEffect,
  config: EffectConfig,
  t: number
): void {
  for (let i = 1; i <= 4; i++) {
    const node = managed.internals[`band${i}`] as BiquadFilterNode
    node.frequency.setTargetAtTime(config.params[`freq${i}`] ?? 1000, t, 0.01)
    node.gain.setTargetAtTime(config.params[`gain${i}`] ?? 0, t, 0.01)
    node.Q.setTargetAtTime(config.params[`q${i}`] ?? 1, t, 0.01)
  }
}
