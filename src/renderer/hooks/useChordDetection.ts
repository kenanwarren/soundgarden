import { useRef, useCallback, useEffect } from 'react'
import { useChordStore } from '../stores/chord-store'
import { useAudioStore } from '../stores/audio-store'
import { getEngine } from './useAudioEngine'
import { detectChord } from '../utils/chord-detection'

export function useChordDetection() {
  const isConnected = useAudioStore((s) => s.isConnected)
  const isActive = useChordStore((s) => s.isActive)

  const analyserRef = useRef<AnalyserNode | null>(null)
  const intervalRef = useRef<number | null>(null)
  const pendingChordRef = useRef<string | null>(null)
  const pendingCountRef = useRef(0)

  const start = useCallback(() => {
    const engine = getEngine()
    if (!engine) return

    const ctx = engine.getContext()
    const pipeline = engine.getPipeline()
    if (!ctx || !pipeline) return

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }
    if (analyserRef.current) {
      try { analyserRef.current.disconnect() } catch { /* */ }
    }

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 8192
    analyser.smoothingTimeConstant = 0.8
    analyserRef.current = analyser

    // Connect analyser after the master gain so we analyze the actual output signal
    pipeline.getMasterGainNode().connect(analyser)

    const freqData = new Float32Array(analyser.frequencyBinCount)
    const chromagram = new Float32Array(12)
    const binFreq = ctx.sampleRate / analyser.fftSize

    intervalRef.current = window.setInterval(() => {
      analyser.getFloatFrequencyData(freqData)

      // Find peak dB for diagnostics
      let peakDb = -Infinity
      for (let i = 0; i < freqData.length; i++) {
        if (freqData[i] > peakDb) peakDb = freqData[i]
      }

      chromagram.fill(0)

      for (let i = 1; i < freqData.length; i++) {
        const freq = i * binFreq
        if (freq < 60 || freq > 2000) continue
        const db = freqData[i]
        if (db < -80) continue
        const energy = Math.pow(10, db / 20)
        const semitones = 12 * Math.log2(freq / 16.35)
        const pitchClass = Math.round(semitones) % 12
        chromagram[((pitchClass % 12) + 12) % 12] += energy
      }

      const candidate = detectChord(chromagram)
      const candidateName = candidate?.name ?? null
      const currentName = useChordStore.getState().currentChord?.name ?? null

      if (candidateName === currentName) {
        pendingChordRef.current = null
        pendingCountRef.current = 0
      } else if (candidateName === pendingChordRef.current) {
        pendingCountRef.current++
      } else {
        pendingChordRef.current = candidateName
        pendingCountRef.current = 1
      }

      const SWITCH_THRESHOLD = 3
      const store = useChordStore.getState()
      store.tick(peakDb)
      store.setChromagram(new Float32Array(chromagram))
      if (pendingCountRef.current >= SWITCH_THRESHOLD) {
        store.setChord(candidate)
        pendingChordRef.current = null
        pendingCountRef.current = 0
      }
    }, 80)

    useChordStore.getState().setActive(true)
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (analyserRef.current) {
      try { analyserRef.current.disconnect() } catch { /* */ }
      analyserRef.current = null
    }

    const store = useChordStore.getState()
    store.setActive(false)
    store.setChord(null)
  }, [])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { isActive, start, stop, isConnected }
}
