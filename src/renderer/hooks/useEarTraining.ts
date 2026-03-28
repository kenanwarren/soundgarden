import { useCallback, useRef } from 'react'
import { useEarTrainingStore } from '../stores/ear-training-store'
import { usePitchDetection } from './usePitchDetection'
import { NOTE_NAMES } from '../utils/constants'
import { noteToFrequency } from '../utils/note-utils'
import { INTERVALS } from '../utils/interval-data'

const TONE_DURATION = 0.8
const TONE_GAP = 0.3

export function useEarTraining() {
  const {
    mode,
    currentChallenge,
    isListening,
    setChallenge,
    setListening,
    recordResult
  } = useEarTrainingStore()

  const audioCtxRef = useRef<AudioContext | null>(null)

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext({ sampleRate: 48000 })
    }
    return audioCtxRef.current
  }, [])

  const playTone = useCallback(
    (frequency: number, startTime: number, duration: number) => {
      const ctx = getAudioCtx()
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
    },
    [getAudioCtx]
  )

  const generateChallenge = useCallback(() => {
    const referenceNoteIndex = Math.floor(Math.random() * 12)
    const referenceOctave = 3 + Math.floor(Math.random() * 2)
    const referenceNote = NOTE_NAMES[referenceNoteIndex]

    let targetNote: string
    let targetOctave: number
    let intervalSemitones: number
    let intervalName: string

    if (mode === 'note') {
      targetNote = referenceNote
      targetOctave = referenceOctave
      intervalSemitones = 0
      intervalName = 'Unison'
    } else {
      const availableIntervals = INTERVALS.filter((i) => i.semitones > 0 && i.semitones <= 12)
      const interval = availableIntervals[Math.floor(Math.random() * availableIntervals.length)]
      intervalSemitones = interval.semitones
      intervalName = interval.name
      const targetIndex = (referenceNoteIndex + intervalSemitones) % 12
      targetNote = NOTE_NAMES[targetIndex]
      targetOctave = referenceOctave + Math.floor((referenceNoteIndex + intervalSemitones) / 12)
    }

    const challenge = {
      referenceNote,
      referenceOctave,
      targetNote,
      targetOctave,
      intervalSemitones,
      intervalName
    }
    setChallenge(challenge)
    return challenge
  }, [mode, setChallenge])

  const playChallenge = useCallback(
    async (challenge = currentChallenge) => {
      if (!challenge) return

      const ctx = getAudioCtx()
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
    [mode, currentChallenge, getAudioCtx, playTone]
  )

  const onPitch = useCallback(
    (data: { note: string; octave: number; frequency: number; clarity: number; cents: number }) => {
      if (!currentChallenge || !isListening || data.frequency === 0) return
      if (Math.abs(data.cents) > 30) return

      if (mode === 'note') {
        const correct = data.note === currentChallenge.referenceNote
        recordResult(correct)
      } else {
        const correct = data.note === currentChallenge.targetNote
        recordResult(correct)
      }
    },
    [currentChallenge, isListening, mode, recordResult]
  )

  const { start: startDetection, stop: stopDetection, isConnected } = usePitchDetection({
    id: '__ear_training__',
    onPitch
  })

  const newRound = useCallback(async () => {
    const challenge = generateChallenge()
    await playChallenge(challenge)
  }, [generateChallenge, playChallenge])

  const listen = useCallback(async () => {
    setListening(true)
    await startDetection()
  }, [setListening, startDetection])

  const stopListening = useCallback(() => {
    stopDetection()
    setListening(false)
  }, [stopDetection, setListening])

  return {
    newRound,
    playChallenge,
    listen,
    stopListening,
    isConnected
  }
}
