import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUiStore } from '../../src/renderer/stores/ui-store'

describe('ui-store', () => {
  beforeEach(() => {
    vi.useRealTimers()
    useUiStore.setState({ notices: [] })
  })

  it('replaces notices with the same id instead of duplicating them', () => {
    const store = useUiStore.getState()

    store.pushNotice({ id: 'audio', tone: 'warning', title: 'Old' })
    store.pushNotice({ id: 'audio', tone: 'error', title: 'New' })

    expect(useUiStore.getState().notices).toHaveLength(1)
    expect(useUiStore.getState().notices[0]).toMatchObject({
      id: 'audio',
      tone: 'error',
      title: 'New'
    })
  })

  it('keeps only the newest five notices', () => {
    const store = useUiStore.getState()

    for (let i = 0; i < 6; i++) {
      store.pushNotice({ id: `notice-${i}`, tone: 'info', title: `Notice ${i}` })
    }

    expect(useUiStore.getState().notices).toHaveLength(5)
    expect(useUiStore.getState().notices.map((notice) => notice.id)).toEqual([
      'notice-5',
      'notice-4',
      'notice-3',
      'notice-2',
      'notice-1'
    ])
  })
})
