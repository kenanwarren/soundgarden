// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_INTERFACE_SETTINGS,
  DEFAULT_PRACTICE_SETTINGS,
  useAppSettingsStore
} from '../../src/renderer/stores/app-settings-store'

function persistedState(key: string) {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw).state : null
}

describe('app-settings-store', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppSettingsStore.setState({
      audio: { ...DEFAULT_AUDIO_SETTINGS },
      practice: { ...DEFAULT_PRACTICE_SETTINGS },
      interface: { ...DEFAULT_INTERFACE_SETTINGS }
    })
  })

  it('updates and resets each settings group independently', () => {
    const store = useAppSettingsStore.getState()

    store.setAudioSetting('masterVolume', 0.25)
    store.setPracticeSetting('referenceA4', 442)
    store.setInterfaceSetting('compactControls', true)

    expect(useAppSettingsStore.getState().audio.masterVolume).toBe(0.25)
    expect(useAppSettingsStore.getState().practice.referenceA4).toBe(442)
    expect(useAppSettingsStore.getState().interface.compactControls).toBe(true)

    store.resetAudioSettings()
    store.resetPracticeSettings()
    store.resetInterfaceSettings()

    expect(useAppSettingsStore.getState().audio).toEqual(DEFAULT_AUDIO_SETTINGS)
    expect(useAppSettingsStore.getState().practice).toEqual(DEFAULT_PRACTICE_SETTINGS)
    expect(useAppSettingsStore.getState().interface).toEqual(DEFAULT_INTERFACE_SETTINGS)
  })

  it('persists the full settings shape for later hydration', () => {
    const store = useAppSettingsStore.getState()

    store.setAudioSetting('monitoringEnabled', false)
    store.setPracticeSetting('metronomeBpm', 136)
    store.setInterfaceSetting('showTooltips', false)

    expect(persistedState('soundgarden-app-settings')).toMatchObject({
      audio: {
        ...DEFAULT_AUDIO_SETTINGS,
        monitoringEnabled: false
      },
      practice: {
        ...DEFAULT_PRACTICE_SETTINGS,
        metronomeBpm: 136
      },
      interface: {
        ...DEFAULT_INTERFACE_SETTINGS,
        showTooltips: false
      }
    })
  })
})
