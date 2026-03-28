class OctaverProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.flipFlop = 1
    this.prevSign = 1
    this.crossfadeCounter = 0
    this.crossfadeLength = 8
    this.prevFlip = 1
    this.hpState = [0, 0]
    this.lpState = [0, 0]
  }

  static get parameterDescriptors() {
    return [
      { name: 'subLevel', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'upperLevel', defaultValue: 0, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'dry', defaultValue: 1.0, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const subLevel = parameters.subLevel[0]
    const upperLevel = parameters.upperLevel[0]
    const dryLevel = parameters.dry[0]

    const hpAlpha = 1 / (1 + sampleRate / (2 * Math.PI * 80))
    const lpAlpha = 1 / (1 + sampleRate / (2 * Math.PI * 8000))

    for (let i = 0; i < input[0].length; i++) {
      const mono = input[0][i]
      const sign = mono >= 0 ? 1 : -1

      if (sign !== this.prevSign) {
        this.prevFlip = this.flipFlop
        this.flipFlop = -this.flipFlop
        this.crossfadeCounter = this.crossfadeLength
      }
      this.prevSign = sign

      let subSample
      if (this.crossfadeCounter > 0) {
        const t = this.crossfadeCounter / this.crossfadeLength
        subSample = mono * (this.prevFlip * t + this.flipFlop * (1 - t))
        this.crossfadeCounter--
      } else {
        subSample = mono * this.flipFlop
      }

      const rectified = Math.abs(mono)
      for (let ch = 0; ch < output.length; ch++) {
        const s = input[ch] ? input[ch][i] : mono
        this.hpState[ch] = this.hpState[ch] + hpAlpha * (rectified - this.hpState[ch])
        const upperSample = rectified - this.hpState[ch]
        this.lpState[ch] = this.lpState[ch] + lpAlpha * (upperSample - this.lpState[ch])

        output[ch][i] = s * dryLevel + subSample * subLevel + this.lpState[ch] * upperLevel
      }
    }
    return true
  }
}

registerProcessor('octaver-processor', OctaverProcessor)
