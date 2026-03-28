class WahProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.envFollower = 0
    // State-variable filter state (cheaper to modulate than biquad)
    this.svfLow = 0
    this.svfBand = 0
    this.phase = 0
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'sensitivity',
        defaultValue: 0.5,
        minValue: 0,
        maxValue: 1.0,
        automationRate: 'k-rate'
      },
      {
        name: 'frequency',
        defaultValue: 1500,
        minValue: 300,
        maxValue: 5000,
        automationRate: 'k-rate'
      },
      { name: 'q', defaultValue: 5, minValue: 1, maxValue: 15, automationRate: 'k-rate' },
      { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const sensitivity = parameters.sensitivity[0]
    const q = parameters.q[0]
    const mode = Math.round(parameters.mode[0])
    const sr = sampleRate
    const n = input[0].length

    const minFreq = 300
    const maxFreq = 5000
    const freqRange = maxFreq - minFreq

    const envAttack = Math.exp(-1 / (sr * 0.005))
    const envRelease = Math.exp(-1 / (sr * 0.05))

    // SVF damping from Q
    const damp = 1 / q

    let envF = this.envFollower
    let low = this.svfLow
    let band = this.svfBand
    let phase = this.phase

    const lfoRate = 0.5 + sensitivity * 4.5
    const phaseInc = (2 * Math.PI * lfoRate) / sr

    // Compute SVF freq coeff once per block for LFO mode,
    // or update per sample for envelope mode (cheap: just one multiply)
    if (mode === 1) {
      // LFO mode: compute freq at block start
      const lfo = (Math.sin(phase) + 1) * 0.5
      const sweepFreq = minFreq + freqRange * lfo
      const f = 2 * Math.sin((Math.PI * sweepFreq) / sr)

      for (let ch = 0; ch < output.length; ch++) {
        if (!input[ch]) continue
        for (let i = 0; i < n; i++) {
          const x = input[ch][i]
          low = low + f * band
          const high = x - low - damp * band
          band = f * high + band
          output[ch][i] = band
        }
      }

      phase += phaseInc * n
      if (phase > 2 * Math.PI) phase -= 2 * Math.PI
    } else {
      // Auto-wah: envelope follower, update SVF freq per sample
      const envScale = 5 + sensitivity * 45
      const piOverSr = Math.PI / sr
      for (let ch = 0; ch < output.length; ch++) {
        if (!input[ch]) continue
        for (let i = 0; i < n; i++) {
          const x = input[ch][i]
          const abs = x > 0 ? x : -x
          const coeff = abs > envF ? envAttack : envRelease
          envF = coeff * envF + (1 - coeff) * abs
          const env = envF * envScale
          const sweepFreq = minFreq + freqRange * (env < 1 ? env : 1)
          const f = 2 * Math.sin(piOverSr * sweepFreq)

          low = low + f * band
          const high = x - low - damp * band
          band = f * high + band
          output[ch][i] = band
        }
      }
    }

    this.envFollower = envF
    this.svfLow = low
    this.svfBand = band
    this.phase = phase

    return true
  }
}

registerProcessor('wah-processor', WahProcessor)
