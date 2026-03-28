const BUFFER_SIZE = 4096
const GRAIN_SIZE = 1024
const HOP = 256
const OVERLAP = GRAIN_SIZE / HOP // 4x overlap

class PitchShiftProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.inBuf = [new Float32Array(BUFFER_SIZE), new Float32Array(BUFFER_SIZE)]
    this.outBuf = [new Float32Array(BUFFER_SIZE), new Float32Array(BUFFER_SIZE)]
    this.writePos = 0
    this.readPos = 0
    this.hopCounter = 0

    // Pre-compute Hann window for grain size
    this.win = new Float32Array(GRAIN_SIZE)
    const scale = 2 * Math.PI / GRAIN_SIZE
    for (let i = 0; i < GRAIN_SIZE; i++) {
      this.win[i] = 0.5 * (1 - Math.cos(scale * i)) / OVERLAP
    }
  }

  static get parameterDescriptors() {
    return [
      { name: 'semitones', defaultValue: 0, minValue: -12, maxValue: 12, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const semitones = parameters.semitones[0]
    const mix = parameters.mix[0]

    if (Math.abs(semitones) < 0.01) {
      for (let ch = 0; ch < output.length; ch++) {
        if (input[ch]) output[ch].set(input[ch])
      }
      return true
    }

    const pitchRatio = Math.pow(2, semitones / 12)
    const dry = 1 - mix
    const n = input[0].length
    const numCh = Math.min(output.length, 2)
    const win = this.win
    const mask = BUFFER_SIZE - 1 // BUFFER_SIZE must be power of 2

    for (let i = 0; i < n; i++) {
      const wp = this.writePos
      for (let ch = 0; ch < numCh; ch++) {
        this.inBuf[ch][wp] = input[ch] ? input[ch][i] : 0
      }

      this.hopCounter++
      if (this.hopCounter >= HOP) {
        this.hopCounter = 0

        for (let ch = 0; ch < numCh; ch++) {
          const inB = this.inBuf[ch]
          const outB = this.outBuf[ch]
          const grainStart = (wp - GRAIN_SIZE + 1 + BUFFER_SIZE) & mask

          for (let g = 0; g < GRAIN_SIZE; g++) {
            const srcG = (g * pitchRatio) | 0
            if (srcG >= GRAIN_SIZE) break
            const src = inB[(grainStart + srcG) & mask]
            const outIdx = (this.readPos + g) & mask
            outB[outIdx] += src * win[g]
          }
        }
        this.readPos = (this.readPos + HOP) & mask
      }

      const rp = (this.readPos - HOP + this.hopCounter + BUFFER_SIZE) & mask
      for (let ch = 0; ch < numCh; ch++) {
        const outSample = this.outBuf[ch][rp]
        this.outBuf[ch][rp] = 0
        output[ch][i] = (input[ch] ? input[ch][i] : 0) * dry + outSample * mix
      }

      this.writePos = (wp + 1) & mask
    }

    return true
  }
}

registerProcessor('pitchshift-processor', PitchShiftProcessor)
