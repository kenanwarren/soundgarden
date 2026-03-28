class DistortionProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.lpState = [0, 0]
  }

  static get parameterDescriptors() {
    return [
      { name: 'gain', defaultValue: 3, minValue: 0.5, maxValue: 10, automationRate: 'k-rate' },
      { name: 'tone', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const gain = parameters.gain[0]
    const tone = parameters.tone[0]
    const mode = Math.round(parameters.mode[0])
    const mix = parameters.mix[0]
    const dry = 1 - mix

    const cutoff = 800 + tone * 7200
    const rc = 1.0 / (2 * Math.PI * cutoff)
    const dt = 1.0 / sampleRate
    const alpha = dt / (rc + dt)

    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue

      let lp = this.lpState[ch]
      const inp = input[ch]
      const out = output[ch]

      if (mode === 0) {
        for (let i = 0; i < inp.length; i++) {
          const x = inp[i] * gain
          // Fast tanh approximation: x / (1 + |x|) — no transcendentals
          const shaped = x / (1 + (x > 0 ? x : -x))
          lp += alpha * (shaped - lp)
          out[i] = inp[i] * dry + lp * mix
        }
      } else if (mode === 1) {
        for (let i = 0; i < inp.length; i++) {
          const x = inp[i] * gain
          // Fuzz approximation: asymmetric soft clip
          let shaped
          if (x >= 0) {
            shaped = x / (1 + x)
          } else {
            shaped = (x / (1 - x)) * 0.8
          }
          lp += alpha * (shaped - lp)
          out[i] = inp[i] * dry + lp * mix
        }
      } else {
        for (let i = 0; i < inp.length; i++) {
          const x = inp[i] * gain
          const shaped = x > 1 ? 1 : x < -1 ? -1 : x
          lp += alpha * (shaped - lp)
          out[i] = inp[i] * dry + lp * mix
        }
      }

      this.lpState[ch] = lp
    }

    return true
  }
}

registerProcessor('distortion-processor', DistortionProcessor)
