import { describe, expect, it } from 'vitest'
import type { AudioProcessorType } from '../../src/renderer/audio/types'
import {
  EFFECT_DEFINITION_LIST,
  getEffectPickerSections,
  type EffectControlDefinition
} from '../../src/renderer/effects/definitions'

const effectTypes: AudioProcessorType[] = [
  'gain',
  'eq',
  'reverb',
  'delay',
  'chorus',
  'compressor',
  'noisegate',
  'nam',
  'tuner',
  'tremolo',
  'phaser',
  'flanger',
  'distortion',
  'wah',
  'pitchshift',
  'cabinet',
  'cleanboost',
  'autoswell',
  'limiter',
  'ringmod',
  'bitcrusher',
  'octaver',
  'rotary',
  'graphiceq',
  'parameq',
  'shimmer',
  'harmonizer',
  'looper'
]

function collectKnobParams(
  controls: EffectControlDefinition[]
): Array<{ param: string; defaultValue: number }> {
  return controls.flatMap((control) => {
    if (control.kind === 'group') return collectKnobParams(control.controls)
    if (control.kind === 'knob') {
      return [{ param: control.param, defaultValue: control.defaultValue }]
    }

    return []
  })
}

describe('effect definitions', () => {
  it('covers every processor type and exposes picker entries for visible effects', () => {
    expect(new Set(EFFECT_DEFINITION_LIST.map((definition) => definition.type))).toEqual(
      new Set(effectTypes)
    )

    const pickerEffectTypes = new Set(
      getEffectPickerSections('')
        .flatMap((section) => section.effects)
        .map((effect) => effect.type)
    )

    for (const definition of EFFECT_DEFINITION_LIST) {
      if (definition.hiddenFromPicker) {
        expect(pickerEffectTypes.has(definition.type)).toBe(false)
      } else {
        expect(pickerEffectTypes.has(definition.type)).toBe(true)
      }
    }
  })

  it('keeps defaults, controls, and runtime metadata aligned', () => {
    for (const definition of EFFECT_DEFINITION_LIST) {
      expect(definition.label.length).toBeGreaterThan(0)
      expect(definition.category.length).toBeGreaterThan(0)
      expect(definition.borderClass.length).toBeGreaterThan(0)
      expect(definition.tileClass.length).toBeGreaterThan(0)

      const knobParams = collectKnobParams(definition.controls)
      for (const knob of knobParams) {
        expect(definition.defaultParams).toHaveProperty(knob.param)
        expect(definition.defaultParams[knob.param]).toBe(knob.defaultValue)
      }

      if (definition.runtime === 'worklet') {
        expect(definition.workletUrl).toBeTruthy()
        expect(definition.workletName).toBeTruthy()
      }
    }
  })
})
