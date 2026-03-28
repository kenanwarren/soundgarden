import { createJSONStorage } from 'zustand/middleware'

type StorageLike = {
  getItem: (name: string) => string | null
  setItem: (name: string, value: string) => void
  removeItem: (name: string) => void
}

const memoryStore = new Map<string, string>()

const fallbackStorage: StorageLike = {
  getItem: (name) => memoryStore.get(name) ?? null,
  setItem: (name, value) => {
    memoryStore.set(name, value)
  },
  removeItem: (name) => {
    memoryStore.delete(name)
  }
}

function resolveStorage(): StorageLike {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  return fallbackStorage
}

export const zustandStorage = createJSONStorage(resolveStorage)
