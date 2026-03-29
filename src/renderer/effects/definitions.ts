import type { AudioProcessorType } from '../audio/types'
import { WORKLET_URLS, WORKLET_NAMES, tunerProcessorUrl } from '../audio/worklet-urls'

export type EffectRuntimeKind =
  | 'worklet'
  | 'eq'
  | 'reverb'
  | 'cabinet'
  | 'graphic-eq'
  | 'parametric-eq'

export interface EffectKnobControlDefinition {
  kind: 'knob'
  param: string
  label: string
  min: number
  max: number
  step: number
  unit?: string
  defaultValue: number
}

export interface EffectControlGroupDefinition {
  kind: 'group'
  className?: string
  controls: EffectControlDefinition[]
}

export interface EffectCabinetControlDefinition {
  kind: 'cabinet-loader'
}

export interface EffectNamControlDefinition {
  kind: 'nam-loader'
}

export interface EffectLooperControlDefinition {
  kind: 'looper-controls'
}

export type EffectControlDefinition =
  | EffectKnobControlDefinition
  | EffectControlGroupDefinition
  | EffectCabinetControlDefinition
  | EffectNamControlDefinition
  | EffectLooperControlDefinition

export interface EffectDefinition {
  type: AudioProcessorType
  label: string
  category: string
  borderClass: string
  tileClass: string
  runtime: EffectRuntimeKind
  controls: EffectControlDefinition[]
  defaultParams: Record<string, number>
  workletUrl?: string
  workletName?: string
  hiddenFromPicker?: boolean
}

function knob(
  param: string,
  label: string,
  min: number,
  max: number,
  step: number,
  defaultValue: number,
  unit?: string
): EffectKnobControlDefinition {
  return { kind: 'knob', param, label, min, max, step, unit, defaultValue }
}

function group(
  controls: EffectControlDefinition[],
  className?: string
): EffectControlGroupDefinition {
  return { kind: 'group', controls, className }
}

export const EFFECT_DEFINITIONS: Record<AudioProcessorType, EffectDefinition> = {
  tuner: {
    type: 'tuner',
    label: 'Tuner',
    category: 'Analysis',
    borderClass: 'border-emerald-500',
    tileClass: 'border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/25',
    runtime: 'worklet',
    controls: [],
    defaultParams: {},
    workletUrl: tunerProcessorUrl,
    workletName: 'tuner-processor',
    hiddenFromPicker: true
  },
  gain: {
    type: 'gain',
    label: 'Gain / Drive',
    category: 'Drive',
    borderClass: 'border-orange-600',
    tileClass: 'border-orange-600 bg-orange-600/10 hover:bg-orange-600/25',
    runtime: 'worklet',
    controls: [group([knob('gain', 'Gain', 0, 4, 0.1, 1), knob('drive', 'Drive', 0, 1, 0.01, 0)])],
    defaultParams: { gain: 1, drive: 0 },
    workletUrl: WORKLET_URLS.gain,
    workletName: WORKLET_NAMES.gain
  },
  eq: {
    type: 'eq',
    label: 'EQ',
    category: 'EQ',
    borderClass: 'border-blue-600',
    tileClass: 'border-blue-600 bg-blue-600/10 hover:bg-blue-600/25',
    runtime: 'eq',
    controls: [
      group([
        knob('low', 'Low', -12, 12, 0.5, 0, 'dB'),
        knob('mid', 'Mid', -12, 12, 0.5, 0, 'dB'),
        knob('high', 'High', -12, 12, 0.5, 0, 'dB')
      ])
    ],
    defaultParams: { low: 0, mid: 0, high: 0 }
  },
  reverb: {
    type: 'reverb',
    label: 'Reverb',
    category: 'Space',
    borderClass: 'border-purple-600',
    tileClass: 'border-purple-600 bg-purple-600/10 hover:bg-purple-600/25',
    runtime: 'reverb',
    controls: [knob('mix', 'Mix', 0, 1, 0.01, 0.3)],
    defaultParams: { mix: 0.3 }
  },
  delay: {
    type: 'delay',
    label: 'Delay',
    category: 'Space',
    borderClass: 'border-cyan-600',
    tileClass: 'border-cyan-600 bg-cyan-600/10 hover:bg-cyan-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('time', 'Time', 50, 2000, 10, 300, 'ms'),
        knob('feedback', 'Fdbk', 0, 0.95, 0.01, 0.3),
        knob('mix', 'Mix', 0, 1, 0.01, 0.3)
      ])
    ],
    defaultParams: { time: 300, feedback: 0.3, mix: 0.3 },
    workletUrl: WORKLET_URLS.delay,
    workletName: WORKLET_NAMES.delay
  },
  chorus: {
    type: 'chorus',
    label: 'Chorus',
    category: 'Modulation',
    borderClass: 'border-pink-600',
    tileClass: 'border-pink-600 bg-pink-600/10 hover:bg-pink-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('rate', 'Rate', 0.1, 10, 0.1, 1.5, 'Hz'),
        knob('depth', 'Depth', 0, 1, 0.01, 0.5),
        knob('mix', 'Mix', 0, 1, 0.01, 0.5)
      ])
    ],
    defaultParams: { rate: 1.5, depth: 0.5, mix: 0.5 },
    workletUrl: WORKLET_URLS.chorus,
    workletName: WORKLET_NAMES.chorus
  },
  compressor: {
    type: 'compressor',
    label: 'Compressor',
    category: 'Dynamics',
    borderClass: 'border-yellow-600',
    tileClass: 'border-yellow-600 bg-yellow-600/10 hover:bg-yellow-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('threshold', 'Thresh', -60, 0, 1, -20, 'dB'),
        knob('ratio', 'Ratio', 1, 20, 0.5, 4),
        knob('attack', 'Atk', 0.1, 100, 0.5, 10, 'ms'),
        knob('release', 'Rel', 10, 1000, 5, 100, 'ms'),
        knob('makeup', 'Makeup', 0, 30, 0.5, 0, 'dB')
      ])
    ],
    defaultParams: { threshold: -20, ratio: 4, attack: 10, release: 100, makeup: 0 },
    workletUrl: WORKLET_URLS.compressor,
    workletName: WORKLET_NAMES.compressor
  },
  noisegate: {
    type: 'noisegate',
    label: 'Noise Gate',
    category: 'Dynamics',
    borderClass: 'border-red-600',
    tileClass: 'border-red-600 bg-red-600/10 hover:bg-red-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('threshold', 'Thresh', -80, 0, 1, -40, 'dB'),
        knob('attack', 'Atk', 0.1, 50, 0.5, 1, 'ms'),
        knob('release', 'Rel', 10, 500, 5, 50, 'ms')
      ])
    ],
    defaultParams: { threshold: -40, attack: 1, release: 50 },
    workletUrl: WORKLET_URLS.noisegate,
    workletName: WORKLET_NAMES.noisegate
  },
  nam: {
    type: 'nam',
    label: 'NAM Capture',
    category: 'Utility',
    borderClass: 'border-amber-500',
    tileClass: 'border-amber-500 bg-amber-500/10 hover:bg-amber-500/25',
    runtime: 'worklet',
    controls: [{ kind: 'nam-loader' }],
    defaultParams: { inputGain: 1, outputGain: 1 },
    workletUrl: WORKLET_URLS.nam,
    workletName: WORKLET_NAMES.nam
  },
  tremolo: {
    type: 'tremolo',
    label: 'Tremolo',
    category: 'Modulation',
    borderClass: 'border-lime-600',
    tileClass: 'border-lime-600 bg-lime-600/10 hover:bg-lime-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('rate', 'Rate', 0.5, 20, 0.5, 4, 'Hz'),
        knob('depth', 'Depth', 0, 1, 0.01, 0.5),
        knob('wave', 'Wave', 0, 1, 1, 0)
      ])
    ],
    defaultParams: { rate: 4, depth: 0.5, wave: 0 },
    workletUrl: WORKLET_URLS.tremolo,
    workletName: WORKLET_NAMES.tremolo
  },
  phaser: {
    type: 'phaser',
    label: 'Phaser',
    category: 'Modulation',
    borderClass: 'border-violet-600',
    tileClass: 'border-violet-600 bg-violet-600/10 hover:bg-violet-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('rate', 'Rate', 0.05, 5, 0.05, 0.5, 'Hz'),
        knob('depth', 'Depth', 0, 1, 0.01, 0.7),
        knob('stages', 'Stgs', 2, 12, 2, 4),
        knob('feedback', 'Fdbk', -0.95, 0.95, 0.05, 0.5),
        knob('mix', 'Mix', 0, 1, 0.01, 0.5)
      ])
    ],
    defaultParams: { rate: 0.5, depth: 0.7, stages: 4, feedback: 0.5, mix: 0.5 },
    workletUrl: WORKLET_URLS.phaser,
    workletName: WORKLET_NAMES.phaser
  },
  flanger: {
    type: 'flanger',
    label: 'Flanger',
    category: 'Modulation',
    borderClass: 'border-fuchsia-600',
    tileClass: 'border-fuchsia-600 bg-fuchsia-600/10 hover:bg-fuchsia-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('rate', 'Rate', 0.05, 5, 0.05, 0.5, 'Hz'),
        knob('depth', 'Depth', 0, 1, 0.01, 0.7),
        knob('feedback', 'Fdbk', -0.95, 0.95, 0.05, 0.5),
        knob('mix', 'Mix', 0, 1, 0.01, 0.5)
      ])
    ],
    defaultParams: { rate: 0.5, depth: 0.7, feedback: 0.5, mix: 0.5 },
    workletUrl: WORKLET_URLS.flanger,
    workletName: WORKLET_NAMES.flanger
  },
  distortion: {
    type: 'distortion',
    label: 'Distortion',
    category: 'Drive',
    borderClass: 'border-rose-600',
    tileClass: 'border-rose-600 bg-rose-600/10 hover:bg-rose-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('gain', 'Gain', 0.5, 10, 0.1, 3),
        knob('tone', 'Tone', 0, 1, 0.01, 0.5),
        knob('mode', 'Mode', 0, 2, 1, 0),
        knob('mix', 'Mix', 0, 1, 0.01, 1)
      ])
    ],
    defaultParams: { gain: 3, tone: 0.5, mode: 0, mix: 1 },
    workletUrl: WORKLET_URLS.distortion,
    workletName: WORKLET_NAMES.distortion
  },
  wah: {
    type: 'wah',
    label: 'Wah',
    category: 'Modulation',
    borderClass: 'border-teal-600',
    tileClass: 'border-teal-600 bg-teal-600/10 hover:bg-teal-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('sensitivity', 'Sens', 0, 1, 0.01, 0.5),
        knob('frequency', 'Freq', 500, 2500, 10, 1500, 'Hz'),
        knob('q', 'Q', 1, 15, 0.5, 5),
        knob('mode', 'Mode', 0, 1, 1, 0)
      ])
    ],
    defaultParams: { sensitivity: 0.5, frequency: 1500, q: 5, mode: 0 },
    workletUrl: WORKLET_URLS.wah,
    workletName: WORKLET_NAMES.wah
  },
  pitchshift: {
    type: 'pitchshift',
    label: 'Pitch Shifter',
    category: 'Pitch',
    borderClass: 'border-sky-600',
    tileClass: 'border-sky-600 bg-sky-600/10 hover:bg-sky-600/25',
    runtime: 'worklet',
    controls: [
      group([knob('semitones', 'Semi', -12, 12, 1, 0), knob('mix', 'Mix', 0, 1, 0.01, 1)])
    ],
    defaultParams: { semitones: 0, mix: 1 },
    workletUrl: WORKLET_URLS.pitchshift,
    workletName: WORKLET_NAMES.pitchshift
  },
  cabinet: {
    type: 'cabinet',
    label: 'Cabinet Sim',
    category: 'Utility',
    borderClass: 'border-stone-500',
    tileClass: 'border-stone-500 bg-stone-500/10 hover:bg-stone-500/25',
    runtime: 'cabinet',
    controls: [{ kind: 'cabinet-loader' }],
    defaultParams: { mix: 0.8 }
  },
  cleanboost: {
    type: 'cleanboost',
    label: 'Clean Boost',
    category: 'Drive',
    borderClass: 'border-emerald-600',
    tileClass: 'border-emerald-600 bg-emerald-600/10 hover:bg-emerald-600/25',
    runtime: 'worklet',
    controls: [knob('level', 'Level', 0, 4, 0.1, 1)],
    defaultParams: { level: 1 },
    workletUrl: WORKLET_URLS.cleanboost,
    workletName: WORKLET_NAMES.cleanboost
  },
  autoswell: {
    type: 'autoswell',
    label: 'Auto-Swell',
    category: 'Utility',
    borderClass: 'border-amber-600',
    tileClass: 'border-amber-600 bg-amber-600/10 hover:bg-amber-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('attack', 'Attack', 10, 2000, 10, 200, 'ms'),
        knob('sensitivity', 'Sens', -60, 0, 1, -30, 'dB'),
        knob('depth', 'Depth', 0, 1, 0.01, 1)
      ])
    ],
    defaultParams: { attack: 200, sensitivity: -30, depth: 1 },
    workletUrl: WORKLET_URLS.autoswell,
    workletName: WORKLET_NAMES.autoswell
  },
  limiter: {
    type: 'limiter',
    label: 'Limiter',
    category: 'Dynamics',
    borderClass: 'border-red-500',
    tileClass: 'border-red-500 bg-red-500/10 hover:bg-red-500/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('threshold', 'Thresh', -20, 0, 0.5, -1, 'dB'),
        knob('release', 'Release', 10, 1000, 5, 100, 'ms')
      ])
    ],
    defaultParams: { threshold: -1, release: 100 },
    workletUrl: WORKLET_URLS.limiter,
    workletName: WORKLET_NAMES.limiter
  },
  ringmod: {
    type: 'ringmod',
    label: 'Ring Mod',
    category: 'Modulation',
    borderClass: 'border-indigo-600',
    tileClass: 'border-indigo-600 bg-indigo-600/10 hover:bg-indigo-600/25',
    runtime: 'worklet',
    controls: [
      group([knob('frequency', 'Freq', 20, 2000, 1, 200, 'Hz'), knob('mix', 'Mix', 0, 1, 0.01, 1)])
    ],
    defaultParams: { frequency: 200, mix: 1 },
    workletUrl: WORKLET_URLS.ringmod,
    workletName: WORKLET_NAMES.ringmod
  },
  bitcrusher: {
    type: 'bitcrusher',
    label: 'Bitcrusher',
    category: 'Modulation',
    borderClass: 'border-green-600',
    tileClass: 'border-green-600 bg-green-600/10 hover:bg-green-600/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('bitDepth', 'Bits', 1, 16, 1, 16),
        knob('downsample', 'Down', 1, 50, 1, 1),
        knob('mix', 'Mix', 0, 1, 0.01, 1)
      ])
    ],
    defaultParams: { bitDepth: 16, downsample: 1, mix: 1 },
    workletUrl: WORKLET_URLS.bitcrusher,
    workletName: WORKLET_NAMES.bitcrusher
  },
  octaver: {
    type: 'octaver',
    label: 'Octaver',
    category: 'Pitch',
    borderClass: 'border-blue-500',
    tileClass: 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('subLevel', 'Sub', 0, 1, 0.01, 0.5),
        knob('upperLevel', 'Upper', 0, 1, 0.01, 0),
        knob('dry', 'Dry', 0, 1, 0.01, 1)
      ])
    ],
    defaultParams: { subLevel: 0.5, upperLevel: 0, dry: 1 },
    workletUrl: WORKLET_URLS.octaver,
    workletName: WORKLET_NAMES.octaver
  },
  rotary: {
    type: 'rotary',
    label: 'Rotary Speaker',
    category: 'Modulation',
    borderClass: 'border-yellow-500',
    tileClass: 'border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('speed', 'Speed', 0, 1, 0.01, 0),
        knob('depth', 'Depth', 0, 1, 0.01, 0.5),
        knob('mix', 'Mix', 0, 1, 0.01, 0.7)
      ])
    ],
    defaultParams: { speed: 0, depth: 0.5, mix: 0.7 },
    workletUrl: WORKLET_URLS.rotary,
    workletName: WORKLET_NAMES.rotary
  },
  graphiceq: {
    type: 'graphiceq',
    label: 'Graphic EQ',
    category: 'EQ',
    borderClass: 'border-sky-600',
    tileClass: 'border-sky-600 bg-sky-600/10 hover:bg-sky-600/25',
    runtime: 'graphic-eq',
    controls: [
      group([
        knob('band60', '60', -12, 12, 0.5, 0, 'dB'),
        knob('band250', '250', -12, 12, 0.5, 0, 'dB'),
        knob('band1k', '1k', -12, 12, 0.5, 0, 'dB'),
        knob('band4k', '4k', -12, 12, 0.5, 0, 'dB'),
        knob('band8k', '8k', -12, 12, 0.5, 0, 'dB'),
        knob('band12k', '12k', -12, 12, 0.5, 0, 'dB')
      ])
    ],
    defaultParams: { band60: 0, band250: 0, band1k: 0, band4k: 0, band8k: 0, band12k: 0 }
  },
  parameq: {
    type: 'parameq',
    label: 'Parametric EQ',
    category: 'EQ',
    borderClass: 'border-blue-600',
    tileClass: 'border-blue-600 bg-blue-600/10 hover:bg-blue-600/25',
    runtime: 'parametric-eq',
    controls: [
      group(
        [
          group(
            [
              knob('freq1', 'F1', 20, 20000, 10, 100, 'Hz'),
              knob('gain1', 'G1', -12, 12, 0.5, 0, 'dB'),
              knob('q1', 'Q1', 0.1, 18, 0.1, 1)
            ],
            'flex gap-2 items-end'
          ),
          group(
            [
              knob('freq2', 'F2', 20, 20000, 10, 500, 'Hz'),
              knob('gain2', 'G2', -12, 12, 0.5, 0, 'dB'),
              knob('q2', 'Q2', 0.1, 18, 0.1, 1)
            ],
            'flex gap-2 items-end'
          ),
          group(
            [
              knob('freq3', 'F3', 20, 20000, 10, 2000, 'Hz'),
              knob('gain3', 'G3', -12, 12, 0.5, 0, 'dB'),
              knob('q3', 'Q3', 0.1, 18, 0.1, 1)
            ],
            'flex gap-2 items-end'
          ),
          group(
            [
              knob('freq4', 'F4', 20, 20000, 10, 8000, 'Hz'),
              knob('gain4', 'G4', -12, 12, 0.5, 0, 'dB'),
              knob('q4', 'Q4', 0.1, 18, 0.1, 1)
            ],
            'flex gap-2 items-end'
          )
        ],
        'flex flex-wrap gap-3 max-w-80'
      )
    ],
    defaultParams: {
      freq1: 100,
      gain1: 0,
      q1: 1,
      freq2: 500,
      gain2: 0,
      q2: 1,
      freq3: 2000,
      gain3: 0,
      q3: 1,
      freq4: 8000,
      gain4: 0,
      q4: 1
    }
  },
  shimmer: {
    type: 'shimmer',
    label: 'Shimmer Reverb',
    category: 'Space',
    borderClass: 'border-purple-500',
    tileClass: 'border-purple-500 bg-purple-500/10 hover:bg-purple-500/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('decay', 'Decay', 0, 0.95, 0.01, 0.7),
        knob('shimmer', 'Shimmer', 0, 1, 0.01, 0.5),
        knob('damping', 'Damp', 0, 1, 0.01, 0.5),
        knob('mix', 'Mix', 0, 1, 0.01, 0.4)
      ])
    ],
    defaultParams: { decay: 0.7, shimmer: 0.5, damping: 0.5, mix: 0.4 },
    workletUrl: WORKLET_URLS.shimmer,
    workletName: WORKLET_NAMES.shimmer
  },
  harmonizer: {
    type: 'harmonizer',
    label: 'Harmonizer',
    category: 'Pitch',
    borderClass: 'border-violet-500',
    tileClass: 'border-violet-500 bg-violet-500/10 hover:bg-violet-500/25',
    runtime: 'worklet',
    controls: [
      group([
        knob('key', 'Key', 0, 11, 1, 0),
        knob('scale', 'Scale', 0, 3, 1, 0),
        knob('interval', 'Intv', -7, 7, 1, 3),
        knob('mix', 'Mix', 0, 1, 0.01, 0.5)
      ])
    ],
    defaultParams: { key: 0, scale: 0, interval: 3, mix: 0.5 },
    workletUrl: WORKLET_URLS.harmonizer,
    workletName: WORKLET_NAMES.harmonizer
  },
  looper: {
    type: 'looper',
    label: 'Looper',
    category: 'Utility',
    borderClass: 'border-red-600',
    tileClass: 'border-red-600 bg-red-600/10 hover:bg-red-600/25',
    runtime: 'worklet',
    controls: [{ kind: 'looper-controls' }],
    defaultParams: { inputLevel: 1, loopLevel: 1, overdubLevel: 0.8 },
    workletUrl: WORKLET_URLS.looper,
    workletName: WORKLET_NAMES.looper
  }
}

export const EFFECT_DEFINITION_LIST = Object.values(EFFECT_DEFINITIONS)

export function getEffectDefinition(type: AudioProcessorType): EffectDefinition {
  return EFFECT_DEFINITIONS[type]
}

export function cloneDefaultEffectParams(type: AudioProcessorType): Record<string, number> {
  return { ...getEffectDefinition(type).defaultParams }
}

export function getEffectPickerSections(query = ''): Array<{
  name: string
  effects: EffectDefinition[]
}> {
  const normalizedQuery = query.trim().toLowerCase()
  const definitions = EFFECT_DEFINITION_LIST.filter((definition) => !definition.hiddenFromPicker)
  const categories = Array.from(new Set(definitions.map((definition) => definition.category)))

  return categories
    .map((name) => ({
      name,
      effects: definitions.filter((definition) => {
        if (definition.category !== name) return false
        if (!normalizedQuery) return true
        return (
          definition.label.toLowerCase().includes(normalizedQuery) ||
          definition.category.toLowerCase().includes(normalizedQuery)
        )
      })
    }))
    .filter((section) => section.effects.length > 0)
}
