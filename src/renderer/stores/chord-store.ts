import { create } from 'zustand'
import type { ChordResult } from '../utils/chord-detection'

interface ChordState {
  isActive: boolean
  currentChord: ChordResult | null
  chromagram: Float32Array | null
  tickCount: number
  peakDb: number

  setActive: (active: boolean) => void
  setChord: (chord: ChordResult | null) => void
  setChromagram: (data: Float32Array) => void
  tick: (peakDb: number) => void
}

export const useChordStore = create<ChordState>((set) => ({
  isActive: false,
  currentChord: null,
  chromagram: null,
  tickCount: 0,
  peakDb: -Infinity,

  setActive: (active) => set({ isActive: active, tickCount: 0, peakDb: -Infinity }),
  setChord: (chord) => set({ currentChord: chord }),
  setChromagram: (data) => set({ chromagram: data }),
  tick: (peakDb) => set((s) => ({ tickCount: s.tickCount + 1, peakDb }))
}))
