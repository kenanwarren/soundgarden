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

    const halfDepth = parameters.depth[0] * 0.5
    const isSquare = parameters.wave[0] >= 0.5
    const phaseInc = (2 * Math.PI * parameters.rate[0]) / sampleRate
    const n = input[0].length

    let sinP = Math.sin(this.phase)
    let cosP = Math.cos(this.phase)
    const sinInc = Math.sin(phaseInc)
    const cosInc = Math.cos(phaseInc)

    for (let i = 0; i < n; i++) {
      const mod = isSquare ? (sinP >= 0 ? 1 : -1) : sinP
      const gain = 1 - halfDepth * (1 - mod)

      for (let ch = 0; ch < output.length; ch++) {
        if (input[ch]) output[ch][i] = input[ch][i] * gain
      }

      const newS = sinP * cosInc + cosP * sinInc
      cosP = cosP * cosInc - sinP * sinInc
      sinP = newS
    }

    this.phase += phaseInc * n
    if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI

    return true
  }
}

registerProcessor('tremolo-processor', TremoloProcessor)
