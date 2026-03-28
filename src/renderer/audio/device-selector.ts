import type { AudioDeviceInfo } from './types'

export async function enumerateAudioDevices(): Promise<AudioDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices
    .filter((d) => d.kind === 'audioinput' || d.kind === 'audiooutput')
    .map((d) => ({
      id: d.deviceId,
      label: d.label || `${d.kind === 'audioinput' ? 'Input' : 'Output'} (${d.deviceId.slice(0, 8)})`,
      kind: d.kind as 'audioinput' | 'audiooutput'
    }))
}

export async function getInputStream(deviceId: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: { exact: deviceId },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      sampleRate: 48000
    }
  })
}

export function onDeviceChange(callback: () => void): () => void {
  navigator.mediaDevices.addEventListener('devicechange', callback)
  return () => navigator.mediaDevices.removeEventListener('devicechange', callback)
}
