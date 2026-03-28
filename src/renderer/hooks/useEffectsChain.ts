import { useEffect, useRef } from 'react'
import { useEffectsStore, type EffectConfig } from '../stores/effects-store'
import { getEngine } from './useAudioEngine'
import { useAudioStore } from '../stores/audio-store'
import type { EffectNode } from '../audio/pipeline'
import type { ManagedEffect } from '../audio/effects/types'
import { createManagedEffect, updateEffectParams } from '../audio/effects/factory'
import { WORKLET_URLS } from '../audio/worklet-urls'
import { useUiStore } from '../stores/ui-store'

export function useEffectsChain() {
  const chain = useEffectsStore((s) => s.chain)
  const isConnected = useAudioStore((s) => s.isConnected)
  const managedRef = useRef<Map<string, ManagedEffect>>(new Map())
  const workletLoadedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isConnected) return

    const engine = getEngine()
    if (!engine) return

    const ctx = engine.getContext()
    const pipeline = engine.getPipeline()
    if (!ctx || !pipeline) return

    const sync = async () => {
      for (const effect of chain) {
        const url = WORKLET_URLS[effect.type]
        if (url && !workletLoadedRef.current.has(effect.type)) {
          try {
            await ctx.audioWorklet.addModule(url)
            workletLoadedRef.current.add(effect.type)
          } catch (err) {
            useUiStore.getState().pushNotice({
              tone: 'error',
              title: `Failed to load ${effect.type} worklet`
            })
          }
        }
      }

      const disposedIds = new Set<string>()
      for (const [id, managed] of managedRef.current) {
        if (!chain.find((e) => e.id === id)) {
          managed.dispose()
          managedRef.current.delete(id)
          disposedIds.add(id)
        }
      }

      for (const effect of chain) {
        if (!managedRef.current.has(effect.id)) {
          try {
            const managed = createManagedEffect(ctx, effect)
            if (managed) {
              managedRef.current.set(effect.id, managed)
            }
          } catch (err) {
            useUiStore.getState().pushNotice({
              tone: 'error',
              title: `Failed to create ${effect.type} effect`
            })
          }
        }

        const managed = managedRef.current.get(effect.id)
        if (managed) {
          managed.config = { ...effect }
          managed.pipelineNode.enabled = effect.enabled
          updateEffectParams(managed, effect, ctx)
        }
      }

      const existingNodes = pipeline.getEffectNodes()
      const unmanagedNodes = existingNodes.filter(
        (n) => !managedRef.current.has(n.id) && !disposedIds.has(n.id)
      )

      const pipelineNodes: EffectNode[] = [...unmanagedNodes]
      for (const effect of chain) {
        const managed = managedRef.current.get(effect.id)
        if (managed) {
          pipelineNodes.push(managed.pipelineNode)
        }
      }

      pipeline.setEffectNodes(pipelineNodes)
    }

    sync()
  }, [chain, isConnected])

  useEffect(() => {
    const managedEffects = managedRef.current
    return () => {
      for (const managed of managedEffects.values()) {
        managed.dispose()
      }
      managedEffects.clear()
    }
  }, [])

  const loadNamModel = (
    effectId: string,
    modelData: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const managed = managedRef.current.get(effectId)
      if (!managed || managed.config.type !== 'nam') {
        resolve({ success: false, error: 'Effect not found' })
        return
      }
      const node = managed.internals.node as AudioWorkletNode

      const timeout = setTimeout(() => {
        node.port.removeEventListener('message', handleMessage)
        resolve({ success: false, error: 'Timeout loading model' })
      }, 10000)

      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'modelLoaded' || e.data.type === 'modelError') {
          clearTimeout(timeout)
          node.port.removeEventListener('message', handleMessage)
          resolve({ success: e.data.success ?? false, error: e.data.error })
        }
      }

      node.port.addEventListener('message', handleMessage)
      node.port.postMessage({ type: 'loadModel', modelData })
    })
  }

  const loadCabinetIR = async (
    effectId: string,
    audioData: ArrayBuffer
  ): Promise<{ success: boolean; error?: string }> => {
    const managed = managedRef.current.get(effectId)
    if (!managed || managed.config.type !== 'cabinet') {
      return { success: false, error: 'Effect not found' }
    }
    const engine = getEngine()
    const ctx = engine?.getContext()
    if (!ctx) return { success: false, error: 'No audio context' }

    try {
      const buffer = await ctx.decodeAudioData(audioData)
      const convolver = managed.internals.convolver as ConvolverNode
      convolver.buffer = buffer
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  const sendLooperCommand = (effectId: string, command: string) => {
    const managed = managedRef.current.get(effectId)
    if (!managed || managed.config.type !== 'looper') return
    const node = managed.internals.node as AudioWorkletNode
    node.port.postMessage({ type: command })
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
