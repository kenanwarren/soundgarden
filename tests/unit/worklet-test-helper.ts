import { readFileSync } from 'fs'
import { join } from 'path'

const SAMPLE_RATE = 48000
const BLOCK_SIZE = 128

let registeredProcessors: Map<string, any> = new Map()

function setupWorkletGlobals() {
  ;(globalThis as any).sampleRate = SAMPLE_RATE
  ;(globalThis as any).AudioWorkletProcessor = class AudioWorkletProcessor {
    port: { postMessage: (msg: any) => void; onmessage: ((e: any) => void) | null }
    constructor() {
      this.port = { postMessage: () => {}, onmessage: null }
    }
    static get parameterDescriptors(): any[] {
      return []
    }
  }
  ;(globalThis as any).registerProcessor = (name: string, cls: any) => {
    registeredProcessors.set(name, cls)
  }
}

function cleanupWorkletGlobals() {
  delete (globalThis as any).sampleRate
  delete (globalThis as any).AudioWorkletProcessor
  delete (globalThis as any).registerProcessor
  registeredProcessors.clear()
}

export function loadProcessor(filename: string): any {
  setupWorkletGlobals()
  registeredProcessors.clear()
  const path = join(__dirname, '../../src/renderer/audio/nodes', filename)
  const code = readFileSync(path, 'utf-8')
  const fn = new Function('sampleRate', 'AudioWorkletProcessor', 'registerProcessor', code)
  fn(SAMPLE_RATE, (globalThis as any).AudioWorkletProcessor, (globalThis as any).registerProcessor)
  const entries = [...registeredProcessors.entries()]
  cleanupWorkletGlobals()
  if (entries.length === 0) throw new Error(`No processor registered in ${filename}`)
  return new entries[0][1]()
}

export function makeInput(channels: number, length = BLOCK_SIZE): Float32Array[] {
  return Array.from({ length: channels }, () => new Float32Array(length))
}

export function makeOutput(channels: number, length = BLOCK_SIZE): Float32Array[] {
  return Array.from({ length: channels }, () => new Float32Array(length))
}

export function makeParams(values: Record<string, number>): Record<string, Float32Array> {
  const result: Record<string, Float32Array> = {}
  for (const [k, v] of Object.entries(values)) {
    result[k] = new Float32Array([v])
  }
  return result
}

export function fillSine(
  buf: Float32Array,
  freq: number,
  amplitude = 0.5,
  sampleRate = SAMPLE_RATE
): void {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate)
  }
}

export function fillSineBlocks(
  buf: Float32Array,
  freq: number,
  amplitude = 0.5,
  startSample = 0,
  sr = SAMPLE_RATE
): void {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = amplitude * Math.sin((2 * Math.PI * freq * (startSample + i)) / sr)
  }
}

export function rms(buf: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  return Math.sqrt(sum / buf.length)
}

export function peak(buf: Float32Array): number {
  let max = 0
  for (let i = 0; i < buf.length; i++) {
    const abs = Math.abs(buf[i])
    if (abs > max) max = abs
  }
  return max
}

export function processBlocks(
  processor: any,
  input: Float32Array[],
  output: Float32Array[],
  params: Record<string, Float32Array>,
  blocks: number
): void {
  const blockSize = input[0].length
  for (let b = 0; b < blocks; b++) {
    processor.process([input], [output], params)
  }
}

export { SAMPLE_RATE, BLOCK_SIZE }
