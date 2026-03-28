import { useCallback, useEffect } from 'react'
import { useEarTrainingStore } from '../stores/ear-training-store'
import { usePitchDetection } from './usePitchDetection'
import { noteToFrequency } from '../utils/note-utils'
import { getPlaybackContext } from '../utils/playback-context'
import { generateChallenge } from '../utils/ear-training-challenge'
import { getEarTrainingPreset } from '../utils/learn-data'

const TONE_DURATION = 0.8
const TONE_GAP = 0.3

export function useEarTraining() {
  const {
    mode,
    challengePresetId,
    currentChallenge,
    isListening,
    setChallenge,
    setListening,
    recordResult
  } = useEarTrainingStore()
  const preset = getEarTrainingPreset(challengePresetId)

  const playTone = useCallback((frequency: number, startTime: number, duration: number) => {
    const ctx = getPlaybackContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02)
    gain.gain.setValueAtTime(0.3, startTime + duration - 0.05)
    gain.gain.linearRampToValueAtTime(0, startTime + duration)
    osc.start(startTime)
    osc.stop(startTime + duration)
  }, [])

  const playChallenge = useCallback(
    async (challenge = currentChallenge) => {
      if (!challenge) return

      const ctx = getPlaybackContext()
      if (ctx.state === 'suspended') await ctx.resume()

      const refFreq = noteToFrequency(challenge.referenceNote, challenge.referenceOctave)
      const now = ctx.currentTime + 0.05

      if (mode === 'note') {
        playTone(refFreq, now, TONE_DURATION)
      } else {
        playTone(refFreq, now, TONE_DURATION)
        const targetFreq = noteToFrequency(challenge.targetNote, challenge.targetOctave)
        playTone(targetFreq, now + TONE_DURATION + TONE_GAP, TONE_DURATION)
      }
    },
    [mode, currentChallenge, playTone]
  )

  const onPitch = useCallback(
    (data: { note: string; octave: number; frequency: number; clarity: number; cents: number }) => {
      if (!currentChallenge || !isListening || data.frequency === 0) return
      if (Math.abs(data.cents) > 30) return

      if (mode === 'note') {
        const correct = data.note === currentChallenge.referenceNote
        recordResult(correct, correct ? undefined : currentChallenge.referenceNote)
      } else {
        const correct = data.note === currentChallenge.targetNote
        recordResult(correct, correct ? undefined : currentChallenge.intervalName)
      }
    },
    [currentChallenge, isListening, mode, recordResult]
  )

  const {
    start: startDetection,
    stop: stopDetection,
    isConnected
  } = usePitchDetection({
    id: '__ear_training__',
    onPitch
  })

  const newRound = useCallback(async () => {
    const challenge = generateChallenge(mode, {
      allowedSemitones: preset?.allowedSemitones,
      referenceNotes: preset?.referenceNotes
    })
    setChallenge(challenge)
    await playChallenge(challenge)
  }, [mode, playChallenge, preset?.allowedSemitones, preset?.referenceNotes, setChallenge])

  const listen = useCallback(async () => {
    setListening(true)
    await startDetection()
  }, [setListening, startDetection])

  const stopListening = useCallback(() => {
    stopDetection()
    setListening(false)
  }, [stopDetection, setListening])

  useEffect(() => {
    if (!isListening) {
      stopDetection()
    }
  }, [isListening, stopDetection])

  return {
    newRound,
    playChallenge,
    listen,
    stopListening,
    isConnected
  }
}
