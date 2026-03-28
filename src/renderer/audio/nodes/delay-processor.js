const MAX_DELAY_SECONDS = 2

class DelayProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.maxSamples = Math.ceil(sampleRate * MAX_DELAY_SECONDS)
    this.buffers = [
      new Float32Array(this.maxSamples),
      new Float32Array(this.maxSamples)
    ]
    this.writeIndex = 0
  }

  static get parameterDescriptors() {
    return [
      { name: 'time', defaultValue: 300, minValue: 50, maxValue: 2000, automationRate: 'k-rate' },
      { name: 'feedback', defaultValue: 0.3, minValue: 0, maxValue: 0.95, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 0.3, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const timeMs = parameters.time[0]
    const feedback = parameters.feedback[0]
    const mix = parameters.mix[0]

    const delaySamples = Math.floor((timeMs / 1000) * sampleRate)

    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue

      const buffer = this.buffers[ch] || this.buffers[0]

      for (let i = 0; i < input[ch].length; i++) {
        const readIndex = (this.writeIndex - delaySamples + this.maxSamples) % this.maxSamples

        const delayed = buffer[readIndex]
        const inputSample = input[ch][i]

        buffer[this.writeIndex] = inputSample + delayed * feedback
        output[ch][i] = inputSample * (1 - mix) + delayed * mix

        if (ch === output.length - 1) {
          this.writeIndex = (this.writeIndex + 1) % this.maxSamples
        }
      }
    }

    return true
  }
}

registerProcessor('delay-processor', DelayProcessor)
