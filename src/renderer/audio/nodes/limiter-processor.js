const LOOKAHEAD = 64

class LimiterProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.envelope = 0
    this.delayBuf = [new Float32Array(LOOKAHEAD), new Float32Array(LOOKAHEAD)]
    this.writePos = 0
  }

  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: -1, minValue: -20, maxValue: 0, automationRate: 'k-rate' },
      { name: 'release', defaultValue: 100, minValue: 10, maxValue: 1000, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const threshold = parameters.threshold[0]
    const releaseMs = parameters.release[0]
    const attackCoeff = Math.exp(-1 / (sampleRate * 0.0001))
    const releaseCoeff = Math.exp(-1 / ((sampleRate * releaseMs) / 1000))
    const n = input[0].length

    for (let i = 0; i < n; i++) {
      let maxAbs = 0
      for (let ch = 0; ch < input.length; ch++) {
        const abs = Math.abs(input[ch] ? input[ch][i] : 0)
        if (abs > maxAbs) maxAbs = abs
      }

      const inputDb = 20 * Math.log10(Math.max(maxAbs, 1e-10))
      const coeff = inputDb > this.envelope ? attackCoeff : releaseCoeff
      this.envelope = coeff * this.envelope + (1 - coeff) * inputDb

      let gainDb = 0
      if (this.envelope > threshold) {
        gainDb = threshold - this.envelope
      }
      const gain = Math.pow(10, gainDb / 20)

      const readPos = (this.writePos + 1) % LOOKAHEAD
      for (let ch = 0; ch < output.length; ch++) {
        const buf = this.delayBuf[ch] || this.delayBuf[0]
        buf[this.writePos] = input[ch] ? input[ch][i] : 0
        output[ch][i] = buf[readPos] * gain
      }
      this.writePos = (this.writePos + 1) % LOOKAHEAD
    }
    return true
  }
}

registerProcessor('limiter-processor', LimiterProcessor)
