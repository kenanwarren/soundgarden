import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChordLibraryState {
  selectedChordIndex: number | null
  filterRoot: string | null
  filterCategory: 'all' | 'open' | 'barre' | 'extended'
  setSelectedChord: (index: number | null) => void
  setFilterRoot: (root: string | null) => void
  setFilterCategory: (category: 'all' | 'open' | 'barre' | 'extended') => void
}

export const useChordLibraryStore = create<ChordLibraryState>()(
  persist(
    (set) => ({
      selectedChordIndex: null,
      filterRoot: null,
      filterCategory: 'all',
      setSelectedChord: (index) => set({ selectedChordIndex: index }),
      setFilterRoot: (root) => set({ filterRoot: root }),
      setFilterCategory: (category) => set({ filterCategory: category })
    }),
    {
      name: 'soundgarden-chord-library',
      partialize: (state) => ({
        filterRoot: state.filterRoot,
        filterCategory: state.filterCategory
      })
    }
  )
)
