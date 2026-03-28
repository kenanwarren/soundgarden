class AutoSwellProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.currentGain = -1
    this.gateOpen = false
  }

  static get parameterDescriptors() {
    return [
      { name: 'attack', defaultValue: 200, minValue: 10, maxValue: 2000, automationRate: 'k-rate' },
      { name: 'sensitivity', defaultValue: -30, minValue: -60, maxValue: 0, automationRate: 'k-rate' },
      { name: 'depth', defaultValue: 1.0, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const attackMs = parameters.attack[0]
    const sensitivity = parameters.sensitivity[0]
    const depth = parameters.depth[0]
    const thresholdLin = Math.pow(10, sensitivity / 20)
    const attackCoeff = 1 - Math.exp(-1 / (sampleRate * attackMs / 1000))
    const releaseCoeff = 1 - Math.exp(-1 / (sampleRate * 0.005))
    const minGain = 1 - depth
    if (this.currentGain < 0) this.currentGain = minGain

    for (let i = 0; i < input[0].length; i++) {
      let maxAbs = 0
      for (let ch = 0; ch < input.length; ch++) {
        const abs = Math.abs(input[ch][i])
        if (abs > maxAbs) maxAbs = abs
      }

      if (maxAbs > thresholdLin) {
        this.gateOpen = true
      } else if (maxAbs < thresholdLin * 0.5) {
        this.gateOpen = false
      }

      const targetGain = this.gateOpen ? 1.0 : minGain
      if (targetGain > this.currentGain) {
        this.currentGain += attackCoeff * (targetGain - this.currentGain)
      } else {
        this.currentGain += releaseCoeff * (targetGain - this.currentGain)
      }

      for (let ch = 0; ch < output.length; ch++) {
        output[ch][i] = (input[ch] ? input[ch][i] : 0) * this.currentGain
      }
    }
    return true
  }
}

registerProcessor('autoswell-processor', AutoSwellProcessor)
