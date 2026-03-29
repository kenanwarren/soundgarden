import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AudioProcessorType } from '../audio/types'
import { cloneDefaultEffectParams } from '../effects/definitions'
import { zustandStorage } from '../utils/store-storage'

export interface EffectConfig {
  id: string
  type: AudioProcessorType
  enabled: boolean
  params: Record<string, number>
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
              params: cloneDefaultEffectParams(type)
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
