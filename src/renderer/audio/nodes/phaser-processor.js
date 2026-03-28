class PhaserProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.phase = 0
    this.allpassStates = []
    for (let s = 0; s < 12; s++) {
      this.allpassStates.push({ x1: 0, x2: 0, y1: 0, y2: 0 })
    }
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
    const phaseInc = (2 * Math.PI * rate) / sampleRate

    const minFreq = 200
    const maxFreq = 4000

    for (let i = 0; i < input[0].length; i++) {
      const lfo = (Math.sin(this.phase) + 1) * 0.5
      const sweepFreq = minFreq + (maxFreq - minFreq) * lfo * depth
      const w0 = 2 * Math.PI * sweepFreq / sampleRate
      const alpha = Math.sin(w0) / 2
      const a1 = -2 * Math.cos(w0) / (1 + alpha)
      const b0 = (1 - alpha) / (1 + alpha)

      let sample = 0
      for (let ch = 0; ch < output.length; ch++) {
        if (!input[ch]) continue

        let x = input[ch][i] + this.feedbackSample * feedback

        for (let s = 0; s < stages; s++) {
          const st = this.allpassStates[s]
          const y = b0 * x + a1 * st.x1 + st.x2 - a1 * st.y1 - b0 * st.y2
          st.x2 = st.x1
          st.x1 = x
          st.y2 = st.y1
          st.y1 = y
          x = y
        }

        if (ch === 0) this.feedbackSample = x

        output[ch][i] = input[ch][i] * (1 - mix) + x * mix
        sample = x
      }

      this.phase += phaseInc
      if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI
    }

    return true
  }
}

registerProcessor('phaser-processor', PhaserProcessor)
