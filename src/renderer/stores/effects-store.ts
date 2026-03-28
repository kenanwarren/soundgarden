import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AudioProcessorType } from '../audio/types'

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
  tuner: {}
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
      partialize: (state) => ({ chain: state.chain, nextId: state.nextId })
    }
  )
)
