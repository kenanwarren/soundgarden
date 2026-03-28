import { create } from 'zustand'

interface TunerState {
  frequency: number
  noteName: string
  octave: number
  centsOffset: number
  clarity: number
  isActive: boolean
  referenceA4: number

  setTunerData: (frequency: number, noteName: string, octave: number, cents: number, clarity: number) => void
  setActive: (active: boolean) => void
  setReferenceA4: (freq: number) => void
}

export const useTunerStore = create<TunerState>((set) => ({
  frequency: 0,
  noteName: '-',
  octave: 0,
  centsOffset: 0,
  clarity: 0,
  isActive: false,
  referenceA4: 440,

  setTunerData: (frequency, noteName, octave, cents, clarity) =>
    set({ frequency, noteName, octave, centsOffset: cents, clarity }),
  setActive: (active) => set({ isActive: active }),
  setReferenceA4: (freq) => set({ referenceA4: freq })
}))
