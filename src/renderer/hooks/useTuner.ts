import { useEffect, useRef, useCallback } from 'react'
import { useTunerStore } from '../stores/tuner-store'
import { useAudioStore } from '../stores/audio-store'
import { frequencyToNote } from '../utils/note-utils'
import { getEngine } from './useAudioEngine'
import { tunerProcessorUrl } from '../audio/worklet-urls'
import type { EffectNode } from '../audio/pipeline'

const MEDIAN_WINDOW = 5

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function useTuner() {
  const tunerNodeRef = useRef<AudioWorkletNode | null>(null)
  const smoothedFreqRef = useRef(0)
  const recentFreqs = useRef<number[]>([])
  const isConnected = useAudioStore((s) => s.isConnected)
  const { isActive, referenceA4, setTunerData, setActive } = useTunerStore()

  const startTuner = useCallback(async () => {
    const engine = getEngine()
    if (!engine) return

    const ctx = engine.getContext()
    const pipeline = engine.getPipeline()
    if (!ctx || !pipeline) return

    try {
      await ctx.audioWorklet.addModule(tunerProcessorUrl)
    } catch {
      // Module may already be registered
    }

    const tunerNode = new AudioWorkletNode(ctx, 'tuner-processor')

    tunerNode.port.onmessage = (event) => {
      const { frequency, clarity } = event.data as { frequency: number; clarity: number }

      if (frequency > 0 && clarity > 0.5) {
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
        setTunerData(
          smoothedFreqRef.current,
          noteInfo.note,
          noteInfo.octave,
          noteInfo.cents,
          clarity
        )
      } else {
        recentFreqs.current = []
        smoothedFreqRef.current = 0
        setTunerData(0, '-', 0, 0, 0)
      }
    }

    // Wire tuner as a pass-through effect node in the pipeline
    const tunerEffectNode: EffectNode = {
      id: '__tuner__',
      enabled: true,
      getInput: () => tunerNode,
      getOutput: () => tunerNode
    }

    // Get existing effect nodes and prepend tuner (it should be first in chain)
    const currentEffects = pipeline.getEffectNodes()
    pipeline.setEffectNodes([tunerEffectNode, ...currentEffects])

    tunerNodeRef.current = tunerNode
    setActive(true)
  }, [referenceA4, setTunerData, setActive])

  const stopTuner = useCallback(() => {
    if (tunerNodeRef.current) {
      tunerNodeRef.current.disconnect()
      tunerNodeRef.current.port.close()
      tunerNodeRef.current = null
    }

    // Remove tuner from pipeline
    const engine = getEngine()
    const pipeline = engine?.getPipeline()
    if (pipeline) {
      const currentEffects = pipeline.getEffectNodes()
      pipeline.setEffectNodes(currentEffects.filter((e) => e.id !== '__tuner__'))
    }

    setActive(false)
    smoothedFreqRef.current = 0
    recentFreqs.current = []
  }, [setActive])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTuner()
    }
  }, [stopTuner])

  return {
    isActive,
    startTuner,
    stopTuner,
    isConnected
  }
}
