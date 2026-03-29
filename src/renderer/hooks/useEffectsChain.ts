import { useEffect, useRef } from 'react'
import { useEffectsStore, type EffectConfig } from '../stores/effects-store'
import { getEngine } from './useAudioEngine'
import { useAudioStore } from '../stores/audio-store'
import { EffectRackRuntime } from '../audio/effects/runtime'

export function useEffectsChain() {
  const chain = useEffectsStore((s) => s.chain)
  const isConnected = useAudioStore((s) => s.isConnected)
  const runtimeRef = useRef<EffectRackRuntime | null>(null)

  if (runtimeRef.current === null) {
    runtimeRef.current = new EffectRackRuntime()
  }

  const runtime = runtimeRef.current

  useEffect(() => {
    if (!isConnected) return

    const engine = getEngine()
    if (!engine) return

    const ctx = engine.getContext()
    const pipeline = engine.getPipeline()
    if (!ctx || !pipeline) return

    void runtime.sync(ctx, pipeline, chain)
  }, [chain, isConnected, runtime])

  useEffect(() => {
    return () => {
      runtimeRef.current?.dispose()
    }
  }, [])

  const loadNamModel = (
    effectId: string,
    modelData: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> => {
    return runtime.loadNamModel(effectId, modelData)
  }

  const loadCabinetIR = async (
    effectId: string,
    audioData: ArrayBuffer
  ): Promise<{ success: boolean; error?: string }> => {
    const engine = getEngine()
    const ctx = engine?.getContext()
    if (!ctx) return { success: false, error: 'No audio context' }
    return runtime.loadCabinetIR(effectId, audioData, ctx)
  }

  const sendLooperCommand = (effectId: string, command: string) => {
    runtime.sendLooperCommand(effectId, command)
  }

  return {
    chain,
    addEffect: useEffectsStore.getState().addEffect,
    removeEffect: useEffectsStore.getState().removeEffect,
    toggleEffect: useEffectsStore.getState().toggleEffect,
    setParam: useEffectsStore.getState().setParam,
    reorderEffects: useEffectsStore.getState().reorderEffects,
    loadNamModel,
    loadCabinetIR,
    sendLooperCommand
  }
}
