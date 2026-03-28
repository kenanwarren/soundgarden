import { create } from 'zustand'

export type UiNoticeTone = 'info' | 'success' | 'warning' | 'error'

export interface UiNotice {
  id: string
  tone: UiNoticeTone
  title: string
  description?: string
  timeoutMs?: number
  createdAt: number
}

interface UiState {
  notices: UiNotice[]
  pushNotice: (notice: Omit<UiNotice, 'id' | 'createdAt'> & { id?: string }) => string
  dismissNotice: (id: string) => void
  clearNotices: () => void
}

let noticeCount = 0

export const useUiStore = create<UiState>((set) => ({
  notices: [],
  pushNotice: (notice) => {
    const id = notice.id ?? `notice-${Date.now()}-${noticeCount++}`
    set((state) => ({
      notices: [
        { ...notice, id, createdAt: Date.now() },
        ...state.notices.filter((existing) => existing.id !== id)
      ].slice(0, 5)
    }))
    return id
  },
  dismissNotice: (id) =>
    set((state) => ({
      notices: state.notices.filter((notice) => notice.id !== id)
    })),
  clearNotices: () => set({ notices: [] })
}))
