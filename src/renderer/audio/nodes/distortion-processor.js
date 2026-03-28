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

    // Tone control: one-pole low-pass, cutoff mapped from tone param
    const cutoff = 800 + tone * 7200 // 800Hz to 8000Hz
    const rc = 1.0 / (2 * Math.PI * cutoff)
    const dt = 1.0 / sampleRate
    const alpha = dt / (rc + dt)

    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue

      for (let i = 0; i < input[ch].length; i++) {
        let x = input[ch][i] * gain
        let shaped

        if (mode === 0) {
          // Soft clip (overdrive) - tanh
          shaped = Math.tanh(x)
        } else if (mode === 1) {
          // Fuzz - asymmetric clipping
          if (x >= 0) {
            shaped = 1 - Math.exp(-x)
          } else {
            shaped = -(1 - Math.exp(x)) * 0.8
          }
        } else {
          // Hard clip
          shaped = Math.max(-1, Math.min(1, x))
        }

        // Apply tone filter
        this.lpState[ch] = this.lpState[ch] + alpha * (shaped - this.lpState[ch])
        const filtered = this.lpState[ch]

        output[ch][i] = input[ch][i] * (1 - mix) + filtered * mix
      }
    }

    return true
  }
}

registerProcessor('distortion-processor', DistortionProcessor)
