class TremoloProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.phase = 0
  }

  static get parameterDescriptors() {
    return [
      { name: 'rate', defaultValue: 4, minValue: 0.5, maxValue: 20, automationRate: 'k-rate' },
      { name: 'depth', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'wave', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const rate = parameters.rate[0]
    const depth = parameters.depth[0]
    const wave = parameters.wave[0]
    const phaseInc = (2 * Math.PI * rate) / sampleRate

    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue

      for (let i = 0; i < input[ch].length; i++) {
        const sinVal = Math.sin(this.phase)
        const mod = wave < 0.5 ? sinVal : (sinVal >= 0 ? 1 : -1)
        const gain = 1 - depth * 0.5 * (1 - mod)

        output[ch][i] = input[ch][i] * gain

        if (ch === 0) {
          this.phase += phaseInc
          if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI
        }
      }
    }

    return true
  }
}

registerProcessor('tremolo-processor', TremoloProcessor)
