import { useEffect, useRef, useCallback } from 'react'
import { AudioEngine } from '../audio/engine'
import { useAudioStore } from '../stores/audio-store'

const engineRef = { current: null as AudioEngine | null }
let globalInitialized = false

export function getEngine(): AudioEngine | null {
  return engineRef.current
}

/**
 * Call this once at the App level to initialize the audio engine.
 * The engine persists for the lifetime of the app (not tied to page navigation).
 */
export function useAudioEngineInit() {
  const { setDevices, setInputLevel } = useAudioStore()

  useEffect(() => {
    if (globalInitialized) return
    globalInitialized = true

    const engine = new AudioEngine()
    engineRef.current = engine

    engine.initialize().then(async () => {
      // Request permission first with a temp stream to get device labels
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        tempStream.getTracks().forEach((t) => t.stop())
      } catch {
        // Permission denied - devices will have empty labels
      }

      const devices = await engine.enumerateDevices()
      setDevices(devices)

      engine.onLevel((level) => setInputLevel(level))
      engine.onDeviceChange(async () => {
        const updated = await engine.enumerateDevices()
        setDevices(updated)
      })

      const { inputDeviceId, setInputDeviceId, setConnected } = useAudioStore.getState()
      if (inputDeviceId) {
        const inputDevices = devices.filter((d) => d.kind === 'audioinput')
        const stillAvailable = inputDevices.some((d) => d.id === inputDeviceId)
        if (stillAvailable) {
          try {
            await engine.connectInput(inputDeviceId)
            setConnected(true)
          } catch {
            setInputDeviceId(null)
          }
        } else {
          setInputDeviceId(null)
        }
      }
    })

    return () => {
      engine.dispose()
      engineRef.current = null
      globalInitialized = false
    }
  }, [setDevices, setInputLevel])
}

/**
 * Use in any page component to get audio connect/disconnect controls.
 */
export function useAudioEngine() {
  const isConnected = useAudioStore((s) => s.isConnected)
  const inputDeviceId = useAudioStore((s) => s.inputDeviceId)
  const outputDeviceId = useAudioStore((s) => s.outputDeviceId)
  const masterVolume = useAudioStore((s) => s.masterVolume)
  const setConnected = useAudioStore((s) => s.setConnected)

  const connect = useCallback(
    async (deviceId: string) => {
      const engine = engineRef.current
      if (!engine) return

      try {
        await engine.connectInput(deviceId)
        setConnected(true)
      } catch (err) {
        console.error('Failed to connect input:', err)
        setConnected(false)
      }
    },
    [setConnected]
  )

  const disconnect = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return

    engine.disconnectInput()
    setConnected(false)
  }, [setConnected])

  useEffect(() => {
    const engine = engineRef.current
    if (engine && outputDeviceId) {
      engine.setOutputDevice(outputDeviceId)
    }
  }, [outputDeviceId])

  useEffect(() => {
    const engine = engineRef.current
    if (engine) {
      engine.setMasterVolume(masterVolume)
    }
  }, [masterVolume])

  return {
    isConnected,
    inputDeviceId,
    connect,
    disconnect,
    engine: engineRef.current
  }
}
