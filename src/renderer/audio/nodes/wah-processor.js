class WahProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.envFollower = [0, 0]
    this.bpState = [
      { x1: 0, x2: 0, y1: 0, y2: 0 },
      { x1: 0, x2: 0, y1: 0, y2: 0 }
    ]
    this.phase = 0
  }

  static get parameterDescriptors() {
    return [
      { name: 'sensitivity', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'frequency', defaultValue: 1500, minValue: 300, maxValue: 5000, automationRate: 'k-rate' },
      { name: 'q', defaultValue: 5, minValue: 1, maxValue: 15, automationRate: 'k-rate' },
      { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const sensitivity = parameters.sensitivity[0]
    const baseFreq = parameters.frequency[0]
    const q = parameters.q[0]
    const mode = Math.round(parameters.mode[0])

    const minFreq = 300
    const maxFreq = 5000
    const envAttack = Math.exp(-1 / (sampleRate * 0.005))
    const envRelease = Math.exp(-1 / (sampleRate * 0.05))

    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue

      for (let i = 0; i < input[ch].length; i++) {
        let sweepFreq

        if (mode === 0) {
          // Auto-wah: envelope follower
          const abs = Math.abs(input[ch][i])
          const coeff = abs > this.envFollower[ch] ? envAttack : envRelease
          this.envFollower[ch] = coeff * this.envFollower[ch] + (1 - coeff) * abs
          const env = Math.min(1, this.envFollower[ch] * (5 + sensitivity * 45))
          sweepFreq = minFreq + (maxFreq - minFreq) * env
        } else {
          // LFO mode
          const lfoRate = 0.5 + sensitivity * 4.5
          const phaseInc = (2 * Math.PI * lfoRate) / sampleRate
          const lfo = (Math.sin(this.phase) + 1) * 0.5
          sweepFreq = minFreq + (maxFreq - minFreq) * lfo

          if (ch === 0) {
            this.phase += phaseInc
            if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI
          }
        }

        // 2nd-order bandpass filter
        const w0 = 2 * Math.PI * sweepFreq / sampleRate
        const sinW0 = Math.sin(w0)
        const cosW0 = Math.cos(w0)
        const alpha = sinW0 / (2 * q)

        const b0 = alpha
        const b1 = 0
        const b2 = -alpha
        const a0 = 1 + alpha
        const a1 = -2 * cosW0
        const a2 = 1 - alpha

        const st = this.bpState[ch]
        const x = input[ch][i]
        const y = (b0 / a0) * x + (b1 / a0) * st.x1 + (b2 / a0) * st.x2
                - (a1 / a0) * st.y1 - (a2 / a0) * st.y2

        st.x2 = st.x1
        st.x1 = x
        st.y2 = st.y1
        st.y1 = y

        output[ch][i] = y
      }
    }

    return true
  }
}

registerProcessor('wah-processor', WahProcessor)
