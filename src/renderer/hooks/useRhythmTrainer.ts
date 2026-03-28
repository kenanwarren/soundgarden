import { useRef, useCallback, useEffect } from 'react'
import { useRhythmStore } from '../stores/rhythm-store'
import { useMetronomeStore } from '../stores/metronome-store'
import { RHYTHM_PATTERNS } from '../utils/rhythm-patterns'
import { getEngine } from './useAudioEngine'
import { useAudioStore } from '../stores/audio-store'

const ONSET_THRESHOLD = 0.05
const DEAD_ZONE_MS = 80
const SCHEDULE_AHEAD = 0.1
const LOOKAHEAD_MS = 25

export function useRhythmTrainer() {
  const isConnected = useAudioStore((s) => s.isConnected)
  const { selectedPatternIndex, isRunning, setRunning, addResult, setCurrentSubdivision, reset } =
    useRhythmStore()
  const { bpm } = useMetronomeStore()

  const pattern = RHYTHM_PATTERNS[selectedPatternIndex]

  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const schedulerRef = useRef<number | null>(null)
  const onsetDetectorRef = useRef<number | null>(null)
  const lastOnsetRef = useRef(0)
  const wasAboveRef = useRef(false)

  const nextNoteTimeRef = useRef(0)
  const currentSubRef = useRef(0)
  const beatTimesRef = useRef<{ time: number; isHit: boolean }[]>([])

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext({ sampleRate: 48000 })
    }
    return ctxRef.current
  }, [])

  const scheduleClick = useCallback(
    (time: number, type: 'downbeat' | 'beat' | 'hit') => {
      const ctx = getContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'downbeat') {
        osc.frequency.value = 1200
        gain.gain.setValueAtTime(0.7, time)
      } else if (type === 'beat') {
        osc.frequency.value = 900
        gain.gain.setValueAtTime(0.4, time)
      } else {
        osc.frequency.value = 600
        gain.gain.setValueAtTime(0.25, time)
      }
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
      osc.start(time)
      osc.stop(time + 0.05)
    },
    [getContext]
  )

  const start = useCallback(async () => {
    reset()

    const engine = getEngine()
    if (!engine) return

    const audioCtx = engine.getContext()
    const pipeline = engine.getPipeline()
    if (!audioCtx || !pipeline) return

    const metCtx = getContext()
    if (metCtx.state === 'suspended') await metCtx.resume()

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    pipeline.getMasterGainNode().connect(analyser)
    analyserRef.current = analyser

    const secondsPerSubdivision = 60 / bpm / pattern.subdivisions
    currentSubRef.current = 0
    nextNoteTimeRef.current = metCtx.currentTime + 0.1
    beatTimesRef.current = []

    const scheduler = () => {
      while (nextNoteTimeRef.current < metCtx.currentTime + SCHEDULE_AHEAD) {
        const sub = currentSubRef.current
        const posInPattern = sub % pattern.hits.length
        const isFirstBeat = posInPattern === 0
        const isOnBeat = posInPattern % pattern.subdivisions === 0
        const isHit = pattern.hits[posInPattern]

        if (isHit) {
          const clickType = isFirstBeat ? 'downbeat' : isOnBeat ? 'beat' : 'hit'
          scheduleClick(nextNoteTimeRef.current, clickType)
        }

        beatTimesRef.current.push({ time: nextNoteTimeRef.current, isHit })
        setCurrentSubdivision(posInPattern)

        currentSubRef.current++
        nextNoteTimeRef.current += secondsPerSubdivision
      }
    }

    schedulerRef.current = window.setInterval(scheduler, LOOKAHEAD_MS)

    const timeDomainData = new Float32Array(analyser.fftSize)
    const detectOnsets = () => {
      analyser.getFloatTimeDomainData(timeDomainData)

      let rms = 0
      for (let i = 0; i < timeDomainData.length; i++) {
        rms += timeDomainData[i] * timeDomainData[i]
      }
      rms = Math.sqrt(rms / timeDomainData.length)

      const now = metCtx.currentTime
      const nowMs = now * 1000

      if (rms > ONSET_THRESHOLD && !wasAboveRef.current) {
        if (nowMs - lastOnsetRef.current > DEAD_ZONE_MS) {
          lastOnsetRef.current = nowMs

          const pendingHits = beatTimesRef.current.filter((b) => b.isHit)
          if (pendingHits.length > 0) {
            let closest = pendingHits[0]
            let minDist = Math.abs(now - closest.time)
            for (const b of pendingHits) {
              const dist = Math.abs(now - b.time)
              if (dist < minDist) {
                minDist = dist
                closest = b
              }
            }

            const deltaMs = (now - closest.time) * 1000
            if (Math.abs(deltaMs) < 500) {
              addResult({
                expectedTime: closest.time,
                actualTime: now,
                deltaMs
              })
              beatTimesRef.current = beatTimesRef.current.filter((b) => b !== closest)
            }
          }
        }
      }

      wasAboveRef.current = rms > ONSET_THRESHOLD
    }

    onsetDetectorRef.current = window.setInterval(detectOnsets, 10)
    setRunning(true)
  }, [bpm, pattern, getContext, scheduleClick, reset, setRunning, addResult, setCurrentSubdivision])

  const stop = useCallback(() => {
    if (schedulerRef.current !== null) {
      clearInterval(schedulerRef.current)
      schedulerRef.current = null
    }
    if (onsetDetectorRef.current !== null) {
      clearInterval(onsetDetectorRef.current)
      onsetDetectorRef.current = null
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch {
        /* */
      }
      analyserRef.current = null
    }
    setRunning(false)
  }, [setRunning])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { start, stop, isRunning, isConnected }
}
