import { useCallback } from 'react'
import { useTunerStore } from '../stores/tuner-store'
import { usePitchDetection } from './usePitchDetection'

export function useTuner() {
  const { isActive, referenceA4, setTunerData, setActive } = useTunerStore()

  const onPitch = useCallback(
    (data: { frequency: number; note: string; octave: number; cents: number; clarity: number }) => {
      setTunerData(data.frequency, data.note, data.octave, data.cents, data.clarity)
    },
    [setTunerData]
  )

  const { start, stop, isConnected } = usePitchDetection({
    id: '__tuner__',
    referenceA4,
    onPitch
  })

  const startTuner = useCallback(async () => {
    await start()
    setActive(true)
  }, [start, setActive])

  const stopTuner = useCallback(() => {
    stop()
    setActive(false)
  }, [stop, setActive])

  return {
    isActive,
    startTuner,
    stopTuner,
    isConnected
  }
}
