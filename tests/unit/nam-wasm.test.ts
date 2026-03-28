import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

function fastTanh(x: number): number {
  if (x > 4.97) return 1.0
  if (x < -4.97) return -1.0
  const x2 = x * x
  return (x * (27.0 + x2)) / (27.0 + 9.0 * x2)
}

function fastSigmoid(x: number): number {
  const hx = x * 0.5
  if (hx > 4.97) return 1.0
  if (hx < -4.97) return 0.0
  const x2 = hx * hx
  return 0.5 + (0.5 * hx * (27.0 + x2)) / (27.0 + 9.0 * x2)
}

function nextPow2(v: number): number {
  v--
  v |= v >> 1
  v |= v >> 2
  v |= v >> 4
  v |= v >> 8
  v |= v >> 16
  return v + 1
}

function jsWaveNetForward(
  config: any,
  weights: number[],
  conditionValue: number,
  headScale: number,
  inBuf: Float32Array,
  numFrames: number,
  inGain: number,
  outGain: number
): Float32Array {
  const outBuf = new Float32Array(numFrames)
  let pos = 0
  function take(n: number) {
    const a = new Float32Array(n)
    for (let i = 0; i < n; i++) a[i] = weights[pos++]
    return a
  }

  const blockConfigs = config.layers || []
  const blocks: any[] = []
  for (let b = 0; b < blockConfigs.length; b++) {
    const bc = blockConfigs[b]
    const inSize = bc.input_size || 1,
      ch = bc.channels || 16,
      ks = bc.kernel_size || 3
    const dilations: number[] = bc.dilations || [],
      headSize = bc.head_size || 1
    const gated = bc.gated || false,
      headBias = bc.head_bias || false
    const condSize = bc.condition_size || 0,
      co = gated ? 2 * ch : ch

    const rechannelW = take(inSize * ch)
    const layers: any[] = []
    for (let l = 0; l < dilations.length; l++) {
      const d = dilations[l],
        bs = d * (ks - 1) + 1
      const bsPow2 = nextPow2(bs),
        bMask = bsPow2 - 1
      const cW = take(ch * co * ks),
        cB = take(co)
      const condW = condSize > 0 ? take(condSize * co) : null
      const mW = take(ch * ch),
        mB = take(ch)

      const flatKernel = new Float32Array(ks * co * ch)
      for (let k = 0; k < ks; k++) {
        for (let o = 0; o < co; o++) {
          const srcBase = o * ch * ks,
            dstBase = k * co * ch + o * ch
          for (let c = 0; c < ch; c++) flatKernel[dstBase + c] = cW[srcBase + c * ks + k]
        }
      }

      let bias: Float32Array
      if (condW && condSize > 0) {
        bias = new Float32Array(co)
        if (condSize === 1) {
          for (let o = 0; o < co; o++) bias[o] = cB[o] + condW[o] * conditionValue
        } else {
          for (let o = 0; o < co; o++) {
            let v = cB[o]
            for (let ci = 0; ci < condSize; ci++) v += condW[ci * co + o] * conditionValue
            bias[o] = v
          }
        }
      } else {
        bias = cB
      }

      const tapDilations = new Int32Array(ks)
      for (let k = 0; k < ks; k++) tapDilations[k] = d * (ks - 1 - k)

      layers.push({
        bias,
        mW,
        mB,
        buf: new Float32Array(bsPow2 * ch),
        bi: 0,
        bMask,
        ks,
        ch,
        co,
        flatKernel,
        tapDilations
      })
    }
    const hW = take(ch * headSize),
      hB = headBias ? take(headSize) : null
    blocks.push({
      inSize,
      ch,
      co,
      ks,
      gated,
      hs: headSize,
      rW: rechannelW,
      layers,
      hW,
      hB,
      x: new Float32Array(ch),
      cv: new Float32Array(co)
    })
  }

  for (let i = 0; i < numFrames; i++) {
    let sample = inBuf[i] * inGain
    let ph: Float32Array | null = null
    for (let b = 0; b < blocks.length; b++) {
      const bl = blocks[b],
        ch = bl.ch,
        co = bl.co,
        x = bl.x,
        cv = bl.cv,
        rW = bl.rW
      if (bl.inSize === 1) {
        for (let c = 0; c < ch; c++) x[c] = sample * rW[c]
      } else {
        for (let c = 0; c < ch; c++) {
          let v = 0
          const rwBase = c * bl.inSize
          for (let j = 0; j < bl.inSize; j++) v += ph![j] * rW[rwBase + j]
          x[c] = v
        }
      }
      for (let l = 0; l < bl.layers.length; l++) {
        const ly = bl.layers[l],
          bi = ly.bi,
          buf = ly.buf,
          frameBase = bi * ch
        const bias = ly.bias,
          mW = ly.mW,
          mB = ly.mB
        const lks = ly.ks,
          lco = ly.co,
          fk = ly.flatKernel,
          bMask = ly.bMask

        for (let c = 0; c < ch; c++) buf[frameBase + c] = x[c]
        for (let o = 0; o < lco; o++) cv[o] = bias[o]

        for (let k = 0; k < lks; k++) {
          const bO = ((bi - ly.tapDilations[k]) & bMask) * ch
          const fkBase = k * lco * ch
          for (let o = 0; o < lco; o++) {
            let sum = 0
            const kwOff = fkBase + o * ch
            for (let c = 0; c < ch; c++) sum += fk[kwOff + c] * buf[bO + c]
            cv[o] += sum
          }
        }

        if (bl.gated) {
          for (let c = 0; c < ch; c++) cv[c] = fastTanh(cv[c]) * fastSigmoid(cv[c + ch])
        } else {
          for (let c = 0; c < lco; c++) cv[c] = fastTanh(cv[c])
        }

        for (let o = 0; o < ch; o++) {
          let v = mB[o]
          const mBase = o * ch
          for (let c = 0; c < ch; c++) v += mW[mBase + c] * cv[c]
          x[o] = v + buf[frameBase + o]
        }
        ly.bi = (bi + 1) & bMask
      }
      ph = x
      if (bl.hs === 1) {
        let v = bl.hB ? bl.hB[0] : 0
        for (let c = 0; c < ch; c++) v += bl.hW[c] * x[c]
        sample = v
      }
    }
    const s = sample * headScale * outGain
    outBuf[i] = s !== s ? 0 : s
  }
  return outBuf
}

function generateSyntheticWeights(config: any): number[] {
  const weights: number[] = []
  const rng = { seed: 42 }
  function rand() {
    rng.seed = (rng.seed * 1103515245 + 12345) & 0x7fffffff
    return (rng.seed / 0x7fffffff - 0.5) * 0.2
  }

  for (const bc of config.layers) {
    const ch = bc.channels || 16,
      ks = bc.kernel_size || 3
    const dilations: number[] = bc.dilations || []
    const gated = bc.gated || false,
      headBias = bc.head_bias || false
    const condSize = bc.condition_size || 0
    const co = gated ? 2 * ch : ch

    for (let i = 0; i < (bc.input_size || 1) * ch; i++) weights.push(rand())
    for (let l = 0; l < dilations.length; l++) {
      for (let i = 0; i < ch * co * ks; i++) weights.push(rand())
      for (let i = 0; i < co; i++) weights.push(rand())
      if (condSize > 0) for (let i = 0; i < condSize * co; i++) weights.push(rand())
      for (let i = 0; i < ch * ch; i++) weights.push(rand())
      for (let i = 0; i < ch; i++) weights.push(rand())
    }
    for (let i = 0; i < ch * (bc.head_size || 1); i++) weights.push(rand())
    if (headBias) for (let i = 0; i < (bc.head_size || 1); i++) weights.push(rand())
  }
  weights.push(1.0) // headScale
  return weights
}

async function loadWasm() {
  const wasmPath = join(__dirname, '../../src/renderer/audio/wasm/nam-kernel.wasm')
  const buf = readFileSync(wasmPath)
  const result = await WebAssembly.instantiate(buf, {
    env: { emscripten_notify_memory_growth: () => {} }
  })
  const exports = result.instance.exports as any
  if (exports._initialize) exports._initialize()
  return { exports, memory: exports.memory as WebAssembly.Memory }
}

async function wasmWaveNetForward(
  config: any,
  weights: number[],
  conditionValue: number,
  headScale: number,
  inBuf: Float32Array,
  numFrames: number,
  inGain: number,
  outGain: number
): Promise<Float32Array> {
  const { exports, memory } = await loadWasm()

  const blockConfigs = config.layers || []
  const numBlocks = blockConfigs.length

  const blockInfoPtr = exports.malloc(numBlocks * 7 * 4)
  const blockInfoView = new Int32Array(memory.buffer, blockInfoPtr, numBlocks * 7)
  for (let b = 0; b < numBlocks; b++) {
    const bc = blockConfigs[b]
    blockInfoView[b * 7 + 0] = bc.input_size || 1
    blockInfoView[b * 7 + 1] = bc.channels || 16
    blockInfoView[b * 7 + 2] = bc.kernel_size || 3
    blockInfoView[b * 7 + 3] = (bc.dilations || []).length
    blockInfoView[b * 7 + 4] = bc.head_size || 1
    blockInfoView[b * 7 + 5] = bc.gated || false ? 1 : 0
    blockInfoView[b * 7 + 6] = bc.head_bias ? 1 : 0
  }

  let dilationsTotal = 0
  for (const bc of blockConfigs) dilationsTotal += (bc.dilations || []).length
  const dilationsPtr = exports.malloc(dilationsTotal * 4)
  const dilationsView = new Int32Array(memory.buffer, dilationsPtr, dilationsTotal)
  let di = 0
  for (const bc of blockConfigs) {
    for (const d of bc.dilations || []) dilationsView[di++] = d
  }

  const condSizesPtr = exports.malloc(numBlocks * 4)
  const condSizesView = new Int32Array(memory.buffer, condSizesPtr, numBlocks)
  for (let b = 0; b < numBlocks; b++) condSizesView[b] = blockConfigs[b].condition_size || 0

  const weightsPtr = exports.malloc(weights.length * 4)
  new Float32Array(memory.buffer, weightsPtr, weights.length).set(weights)

  const modelPtr = exports.init_wavenet(
    blockInfoPtr,
    numBlocks,
    dilationsPtr,
    condSizesPtr,
    weightsPtr,
    weights.length,
    conditionValue,
    headScale
  )

  exports.free(blockInfoPtr)
  exports.free(dilationsPtr)
  exports.free(condSizesPtr)
  exports.free(weightsPtr)

  const inPtr = exports.malloc(numFrames * 4)
  const outPtr = exports.malloc(numFrames * 4)
  new Float32Array(memory.buffer, inPtr, numFrames).set(inBuf)

  exports.wavenet_forward(modelPtr, inPtr, outPtr, numFrames, inGain, outGain)

  const result = new Float32Array(numFrames)
  result.set(new Float32Array(memory.buffer, outPtr, numFrames))

  exports.free(inPtr)
  exports.free(outPtr)
  exports.free_model(modelPtr)

  return result
}

describe('NAM WASM kernel', () => {
  const config = {
    layers: [
      {
        input_size: 1,
        channels: 4,
        kernel_size: 3,
        dilations: [1, 2, 4],
        head_size: 1,
        gated: false,
        head_bias: true,
        condition_size: 0
      }
    ]
  }

  const gatedConfig = {
    layers: [
      {
        input_size: 1,
        channels: 4,
        kernel_size: 3,
        dilations: [1, 2],
        head_size: 1,
        gated: true,
        head_bias: false,
        condition_size: 0
      }
    ]
  }

  it('WASM WaveNet matches JS WaveNet for simple config', async () => {
    const weights = generateSyntheticWeights(config)
    const numFrames = 128
    const inBuf = new Float32Array(numFrames)
    for (let i = 0; i < numFrames; i++) inBuf[i] = Math.sin(i * 0.1) * 0.5

    const jsOut = jsWaveNetForward(config, weights, 0, 1.0, inBuf, numFrames, 1.0, 1.0)
    const wasmOut = await wasmWaveNetForward(config, weights, 0, 1.0, inBuf, numFrames, 1.0, 1.0)

    let maxError = 0
    for (let i = 0; i < numFrames; i++) {
      const err = Math.abs(jsOut[i] - wasmOut[i])
      if (err > maxError) maxError = err
    }

    console.log(`Max absolute error: ${maxError.toExponential(3)}`)
    console.log(
      `JS output range: [${Math.min(...jsOut).toFixed(6)}, ${Math.max(...jsOut).toFixed(6)}]`
    )
    console.log(
      `WASM output range: [${Math.min(...wasmOut).toFixed(6)}, ${Math.max(...wasmOut).toFixed(6)}]`
    )

    expect(maxError).toBeLessThan(1e-4)
  })

  it('WASM WaveNet matches JS WaveNet for gated config', async () => {
    const weights = generateSyntheticWeights(gatedConfig)
    const numFrames = 64
    const inBuf = new Float32Array(numFrames)
    for (let i = 0; i < numFrames; i++) inBuf[i] = Math.sin(i * 0.2) * 0.3

    const jsOut = jsWaveNetForward(gatedConfig, weights, 0, 1.0, inBuf, numFrames, 1.0, 1.0)
    const wasmOut = await wasmWaveNetForward(
      gatedConfig,
      weights,
      0,
      1.0,
      inBuf,
      numFrames,
      1.0,
      1.0
    )

    let maxError = 0
    for (let i = 0; i < numFrames; i++) {
      const err = Math.abs(jsOut[i] - wasmOut[i])
      if (err > maxError) maxError = err
    }

    console.log(`Gated max absolute error: ${maxError.toExponential(3)}`)
    expect(maxError).toBeLessThan(1e-4)
  })

  it('WASM WaveNet handles gain scaling', async () => {
    const weights = generateSyntheticWeights(config)
    const numFrames = 32
    const inBuf = new Float32Array(numFrames)
    for (let i = 0; i < numFrames; i++) inBuf[i] = Math.sin(i * 0.3) * 0.1

    const jsOut = jsWaveNetForward(config, weights, 0, 1.0, inBuf, numFrames, 2.0, 0.5)
    const wasmOut = await wasmWaveNetForward(config, weights, 0, 1.0, inBuf, numFrames, 2.0, 0.5)

    let maxError = 0
    for (let i = 0; i < numFrames; i++) {
      const err = Math.abs(jsOut[i] - wasmOut[i])
      if (err > maxError) maxError = err
    }

    expect(maxError).toBeLessThan(1e-4)
  })

  it('produces non-zero output for non-zero input', async () => {
    const weights = generateSyntheticWeights(config)
    const numFrames = 128
    const inBuf = new Float32Array(numFrames)
    for (let i = 0; i < numFrames; i++) inBuf[i] = Math.sin(i * 0.1) * 0.5

    const wasmOut = await wasmWaveNetForward(config, weights, 0, 1.0, inBuf, numFrames, 1.0, 1.0)
    const hasNonZero = wasmOut.some((v) => Math.abs(v) > 1e-10)
    expect(hasNonZero).toBe(true)
  })
})
