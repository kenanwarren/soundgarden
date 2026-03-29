import { refreshAudioRuntimeDevices } from '../audio/runtime'
import { useAudioStore } from '../stores/audio-store'
import { useAppSettingsStore } from '../stores/app-settings-store'

export function useDevices() {
  const inputDevices = useAudioStore((s) => s.inputDevices)
  const outputDevices = useAudioStore((s) => s.outputDevices)
  const devicesLoading = useAudioStore((s) => s.devicesLoading)
  const inputDeviceId = useAppSettingsStore((s) => s.audio.inputDeviceId)
  const outputDeviceId = useAppSettingsStore((s) => s.audio.outputDeviceId)
  const setAudioSetting = useAppSettingsStore((s) => s.setAudioSetting)

  const setInputDeviceId = (id: string | null) => setAudioSetting('inputDeviceId', id)
  const setOutputDeviceId = (id: string | null) => setAudioSetting('outputDeviceId', id)

  const refreshDevices = async () => {
    await refreshAudioRuntimeDevices()
  }

  return {
    inputDevices,
    outputDevices,
    inputDeviceId,
    outputDeviceId,
    devicesLoading,
    setInputDeviceId,
    setOutputDeviceId,
    refreshDevices
  }
}
