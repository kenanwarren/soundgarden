import { useAudioStore } from '../stores/audio-store'

export function useDevices() {
  const inputDevices = useAudioStore((s) => s.inputDevices)
  const outputDevices = useAudioStore((s) => s.outputDevices)
  const inputDeviceId = useAudioStore((s) => s.inputDeviceId)
  const outputDeviceId = useAudioStore((s) => s.outputDeviceId)
  const setInputDeviceId = useAudioStore((s) => s.setInputDeviceId)
  const setOutputDeviceId = useAudioStore((s) => s.setOutputDeviceId)

  return {
    inputDevices,
    outputDevices,
    inputDeviceId,
    outputDeviceId,
    setInputDeviceId,
    setOutputDeviceId
  }
}
