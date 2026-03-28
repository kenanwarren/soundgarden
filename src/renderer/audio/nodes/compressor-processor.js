class CompressorProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.envelope = 0
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'threshold',
        defaultValue: -20,
        minValue: -60,
        maxValue: 0,
        automationRate: 'k-rate'
      },
      { name: 'ratio', defaultValue: 4, minValue: 1, maxValue: 20, automationRate: 'k-rate' },
      { name: 'attack', defaultValue: 10, minValue: 0.1, maxValue: 100, automationRate: 'k-rate' },
      {
        name: 'release',
        defaultValue: 100,
        minValue: 10,
        maxValue: 1000,
        automationRate: 'k-rate'
      },
      { name: 'makeup', defaultValue: 0, minValue: 0, maxValue: 30, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const threshold = parameters.threshold[0]
    const ratio = parameters.ratio[0]
    const attackMs = parameters.attack[0]
    const releaseMs = parameters.release[0]
    const makeupDb = parameters.makeup[0]

    const attackCoeff = Math.exp(-1 / ((sampleRate * attackMs) / 1000))
    const releaseCoeff = Math.exp(-1 / ((sampleRate * releaseMs) / 1000))
    const makeupGain = Math.pow(10, makeupDb / 20)

    for (let i = 0; i < input[0].length; i++) {
      let maxAbs = 0
      for (let ch = 0; ch < input.length; ch++) {
        const abs = Math.abs(input[ch][i])
        if (abs > maxAbs) maxAbs = abs
      }

      const inputDb = 20 * Math.log10(Math.max(maxAbs, 1e-10))

      const coeff = inputDb > this.envelope ? attackCoeff : releaseCoeff
      this.envelope = coeff * this.envelope + (1 - coeff) * inputDb

      let gainDb = 0
      if (this.envelope > threshold) {
        gainDb = threshold + (this.envelope - threshold) / ratio - this.envelope
      }

      const gain = Math.pow(10, gainDb / 20) * makeupGain

      for (let ch = 0; ch < output.length; ch++) {
        output[ch][i] = (input[ch] ? input[ch][i] : 0) * gain
      }
    }

    return true
  }
}

registerProcessor('compressor-processor', CompressorProcessor)
