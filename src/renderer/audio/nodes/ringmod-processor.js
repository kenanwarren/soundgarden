class RingModProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.phase = 0
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'frequency',
        defaultValue: 200,
        minValue: 20,
        maxValue: 2000,
        automationRate: 'k-rate'
      },
      { name: 'mix', defaultValue: 1.0, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const freq = parameters.frequency[0]
    const mix = parameters.mix[0]
    const dry = 1 - mix
    const phaseInc = (2 * Math.PI * freq) / sampleRate
    const n = input[0].length

    let sinP = Math.sin(this.phase)
    let cosP = Math.cos(this.phase)
    const sinInc = Math.sin(phaseInc)
    const cosInc = Math.cos(phaseInc)

    for (let i = 0; i < n; i++) {
      for (let ch = 0; ch < output.length; ch++) {
        if (input[ch]) {
          output[ch][i] = input[ch][i] * dry + input[ch][i] * sinP * mix
        }
      }
      const newS = sinP * cosInc + cosP * sinInc
      cosP = cosP * cosInc - sinP * sinInc
      sinP = newS
    }

    this.phase += phaseInc * n
    if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI * Math.floor(this.phase / (2 * Math.PI))
    return true
  }
}

registerProcessor('ringmod-processor', RingModProcessor)
