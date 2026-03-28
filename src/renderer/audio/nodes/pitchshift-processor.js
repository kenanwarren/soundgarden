const BUFFER_SIZE = 8192
const HOP_SIZE = 256

class PitchShiftProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.inputBuffer = [new Float32Array(BUFFER_SIZE), new Float32Array(BUFFER_SIZE)]
    this.outputBuffer = [new Float32Array(BUFFER_SIZE), new Float32Array(BUFFER_SIZE)]
    this.writePos = 0
    this.readPhase = [0, 0]
    this.outputWritePos = 0
    this.outputReadPos = 0

    // Hann window
    this.window = new Float32Array(BUFFER_SIZE)
    for (let i = 0; i < BUFFER_SIZE; i++) {
      this.window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / BUFFER_SIZE))
    }

    this.grainSize = 2048
    this.hopCounter = 0
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
    const pitchRatio = Math.pow(2, semitones / 12)

    if (Math.abs(semitones) < 0.01) {
      for (let ch = 0; ch < output.length; ch++) {
        if (input[ch]) output[ch].set(input[ch])
      }
      return true
    }

    const grainSize = this.grainSize
    const hopOut = HOP_SIZE

    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue

      for (let i = 0; i < input[ch].length; i++) {
        this.inputBuffer[ch][this.writePos % BUFFER_SIZE] = input[ch][i]

        // Overlap-add granular pitch shifting
        if (ch === 0) this.hopCounter++

        if (ch === 0 && this.hopCounter >= hopOut) {
          this.hopCounter = 0
          for (let c = 0; c < output.length; c++) {
            for (let g = 0; g < grainSize; g++) {
              const readIdx = (this.writePos - grainSize + g + BUFFER_SIZE) % BUFFER_SIZE
              const srcIdx = Math.floor(g * pitchRatio) % grainSize
              const srcReadIdx = (this.writePos - grainSize + srcIdx + BUFFER_SIZE) % BUFFER_SIZE
              const win = this.window[Math.floor(g * this.window.length / grainSize)]
              const outIdx = (this.outputWritePos + g) % BUFFER_SIZE
              this.outputBuffer[c][outIdx] += this.inputBuffer[c][srcReadIdx] * win * 0.5
            }
          }
          this.outputWritePos = (this.outputWritePos + hopOut) % BUFFER_SIZE
        }

        const outSample = this.outputBuffer[ch][this.outputReadPos % BUFFER_SIZE]
        this.outputBuffer[ch][this.outputReadPos % BUFFER_SIZE] = 0
        output[ch][i] = input[ch][i] * (1 - mix) + outSample * mix

        if (ch === 0) {
          this.writePos = (this.writePos + 1) % BUFFER_SIZE
          this.outputReadPos = (this.outputReadPos + 1) % BUFFER_SIZE
        }
      }
    }

    return true
  }
}

registerProcessor('pitchshift-processor', PitchShiftProcessor)
