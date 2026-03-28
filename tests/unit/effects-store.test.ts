// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { useEffectsStore } from '../../src/renderer/stores/effects-store'

function persistedEffectsState() {
  const raw = localStorage.getItem('soundgarden-effects')
  return raw ? JSON.parse(raw).state : null
}

describe('effects-store', () => {
  beforeEach(() => {
    localStorage.clear()
    useEffectsStore.setState({ chain: [], nextId: 1 })
  })

  it('clones default params for each added effect so updates stay isolated', () => {
    const store = useEffectsStore.getState()

    store.addEffect('delay')
    store.addEffect('delay')

    const [first, second] = useEffectsStore.getState().chain
    store.setParam(first.id, 'mix', 0.9)

    expect(useEffectsStore.getState().chain[0].params.mix).toBe(0.9)
    expect(useEffectsStore.getState().chain[1].params.mix).toBe(0.3)
    expect(second.id).toBe('delay-2')
  })

  it('reorders effects predictably, including no-op same-index moves', () => {
    const store = useEffectsStore.getState()

    store.addEffect('gain')
    store.addEffect('chorus')
    store.addEffect('delay')

    store.reorderEffects(1, 1)
    expect(useEffectsStore.getState().chain.map((effect) => effect.type)).toEqual([
      'gain',
      'chorus',
      'delay'
    ])

    store.reorderEffects(2, 0)

    expect(useEffectsStore.getState().chain.map((effect) => effect.type)).toEqual([
      'delay',
      'gain',
      'chorus'
    ])
  })

  it('persists only the chain and next id for hydration', () => {
    const store = useEffectsStore.getState()

    store.addEffect('gain')
    store.toggleEffect('gain-1')

    expect(persistedEffectsState()).toEqual({
      chain: [
        {
          id: 'gain-1',
          type: 'gain',
          enabled: false,
          params: { gain: 1, drive: 0 }
        }
      ],
      nextId: 2
    })
  })
})
