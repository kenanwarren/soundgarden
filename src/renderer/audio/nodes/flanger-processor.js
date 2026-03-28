const MAX_DELAY_SAMPLES = 960 // 20ms at 48kHz

class FlangerProcessor extends AudioWorkletProcessor {
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
      { name: 'rate', defaultValue: 0.5, minValue: 0.05, maxValue: 5, automationRate: 'k-rate' },
      { name: 'depth', defaultValue: 0.7, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'feedback', defaultValue: 0.5, minValue: -0.95, maxValue: 0.95, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const rate = parameters.rate[0]
    const depth = parameters.depth[0]
    const feedback = parameters.feedback[0]
    const mix = parameters.mix[0]
    const phaseInc = (2 * Math.PI * rate) / sampleRate

    // Sweep delay between 0.1ms and 7ms
    const minDelay = Math.floor(sampleRate * 0.0001)
    const maxDelay = Math.floor(sampleRate * 0.007)

    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue
      const buffer = this.buffers[ch] || this.buffers[0]

      for (let i = 0; i < input[ch].length; i++) {
        const lfo = (Math.sin(this.phase) + 1) * 0.5
        const delaySamples = minDelay + (maxDelay - minDelay) * lfo * depth

        const readPos = this.writeIndex - delaySamples + MAX_DELAY_SAMPLES
        const readIdx = Math.floor(readPos) % MAX_DELAY_SAMPLES
        const frac = readPos - Math.floor(readPos)
        const nextIdx = (readIdx + 1) % MAX_DELAY_SAMPLES

        const delayed = buffer[readIdx] * (1 - frac) + buffer[nextIdx] * frac

        buffer[this.writeIndex] = input[ch][i] + delayed * feedback
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

registerProcessor('flanger-processor', FlangerProcessor)
