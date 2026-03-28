import { useCallback, useRef } from 'react'
import { usePitchDetection } from './usePitchDetection'
import { useScaleStore } from '../stores/scale-store'
import { getScaleNotes } from '../utils/scale-data'
import { SCALES } from '../utils/scale-data'

const HIT_DEBOUNCE_MS = 300

export function useScalePractice() {
  const {
    selectedRoot,
    selectedScaleIndex,
    isPracticing,
    setPracticing,
    registerHit,
    setDetectedNote,
    resetProgress
  } = useScaleStore()

  const lastHitTime = useRef<Record<string, number>>({})
  const scale = SCALES[selectedScaleIndex]
  const scaleNotes = getScaleNotes(selectedRoot, scale)
  const scaleNoteSet = new Set(scaleNotes)

  const onPitch = useCallback(
    (data: { note: string; octave: number; frequency: number; clarity: number; cents: number }) => {
      if (data.frequency === 0) {
        setDetectedNote(null, null)
        return
      }

      setDetectedNote(data.note, data.octave)

      if (scaleNoteSet.has(data.note) && Math.abs(data.cents) < 30) {
        const now = Date.now()
        const lastTime = lastHitTime.current[data.note] || 0
        if (now - lastTime > HIT_DEBOUNCE_MS) {
          lastHitTime.current[data.note] = now
          registerHit(data.note)
        }
      }
    },
    [scaleNoteSet, setDetectedNote, registerHit]
  )

  const { start, stop, isConnected } = usePitchDetection({
    id: '__scale_practice__',
    onPitch
  })

  const startPractice = useCallback(async () => {
    resetProgress()
    lastHitTime.current = {}
    await start()
    setPracticing(true)
  }, [start, setPracticing, resetProgress])

  const stopPractice = useCallback(() => {
    stop()
    setPracticing(false)
    setDetectedNote(null, null)
  }, [stop, setPracticing, setDetectedNote])

  return { startPractice, stopPractice, isPracticing, isConnected }
}
