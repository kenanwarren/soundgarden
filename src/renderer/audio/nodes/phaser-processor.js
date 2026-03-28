class PhaserProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.phase = 0
    this.ap = [new Float32Array(12), new Float32Array(12)]
    this.feedbackSample = 0
  }

  static get parameterDescriptors() {
    return [
      { name: 'rate', defaultValue: 0.5, minValue: 0.05, maxValue: 5, automationRate: 'k-rate' },
      { name: 'depth', defaultValue: 0.7, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'stages', defaultValue: 4, minValue: 2, maxValue: 12, automationRate: 'k-rate' },
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
    const stages = Math.round(parameters.stages[0])
    const feedback = parameters.feedback[0]
    const mix = parameters.mix[0]
    const dry = 1 - mix
    const n = input[0].length
    const sr = sampleRate
    const phaseInc = (2 * Math.PI * rate) / sr

    const minFreq = 200
    const freqRange = 3800 * depth

    // Compute allpass coeff at block start/end and interpolate
    const lfo0 = (Math.sin(this.phase) + 1) * 0.5
    const lfoEnd = (Math.sin(this.phase + phaseInc * n) + 1) * 0.5
    const tan0 = Math.tan(Math.PI * (minFreq + freqRange * lfo0) / sr)
    const tanEnd = Math.tan(Math.PI * (minFreq + freqRange * lfoEnd) / sr)
    const a0 = (tan0 - 1) / (tan0 + 1)
    const aEnd = (tanEnd - 1) / (tanEnd + 1)
    const aInc = (aEnd - a0) / n

    let fbSample = this.feedbackSample
    let a = a0

    for (let i = 0; i < n; i++) {
      a += aInc

      for (let ch = 0; ch < output.length; ch++) {
        if (!input[ch]) continue
        const ap = this.ap[ch] || this.ap[0]

        let x = input[ch][i] + fbSample * feedback

        for (let s = 0; s < stages; s++) {
          const prev = ap[s]
          const y = a * x + prev - a * prev
          ap[s] = x
          x = y
        }

        if (ch === 0) fbSample = x
        output[ch][i] = input[ch][i] * dry + x * mix
      }
    }

    this.feedbackSample = fbSample
    this.phase += phaseInc * n
    if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI

    return true
  }
}

registerProcessor('phaser-processor', PhaserProcessor)
