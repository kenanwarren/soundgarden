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
    const dry = 1 - mix
    const phaseInc = (2 * Math.PI * rate) / sampleRate
    const n = input[0].length

    const minDelay = sampleRate * 0.0001
    const delayRange = sampleRate * 0.007 * depth

    // Incremental sin/cos
    let sinP = Math.sin(this.phase)
    let cosP = Math.cos(this.phase)
    const sinInc = Math.sin(phaseInc)
    const cosInc = Math.cos(phaseInc)

    for (let i = 0; i < n; i++) {
      const lfo = (sinP + 1) * 0.5
      const delaySamples = minDelay + delayRange * lfo

      const readPos = this.writeIndex - delaySamples + MAX_DELAY_SAMPLES
      const readIdx = readPos | 0
      const frac = readPos - readIdx
      const ri = readIdx % MAX_DELAY_SAMPLES
      const ni = (ri + 1) % MAX_DELAY_SAMPLES

      for (let ch = 0; ch < output.length; ch++) {
        if (!input[ch]) continue
        const buffer = this.buffers[ch] || this.buffers[0]

        const delayed = buffer[ri] + (buffer[ni] - buffer[ri]) * frac
        buffer[this.writeIndex] = input[ch][i] + delayed * feedback
        output[ch][i] = input[ch][i] * dry + delayed * mix
      }

      const newS = sinP * cosInc + cosP * sinInc
      cosP = cosP * cosInc - sinP * sinInc
      sinP = newS
      this.writeIndex = (this.writeIndex + 1) % MAX_DELAY_SAMPLES
    }

    this.phase += phaseInc * n
    if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI

    return true
  }
}

registerProcessor('flanger-processor', FlangerProcessor)
