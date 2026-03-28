const MAX_DELAY_SAMPLES = 1024

class FlangerProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffers = [new Float32Array(MAX_DELAY_SAMPLES), new Float32Array(MAX_DELAY_SAMPLES)]
    this.writeIndex = 0
    this.phase = 0
  }

  static get parameterDescriptors() {
    return [
      { name: 'rate', defaultValue: 0.5, minValue: 0.05, maxValue: 5, automationRate: 'k-rate' },
      { name: 'depth', defaultValue: 0.7, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      {
        name: 'feedback',
        defaultValue: 0.5,
        minValue: -0.95,
        maxValue: 0.95,
        automationRate: 'k-rate'
      },
      { name: 'mix', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!output || output.length === 0) return true
    if (!input || !input[0]) {
      for (let ch = 0; ch < output.length; ch++) {
        output[ch].fill(0)
      }
      return true
    }

    const rate = parameters.rate[0]
    const depth = parameters.depth[0]
    const feedback = parameters.feedback[0]
    const mix = Math.max(0, Math.min(1, parameters.mix[0]))
    const dry = 1 - mix
    const phaseInc = (2 * Math.PI * rate) / sampleRate
    const n = input[0].length

    const baseDelay = sampleRate * 0.0015
    const modRange = sampleRate * 0.0035 * depth
    let phase = this.phase

    for (let i = 0; i < n; i++) {
      for (let ch = 0; ch < output.length; ch++) {
        const channel = input[ch] || input[0]
        const buffer = this.buffers[ch] || this.buffers[0]
        const source = channel ? channel[i] : 0

        const lfo = (Math.sin(phase + ch * 0.35) + 1) * 0.5
        const delaySamples = baseDelay + modRange * lfo
        let readPos = this.writeIndex - delaySamples
        while (readPos < 0) readPos += MAX_DELAY_SAMPLES
        const readIdx = Math.floor(readPos)
        const frac = readPos - readIdx
        const nextIdx = (readIdx + 1) % MAX_DELAY_SAMPLES

        const delayed = buffer[readIdx] * (1 - frac) + buffer[nextIdx] * frac
        const writeSample = source + delayed * feedback
        buffer[this.writeIndex] = Number.isFinite(writeSample) ? writeSample : 0

        const wetSample = source * dry + delayed * mix
        output[ch][i] = Number.isFinite(wetSample) ? wetSample : source
      }

      this.writeIndex = (this.writeIndex + 1) % MAX_DELAY_SAMPLES
      phase += phaseInc
      if (phase > 2 * Math.PI) phase -= 2 * Math.PI
    }

    this.phase = phase

    return true
  }
}

registerProcessor('flanger-processor', FlangerProcessor)
