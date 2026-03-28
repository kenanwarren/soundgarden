class NoiseGateProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.envelope = 0
    this.gateGain = 0
  }

  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: -40, minValue: -80, maxValue: 0, automationRate: 'k-rate' },
      { name: 'attack', defaultValue: 1, minValue: 0.1, maxValue: 50, automationRate: 'k-rate' },
      { name: 'release', defaultValue: 50, minValue: 10, maxValue: 500, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const threshold = parameters.threshold[0]
    const attackMs = parameters.attack[0]
    const releaseMs = parameters.release[0]

    const attackCoeff = Math.exp(-1 / (sampleRate * attackMs / 1000))
    const releaseCoeff = Math.exp(-1 / (sampleRate * releaseMs / 1000))

    for (let i = 0; i < input[0].length; i++) {
      let maxAbs = 0
      for (let ch = 0; ch < input.length; ch++) {
        const abs = Math.abs(input[ch][i])
        if (abs > maxAbs) maxAbs = abs
      }

      const inputDb = 20 * Math.log10(Math.max(maxAbs, 1e-10))

      const envCoeff = inputDb > this.envelope ? 0.01 : 0.001
      this.envelope = this.envelope + envCoeff * (inputDb - this.envelope)

      const target = this.envelope > threshold ? 1 : 0
      const gateCoeff = target > this.gateGain ? attackCoeff : releaseCoeff
      this.gateGain = gateCoeff * this.gateGain + (1 - gateCoeff) * target

      for (let ch = 0; ch < output.length; ch++) {
        output[ch][i] = (input[ch] ? input[ch][i] : 0) * this.gateGain
      }
    }

    return true
  }
}

registerProcessor('noisegate-processor', NoiseGateProcessor)
