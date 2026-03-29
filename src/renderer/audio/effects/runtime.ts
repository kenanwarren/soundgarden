import type { AudioProcessorType } from '../types'
import { getEffectDefinition } from '../../effects/definitions'
import type { EffectConfig } from '../../stores/effects-store'
import type { EffectNode } from '../pipeline'
import type { ManagedEffect } from './types'
import { createManagedEffect, updateEffectParams } from './factory'
import { useUiStore } from '../../stores/ui-store'

export class EffectRackRuntime {
  private readonly managedEffects = new Map<string, ManagedEffect>()
  private readonly loadedWorklets = new Set<AudioProcessorType>()

  async sync(
    ctx: AudioContext,
    pipeline: { getEffectNodes(): EffectNode[]; setEffectNodes(nodes: EffectNode[]): void },
    chain: EffectConfig[]
  ): Promise<void> {
    for (const effect of chain) {
      const definition = getEffectDefinition(effect.type)
      if (definition.workletUrl && !this.loadedWorklets.has(effect.type)) {
        try {
          await ctx.audioWorklet.addModule(definition.workletUrl)
          this.loadedWorklets.add(effect.type)
        } catch (err) {
          useUiStore.getState().pushNotice({
            tone: 'error',
            title: `Failed to load ${effect.type} worklet`,
            description: String(err)
          })
        }
      }
    }

    const disposedIds = new Set<string>()
    for (const [id, managed] of this.managedEffects) {
      if (!chain.find((effect) => effect.id === id)) {
        managed.dispose()
        this.managedEffects.delete(id)
        disposedIds.add(id)
      }
    }

    for (const effect of chain) {
      if (!this.managedEffects.has(effect.id)) {
        try {
          const managed = createManagedEffect(ctx, effect)
          if (managed) {
            this.managedEffects.set(effect.id, managed)
          }
        } catch (err) {
          useUiStore.getState().pushNotice({
            tone: 'error',
            title: `Failed to create ${effect.type} effect`,
            description: String(err)
          })
        }
      }

      const managed = this.managedEffects.get(effect.id)
      if (!managed) continue

      managed.config = { ...effect }
      managed.pipelineNode.enabled = effect.enabled
      updateEffectParams(managed, effect, ctx)
    }

    const existingNodes = pipeline.getEffectNodes()
    const unmanagedNodes = existingNodes.filter(
      (node): node is EffectNode => !this.managedEffects.has(node.id) && !disposedIds.has(node.id)
    )

    const pipelineNodes: EffectNode[] = [...unmanagedNodes]
    for (const effect of chain) {
      const managed = this.managedEffects.get(effect.id)
      if (managed) {
        pipelineNodes.push(managed.pipelineNode)
      }
    }

    pipeline.setEffectNodes(pipelineNodes)
  }

  dispose(): void {
    for (const managed of this.managedEffects.values()) {
      managed.dispose()
    }
    this.managedEffects.clear()
  }

  loadNamModel(
    effectId: string,
    modelData: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const managed = this.managedEffects.get(effectId)
      if (!managed || managed.config.type !== 'nam') {
        resolve({ success: false, error: 'Effect not found' })
        return
      }

      const node = managed.internals.node as AudioWorkletNode
      const timeout = setTimeout(() => {
        node.port.removeEventListener('message', handleMessage)
        resolve({ success: false, error: 'Timeout loading model' })
      }, 10000)

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'modelLoaded' || event.data.type === 'modelError') {
          clearTimeout(timeout)
          node.port.removeEventListener('message', handleMessage)
          resolve({ success: event.data.success ?? false, error: event.data.error })
        }
      }

      node.port.addEventListener('message', handleMessage)
      node.port.postMessage({ type: 'loadModel', modelData })
    })
  }

  async loadCabinetIR(
    effectId: string,
    audioData: ArrayBuffer,
    ctx: AudioContext
  ): Promise<{ success: boolean; error?: string }> {
    const managed = this.managedEffects.get(effectId)
    if (!managed || managed.config.type !== 'cabinet') {
      return { success: false, error: 'Effect not found' }
    }

    try {
      const buffer = await ctx.decodeAudioData(audioData)
      const convolver = managed.internals.convolver as ConvolverNode
      convolver.buffer = buffer
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  sendLooperCommand(effectId: string, command: string): void {
    const managed = this.managedEffects.get(effectId)
    if (!managed || managed.config.type !== 'looper') return
    const node = managed.internals.node as AudioWorkletNode
    node.port.postMessage({ type: command })
  }
}
