const DELAY_LENGTHS = [1087, 1423, 1777, 2131]
const GRAIN_SIZE = 512
const HOP = 128
const OVERLAP = GRAIN_SIZE / HOP

class ShimmerProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.delays = DELAY_LENGTHS.map((len) => ({
      buf: new Float32Array(len),
      pos: 0,
      len
    }))
    this.dampState = [0, 0, 0, 0]

    // Pitch shift state (+12 semitones = 2x)
    this.grainBuf = new Float32Array(4096)
    this.grainOut = new Float32Array(4096)
    this.grainWritePos = 0
    this.grainReadPos = 0
    this.grainHopCounter = 0

    this.win = new Float32Array(GRAIN_SIZE)
    const scale = (2 * Math.PI) / GRAIN_SIZE
    for (let i = 0; i < GRAIN_SIZE; i++) {
      this.win[i] = (0.5 * (1 - Math.cos(scale * i))) / OVERLAP
    }
  }

  static get parameterDescriptors() {
    return [
      { name: 'decay', defaultValue: 0.7, minValue: 0, maxValue: 0.95, automationRate: 'k-rate' },
      { name: 'shimmer', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'damping', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 0.4, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  pitchShift(sample) {
    const mask = 4095
    this.grainBuf[this.grainWritePos] = sample

    this.grainHopCounter++
    if (this.grainHopCounter >= HOP) {
      this.grainHopCounter = 0
      const grainStart = (this.grainWritePos - GRAIN_SIZE + 1 + 4096) & mask
      for (let g = 0; g < GRAIN_SIZE; g++) {
        const srcG = (g * 2) | 0 // ratio=2 for +12 semitones
        if (srcG >= GRAIN_SIZE) break
        const src = this.grainBuf[(grainStart + srcG) & mask]
        const outIdx = (this.grainReadPos + g) & mask
        this.grainOut[outIdx] += src * this.win[g]
      }
      this.grainReadPos = (this.grainReadPos + HOP) & mask
    }

    const rp = (this.grainReadPos - HOP + this.grainHopCounter + 4096) & mask
    const out = this.grainOut[rp]
    this.grainOut[rp] = 0
    this.grainWritePos = (this.grainWritePos + 1) & mask
    return out
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const decay = parameters.decay[0]
    const shimmerAmt = parameters.shimmer[0]
    const damping = parameters.damping[0]
    const mix = parameters.mix[0]
    const dryGain = 1 - mix
    const dampCoeff = 1 - damping * 0.7

    const n = input[0].length
    const h = 0.5 // Hadamard scale for 4x4

    for (let i = 0; i < n; i++) {
      const mono = input[0][i]

      // Read from delay lines
      const d = this.delays.map((dl) => dl.buf[dl.pos])

      // Hadamard mixing
      const mixed = [
        h * (d[0] + d[1] + d[2] + d[3]),
        h * (d[0] - d[1] + d[2] - d[3]),
        h * (d[0] + d[1] - d[2] - d[3]),
        h * (d[0] - d[1] - d[2] + d[3])
      ]

      // Sum feedback for pitch shifting
      const fbSum = (d[0] + d[1] + d[2] + d[3]) * 0.25
      const shifted = this.pitchShift(fbSum)

      // Write back into delay lines with damping
      for (let j = 0; j < 4; j++) {
        const fb = mixed[j] * (1 - shimmerAmt) + shifted * shimmerAmt
        this.dampState[j] += dampCoeff * (fb - this.dampState[j])
        this.delays[j].buf[this.delays[j].pos] = mono + this.dampState[j] * decay
        this.delays[j].pos = (this.delays[j].pos + 1) % this.delays[j].len
      }

      const wetSample = (d[0] + d[1] + d[2] + d[3]) * 0.25

      for (let ch = 0; ch < output.length; ch++) {
        const drySample = input[ch] ? input[ch][i] : mono
        output[ch][i] = drySample * dryGain + wetSample * mix
      }
    }
    return true
  }
}

registerProcessor('shimmer-processor', ShimmerProcessor)
