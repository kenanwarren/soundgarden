import { useEffect, useCallback } from 'react'
import {
  applyMonitoring,
  applyOutputDevice,
  audioRuntimeCommands,
  disposeAudioRuntime,
  getEngine,
  initializeAudioRuntime
} from '../audio/runtime'
import { useAudioStore } from '../stores/audio-store'
import { useAppSettingsStore } from '../stores/app-settings-store'

export { getEngine } from '../audio/runtime'

/**
 * Call this once at the App level to initialize the audio engine.
 * The engine persists for the lifetime of the app (not tied to page navigation).
 */
export function useAudioEngineInit() {
  const outputDeviceId = useAppSettingsStore((s) => s.audio.outputDeviceId)
  const masterVolume = useAppSettingsStore((s) => s.audio.masterVolume)
  const monitoringEnabled = useAppSettingsStore((s) => s.audio.monitoringEnabled)

  useEffect(() => {
    void initializeAudioRuntime()

    return () => {
      void disposeAudioRuntime()
    }
  }, [])

  useEffect(() => {
    void applyOutputDevice(outputDeviceId)
  }, [outputDeviceId])

  useEffect(() => {
    applyMonitoring(masterVolume, monitoringEnabled)
  }, [masterVolume, monitoringEnabled])
}

/**
 * Use in any page component to get audio connect/disconnect controls.
 */
export function useAudioEngine() {
  const isConnected = useAudioStore((s) => s.isConnected)
  const isReady = useAudioStore((s) => s.isReady)
  const inputDeviceId = useAppSettingsStore((s) => s.audio.inputDeviceId)

  const connect = useCallback(async (deviceId: string) => {
    await audioRuntimeCommands.connectInput(deviceId)
  }, [])

  const disconnect = useCallback(() => {
    audioRuntimeCommands.disconnectInput()
  }, [])

  return {
    isReady,
    isConnected,
    inputDeviceId,
    connect,
    disconnect,
    reconnect: audioRuntimeCommands.reconnectSelectedInput,
    engine: getEngine()
  }
}
