const MAX_DELAY_SAMPLES = 4800 // 100ms at 48kHz

class ChorusProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffers = [
      new Float32Array(MAX_DELAY_SAMPLES),
      new Float32Array(MAX_DELAY_SAMPLES)
    ]
    this.writeIndex = 0
    this.phase = 0
  }

  static get parameterDescriptors() {
    return [
      { name: 'rate', defaultValue: 1.5, minValue: 0.1, maxValue: 10, automationRate: 'k-rate' },
      { name: 'depth', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const rate = parameters.rate[0]
    const depth = parameters.depth[0]
    const mix = parameters.mix[0]
    const phaseInc = (2 * Math.PI * rate) / sampleRate

    // Modulated delay between 1ms and 8ms
    const baseDelay = Math.floor(sampleRate * 0.005)
    const modRange = Math.floor(sampleRate * 0.003 * depth)

    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue
      const buffer = this.buffers[ch] || this.buffers[0]

      for (let i = 0; i < input[ch].length; i++) {
        buffer[this.writeIndex] = input[ch][i]

        const mod = Math.sin(this.phase + ch * 0.5) * modRange
        const delaySamples = baseDelay + mod
        const readPos = this.writeIndex - delaySamples + MAX_DELAY_SAMPLES
        const readIdx = Math.floor(readPos) % MAX_DELAY_SAMPLES
        const frac = readPos - Math.floor(readPos)
        const nextIdx = (readIdx + 1) % MAX_DELAY_SAMPLES

        const delayed = buffer[readIdx] * (1 - frac) + buffer[nextIdx] * frac

        output[ch][i] = input[ch][i] * (1 - mix) + delayed * mix

        if (ch === 0) {
          this.phase += phaseInc
          if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI
          this.writeIndex = (this.writeIndex + 1) % MAX_DELAY_SAMPLES
        }
      }
    }

    return true
  }
}

registerProcessor('chorus-processor', ChorusProcessor)
