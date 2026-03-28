import { useEffect, useRef, useCallback } from 'react'
import { useMetronomeStore } from '../stores/metronome-store'

const SCHEDULE_AHEAD = 0.1 // seconds to schedule ahead
const LOOKAHEAD_MS = 25 // how often to call the scheduler

export function useMetronome() {
  const { bpm, beatsPerMeasure, isPlaying, accentFirst, setBpm, setPlaying, setCurrentBeat } =
    useMetronomeStore()

  const ctxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | null>(null)
  const nextNoteTimeRef = useRef(0)
  const currentBeatRef = useRef(0)

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext({ sampleRate: 48000 })
    }
    return ctxRef.current
  }, [])

  const scheduleClick = useCallback(
    (time: number, isAccent: boolean) => {
      const ctx = getContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.frequency.value = isAccent ? 1000 : 800
      gain.gain.setValueAtTime(isAccent ? 0.6 : 0.3, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

      osc.start(time)
      osc.stop(time + 0.05)
    },
    [getContext]
  )

  const scheduler = useCallback(() => {
    const ctx = getContext()
    const secondsPerBeat = 60 / bpm

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const beat = currentBeatRef.current
      const isAccent = accentFirst && beat === 0

      scheduleClick(nextNoteTimeRef.current, isAccent)
      setCurrentBeat(beat)

      currentBeatRef.current = (beat + 1) % beatsPerMeasure
      nextNoteTimeRef.current += secondsPerBeat
    }
  }, [bpm, beatsPerMeasure, accentFirst, getContext, scheduleClick, setCurrentBeat])

  const start = useCallback(async () => {
    const ctx = getContext()
    if (ctx.state === 'suspended') await ctx.resume()

    currentBeatRef.current = 0
    nextNoteTimeRef.current = ctx.currentTime + 0.05

    setPlaying(true)
  }, [getContext, setPlaying])

  const stop = useCallback(() => {
    setPlaying(false)
    setCurrentBeat(0)
  }, [setPlaying, setCurrentBeat])

  useEffect(() => {
    if (isPlaying) {
      const id = window.setInterval(scheduler, LOOKAHEAD_MS)
      timerRef.current = id
      return () => window.clearInterval(id)
    } else if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [isPlaying, scheduler])

  const tapTimes = useRef<number[]>([])

  const tap = useCallback(() => {
    const now = performance.now()
    tapTimes.current.push(now)

    if (tapTimes.current.length > 5) tapTimes.current.shift()

    // Discard taps older than 3 seconds
    tapTimes.current = tapTimes.current.filter((t) => now - t < 3000)

    if (tapTimes.current.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < tapTimes.current.length; i++) {
        intervals.push(tapTimes.current[i] - tapTimes.current[i - 1])
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const tapBpm = Math.round(60000 / avg)
      setBpm(tapBpm)
    }
  }, [setBpm])

  return { bpm, beatsPerMeasure, isPlaying, accentFirst, start, stop, tap, setBpm }
}
