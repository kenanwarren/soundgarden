import { useAudioStore } from '../stores/audio-store'
import { useAppSettingsStore } from '../stores/app-settings-store'
import { getEngine } from './useAudioEngine'
import { useUiStore } from '../stores/ui-store'

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
    const engine = getEngine()
    if (!engine) return

    const { setDevicesLoading, setDevices, setLastRecoverableError } = useAudioStore.getState()
    const { audio } = useAppSettingsStore.getState()
    const permissionState = useAudioStore.getState().permissionState
    setDevicesLoading(true)
    try {
      const devices = await engine.enumerateDevices()
      const inputDevices = devices.filter((device) => device.kind === 'audioinput')
      const outputDevices = devices.filter((device) => device.kind === 'audiooutput')
      let nextError: string | null = null

      setDevices(devices)

      if (
        audio.inputDeviceId &&
        !inputDevices.some((device) => device.id === audio.inputDeviceId)
      ) {
        useAppSettingsStore.getState().setAudioSetting('inputDeviceId', null)
        nextError = 'Your saved input device is unavailable. Select another input to continue.'
      }

      if (
        audio.outputDeviceId &&
        !outputDevices.some((device) => device.id === audio.outputDeviceId)
      ) {
        useAppSettingsStore.getState().setAudioSetting('outputDeviceId', null)
        nextError =
          'Your saved output device is unavailable. Soundgarden switched back to the default output.'
      }

      if (devices.length === 0) {
        nextError = 'No audio devices were found.'
      }

      if (permissionState === 'denied' && nextError === null) {
        nextError = 'Microphone access is blocked. Grant permission to use live audio features.'
      }

      setLastRecoverableError(nextError)
    } catch (err) {
      const message = 'Could not refresh audio devices.'
      setLastRecoverableError(message)
      useUiStore.getState().pushNotice({
        tone: 'error',
        title: 'Device refresh failed',
        description: String(err)
      })
    } finally {
      setDevicesLoading(false)
    }
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
