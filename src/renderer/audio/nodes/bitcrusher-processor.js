class BitcrusherProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.held = [0, 0]
    this.counter = 0
  }

  static get parameterDescriptors() {
    return [
      { name: 'bitDepth', defaultValue: 16, minValue: 1, maxValue: 16, automationRate: 'k-rate' },
      { name: 'downsample', defaultValue: 1, minValue: 1, maxValue: 50, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 1.0, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const bitDepth = Math.round(parameters.bitDepth[0])
    const downsample = Math.round(parameters.downsample[0])
    const mix = parameters.mix[0]
    const dry = 1 - mix
    const levels = Math.pow(2, bitDepth)

    for (let i = 0; i < input[0].length; i++) {
      if (this.counter % downsample === 0) {
        for (let ch = 0; ch < input.length; ch++) {
          if (input[ch]) {
            this.held[ch] = Math.round(input[ch][i] * levels) / levels
          }
        }
      }
      this.counter++

      for (let ch = 0; ch < output.length; ch++) {
        const d = input[ch] ? input[ch][i] : 0
        output[ch][i] = d * dry + (this.held[ch] || 0) * mix
      }
    }
    return true
  }
}

registerProcessor('bitcrusher-processor', BitcrusherProcessor)
