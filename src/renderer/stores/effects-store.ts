import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AudioProcessorType } from '../audio/types'
import { zustandStorage } from '../utils/store-storage'

export interface EffectConfig {
  id: string
  type: AudioProcessorType
  enabled: boolean
  params: Record<string, number>
}

const DEFAULT_PARAMS: Record<AudioProcessorType, Record<string, number>> = {
  gain: { gain: 1.0, drive: 0 },
  eq: { low: 0, mid: 0, high: 0 },
  reverb: { mix: 0.3 },
  delay: { time: 300, feedback: 0.3, mix: 0.3 },
  chorus: { rate: 1.5, depth: 0.5, mix: 0.5 },
  compressor: { threshold: -20, ratio: 4, attack: 10, release: 100, makeup: 0 },
  noisegate: { threshold: -40, attack: 1, release: 50 },
  nam: { inputGain: 1.0, outputGain: 1.0 },
  tuner: {},
  tremolo: { rate: 4, depth: 0.5, wave: 0 },
  phaser: { rate: 0.5, depth: 0.7, stages: 4, feedback: 0.5, mix: 0.5 },
  flanger: { rate: 0.5, depth: 0.7, feedback: 0.5, mix: 0.5 },
  distortion: { gain: 3, tone: 0.5, mode: 0, mix: 1 },
  wah: { sensitivity: 0.5, frequency: 1500, q: 5, mode: 0 },
  pitchshift: { semitones: 0, mix: 1 },
  cabinet: { mix: 0.8 },
  cleanboost: { level: 1.0 },
  autoswell: { attack: 200, sensitivity: -30, depth: 1.0 },
  limiter: { threshold: -1, release: 100 },
  ringmod: { frequency: 200, mix: 1.0 },
  bitcrusher: { bitDepth: 16, downsample: 1, mix: 1.0 },
  octaver: { subLevel: 0.5, upperLevel: 0, dry: 1.0 },
  rotary: { speed: 0, depth: 0.5, mix: 0.7 },
  graphiceq: { band60: 0, band250: 0, band1k: 0, band4k: 0, band8k: 0, band12k: 0 },
  parameq: {
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
  },
  shimmer: { decay: 0.7, shimmer: 0.5, damping: 0.5, mix: 0.4 },
  harmonizer: { key: 0, scale: 0, interval: 3, mix: 0.5 },
  looper: { inputLevel: 1.0, loopLevel: 1.0, overdubLevel: 0.8 }
}

interface EffectsState {
  chain: EffectConfig[]
  nextId: number
  addEffect: (type: AudioProcessorType) => void
  removeEffect: (id: string) => void
  toggleEffect: (id: string) => void
  setParam: (id: string, param: string, value: number) => void
  reorderEffects: (fromIndex: number, toIndex: number) => void
}

export const useEffectsStore = create<EffectsState>()(
  persist(
    (set) => ({
      chain: [],
      nextId: 1,

      addEffect: (type) =>
        set((state) => ({
          nextId: state.nextId + 1,
          chain: [
            ...state.chain,
            {
              id: `${type}-${state.nextId}`,
              type,
              enabled: true,
              params: { ...DEFAULT_PARAMS[type] }
            }
          ]
        })),

      removeEffect: (id) =>
        set((state) => ({
          chain: state.chain.filter((e) => e.id !== id)
        })),

      toggleEffect: (id) =>
        set((state) => ({
          chain: state.chain.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
        })),

      setParam: (id, param, value) =>
        set((state) => ({
          chain: state.chain.map((e) =>
            e.id === id ? { ...e, params: { ...e.params, [param]: value } } : e
          )
        })),

      reorderEffects: (fromIndex, toIndex) =>
        set((state) => {
          const chain = [...state.chain]
          const [removed] = chain.splice(fromIndex, 1)
          chain.splice(toIndex, 0, removed)
          return { chain }
        })
    }),
    {
      name: 'soundgarden-effects',
      storage: zustandStorage,
      partialize: (state) => ({ chain: state.chain, nextId: state.nextId })
    }
  )
)
