import type { EffectConfig } from '../../stores/effects-store'
import type { ManagedEffect } from './types'
import { createWorkletEffect, updateWorkletParams } from './worklet-effect'
import { createEqEffect, updateEqParams } from './eq-effect'
import { createGraphicEqEffect, updateGraphicEqParams } from './eq-effect'
import { createParametricEqEffect, updateParametricEqParams } from './eq-effect'
import {
  createReverbEffect,
  updateReverbParams,
  createCabinetEffect,
  updateCabinetParams
} from './reverb-effect'

const WORKLET_TYPES = new Set([
  'gain',
  'delay',
  'chorus',
  'compressor',
  'noisegate',
  'nam',
  'tremolo',
  'phaser',
  'flanger',
  'distortion',
  'wah',
  'pitchshift',
  'cleanboost',
  'autoswell',
  'limiter',
  'ringmod',
  'bitcrusher',
  'octaver',
  'rotary',
  'shimmer',
  'harmonizer',
  'looper'
])

export function createManagedEffect(
  ctx: AudioContext,
  config: EffectConfig
): ManagedEffect | null {
  if (WORKLET_TYPES.has(config.type)) return createWorkletEffect(ctx, config)
  switch (config.type) {
    case 'eq':
      return createEqEffect(ctx, config)
    case 'reverb':
      return createReverbEffect(ctx, config)
    case 'cabinet':
      return createCabinetEffect(ctx, config)
    case 'graphiceq':
      return createGraphicEqEffect(ctx, config)
    case 'parameq':
      return createParametricEqEffect(ctx, config)
    default:
      return null
  }
}

export function updateEffectParams(
  managed: ManagedEffect,
  config: EffectConfig,
  ctx: AudioContext
): void {
  const t = ctx.currentTime

  if (WORKLET_TYPES.has(config.type)) {
    updateWorkletParams(managed, config, t)
    return
  }

  switch (config.type) {
    case 'eq':
      updateEqParams(managed, config, t)
      break
    case 'reverb':
      updateReverbParams(managed, config, t)
      break
    case 'cabinet':
      updateCabinetParams(managed, config, t)
      break
    case 'graphiceq':
      updateGraphicEqParams(managed, config, t)
      break
    case 'parameq':
      updateParametricEqParams(managed, config, t)
      break
  }
}
