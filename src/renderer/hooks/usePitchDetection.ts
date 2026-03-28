import { useEffect, useRef, useCallback, useState } from 'react'
import { useAudioStore } from '../stores/audio-store'
import { frequencyToNote } from '../utils/note-utils'
import { getEngine } from './useAudioEngine'
import { safeDisconnect } from '../audio/safe-disconnect'

const MEDIAN_WINDOW = 5
const BUFFER_SIZE = 4096
const MIN_FREQUENCY = 60
const MAX_FREQUENCY = 1500
const RMS_THRESHOLD = 0.01
const CLARITY_THRESHOLD = 0.5
const MPM_PEAK_RATIO = 0.85
const ANALYSIS_INTERVAL_MS = 80

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function detectPitch(
  buffer: Float32Array,
  sampleRate: number
): { frequency: number; clarity: number } {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i]
  }
  if (Math.sqrt(sum / buffer.length) < RMS_THRESHOLD) {
    return { frequency: 0, clarity: 0 }
  }

  const minLag = Math.floor(sampleRate / MAX_FREQUENCY)
  const maxLag = Math.min(Math.ceil(sampleRate / MIN_FREQUENCY), buffer.length - 1)
  const lagRange = maxLag - minLag + 1
  const nsdf = new Float32Array(lagRange)

  for (let idx = 0; idx < lagRange; idx++) {
    const tau = minLag + idx
    let acf = 0
    let denomA = 0
    let denomB = 0
    const limit = buffer.length - tau
    for (let i = 0; i < limit; i++) {
      const a = buffer[i]
      const b = buffer[i + tau]
      acf += a * b
      denomA += a * a
      denomB += b * b
    }
    const denom = denomA + denomB
    nsdf[idx] = denom > 0 ? (2 * acf) / denom : 0
  }

  const peaks: { idx: number; value: number }[] = []
  let wasNegative = false
  let inPeak = false
  let peakIdx = 0
  let peakVal = 0

  for (let idx = 0; idx < lagRange; idx++) {
    const v = nsdf[idx]
    if (v < 0) {
      if (inPeak && peakVal > CLARITY_THRESHOLD) {
        peaks.push({ idx: peakIdx, value: peakVal })
      }
      wasNegative = true
      inPeak = false
      peakIdx = 0
      peakVal = 0
      continue
    }
    if (!wasNegative) continue
    inPeak = true
    if (v > peakVal) {
      peakVal = v
      peakIdx = idx
    }
  }
  if (inPeak && peakVal > CLARITY_THRESHOLD) {
    peaks.push({ idx: peakIdx, value: peakVal })
  }

  if (peaks.length === 0) return { frequency: 0, clarity: 0 }

  let globalMax = 0
  for (const p of peaks) {
    if (p.value > globalMax) globalMax = p.value
  }

  const threshold = MPM_PEAK_RATIO * globalMax
  let chosen: { idx: number; value: number } | null = null
  for (const p of peaks) {
    if (p.value >= threshold) {
      chosen = p
      break
    }
  }

  if (!chosen) return { frequency: 0, clarity: 0 }

  let refinedLag = minLag + chosen.idx
  if (chosen.idx > 0 && chosen.idx < lagRange - 1) {
    const a = nsdf[chosen.idx - 1]
    const b = nsdf[chosen.idx]
    const c = nsdf[chosen.idx + 1]
    const denom = 2 * (2 * b - a - c)
    if (Math.abs(denom) > 1e-10) {
      refinedLag += (a - c) / denom
    }
  }

  const frequency = sampleRate / refinedLag
  if (frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY) {
    return { frequency, clarity: chosen.value }
  }
  return { frequency: 0, clarity: 0 }
}

export interface PitchData {
  frequency: number
  note: string
  octave: number
  cents: number
  clarity: number
}

interface UsePitchDetectionOptions {
  id: string
  referenceA4?: number
  onPitch?: (data: PitchData) => void
}

export function usePitchDetection({ id, referenceA4 = 440, onPitch }: UsePitchDetectionOptions) {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const intervalRef = useRef<number | null>(null)
  const smoothedFreqRef = useRef(0)
  const recentFreqs = useRef<number[]>([])
  const onPitchRef = useRef(onPitch)
  const isConnected = useAudioStore((s) => s.isConnected)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    onPitchRef.current = onPitch
  }, [onPitch])

  const start = useCallback(async () => {
    const engine = getEngine()
    if (!engine) return

    const ctx = engine.getContext()
    const pipeline = engine.getPipeline()
    if (!ctx || !pipeline) return

    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    if (analyserRef.current) {
      safeDisconnect(analyserRef.current)
    }

    const analyser = ctx.createAnalyser()
    analyser.fftSize = BUFFER_SIZE * 2
    analyserRef.current = analyser

    pipeline.getMasterGainNode().connect(analyser)

    const timeDomainData = new Float32Array(BUFFER_SIZE)

    intervalRef.current = window.setInterval(() => {
      analyser.getFloatTimeDomainData(timeDomainData)

      const { frequency, clarity } = detectPitch(timeDomainData, ctx.sampleRate)

      if (frequency > 0 && clarity > CLARITY_THRESHOLD) {
        recentFreqs.current.push(frequency)
        if (recentFreqs.current.length > MEDIAN_WINDOW) {
          recentFreqs.current.shift()
        }

        const medianFreq = median(recentFreqs.current)
        const alpha = 0.3
        smoothedFreqRef.current =
          smoothedFreqRef.current === 0
            ? medianFreq
            : smoothedFreqRef.current * (1 - alpha) + medianFreq * alpha

        const noteInfo = frequencyToNote(smoothedFreqRef.current, referenceA4)
        onPitchRef.current?.({
          frequency: smoothedFreqRef.current,
          note: noteInfo.note,
          octave: noteInfo.octave,
          cents: noteInfo.cents,
          clarity
        })
      } else {
        recentFreqs.current = []
        smoothedFreqRef.current = 0
        onPitchRef.current?.({ frequency: 0, note: '-', octave: 0, cents: 0, clarity: 0 })
      }
    }, ANALYSIS_INTERVAL_MS)

    setIsActive(true)
  }, [referenceA4])

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (analyserRef.current) {
      safeDisconnect(analyserRef.current)
      analyserRef.current = null
    }

    setIsActive(false)
    smoothedFreqRef.current = 0
    recentFreqs.current = []
  }, [])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { isActive, start, stop, isConnected }
}
