import type { EffectConfig } from '../../stores/effects-store'
import type { ManagedEffect } from './types'
import { WORKLET_NAMES, namWasmUrl } from '../worklet-urls'

let namWasmBytesCache: ArrayBuffer | null = null

async function fetchNamWasmBytes(): Promise<ArrayBuffer | null> {
  if (namWasmBytesCache) return namWasmBytesCache
  try {
    const resp = await fetch(namWasmUrl)
    namWasmBytesCache = await resp.arrayBuffer()
    return namWasmBytesCache
  } catch (err) {
    console.warn('Failed to fetch NAM WASM module:', err)
    return null
  }
}

export function createWorkletEffect(ctx: AudioContext, config: EffectConfig): ManagedEffect {
  const node = new AudioWorkletNode(ctx, WORKLET_NAMES[config.type])
  if (config.type === 'nam') {
    node.port.addEventListener('message', (e: MessageEvent) => {
      if (e.data?.type === 'modelError') {
        console.error('NAM model runtime error:', e.data.error)
      }
    })
    node.port.start()
    fetchNamWasmBytes().then((bytes) => {
      if (bytes) node.port.postMessage({ type: 'initWasm', wasmBytes: bytes })
    })
  }
  if (config.type === 'looper') {
    node.port.start()
  }

  return {
    config,
    pipelineNode: {
      id: config.id,
      enabled: config.enabled,
      getInput: () => node,
      getOutput: () => node
    },
    internals: { node },
    dispose: () => node.disconnect()
  }
}

export function updateWorkletParams(managed: ManagedEffect, config: EffectConfig, t: number): void {
  if (config.type === 'nam') {
    const node = managed.internals.node as AudioWorkletNode
    for (const [name, value] of Object.entries(config.params)) {
      node.port.postMessage({ type: 'setParam', name, value })
    }
    return
  }

  const node = managed.internals.node as AudioWorkletNode
  for (const [param, value] of Object.entries(config.params)) {
    node.parameters.get(param)?.setTargetAtTime(value, t, 0.01)
  }
}
