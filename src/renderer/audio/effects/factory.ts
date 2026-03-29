import type { EffectConfig } from '../../stores/effects-store'
import { getEffectDefinition } from '../../effects/definitions'
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

export function createManagedEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect | null {
  const definition = getEffectDefinition(config.type)

  switch (definition.runtime) {
    case 'worklet':
      return createWorkletEffect(ctx, config)
    case 'eq':
      return createEqEffect(ctx, config)
    case 'reverb':
      return createReverbEffect(ctx, config)
    case 'cabinet':
      return createCabinetEffect(ctx, config)
    case 'graphic-eq':
      return createGraphicEqEffect(ctx, config)
    case 'parametric-eq':
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
  const definition = getEffectDefinition(config.type)

  switch (definition.runtime) {
    case 'worklet':
      updateWorkletParams(managed, config, t)
      break
    case 'eq':
      updateEqParams(managed, config, t)
      break
    case 'reverb':
      updateReverbParams(managed, config, t)
      break
    case 'cabinet':
      updateCabinetParams(managed, config, t)
      break
    case 'graphic-eq':
      updateGraphicEqParams(managed, config, t)
      break
    case 'parametric-eq':
      updateParametricEqParams(managed, config, t)
      break
  }
}
