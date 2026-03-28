const MAX_DELAY = 480 // 10ms at 48kHz

class RotaryProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.lowPhase = 0
    this.highPhase = 0
    this.currentRate = 0.8
    this.delayBuf = [new Float32Array(MAX_DELAY), new Float32Array(MAX_DELAY)]
    this.writeIdx = 0
    this.lpState = [0, 0]
  }

  static get parameterDescriptors() {
    return [
      { name: 'speed', defaultValue: 0, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'depth', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 0.7, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const speed = parameters.speed[0]
    const depth = parameters.depth[0]
    const mix = parameters.mix[0]
    const dry = 1 - mix

    const targetRate = 0.8 + speed * 6.0
    const rateSmooth = 1 - Math.exp(-1 / (sampleRate * 1.0))

    const crossoverAlpha = 1 / (1 + sampleRate / (2 * Math.PI * 800))
    const n = input[0].length

    for (let i = 0; i < n; i++) {
      this.currentRate += rateSmooth * (targetRate - this.currentRate)

      const lowPhaseInc = (2 * Math.PI * this.currentRate * 0.8) / sampleRate
      const highPhaseInc = (2 * Math.PI * this.currentRate) / sampleRate

      for (let ch = 0; ch < output.length; ch++) {
        if (!input[ch]) continue
        const s = input[ch][i]

        this.lpState[ch] += crossoverAlpha * (s - this.lpState[ch])
        const lo = this.lpState[ch]
        const hi = s - lo

        const lowMod = 1 - depth * 0.5 * (1 - Math.sin(this.lowPhase + ch * 0.3))
        const loOut = lo * lowMod

        this.delayBuf[ch][this.writeIdx] = hi
        const modDelay = 2 + depth * 3 * (0.5 + 0.5 * Math.sin(this.highPhase + ch * 0.5))
        const readPos = this.writeIdx - modDelay + MAX_DELAY
        const readIdx = Math.floor(readPos) % MAX_DELAY
        const frac = readPos - Math.floor(readPos)
        const nextIdx = (readIdx + 1) % MAX_DELAY
        const delayed = this.delayBuf[ch][readIdx] * (1 - frac) + this.delayBuf[ch][nextIdx] * frac

        const highMod = 1 - depth * 0.5 * (1 - Math.sin(this.highPhase + ch * 0.5))
        const hiOut = delayed * highMod

        output[ch][i] = s * dry + (loOut + hiOut) * mix
      }

      this.lowPhase += lowPhaseInc
      this.highPhase += highPhaseInc
      if (this.lowPhase > 2 * Math.PI) this.lowPhase -= 2 * Math.PI
      if (this.highPhase > 2 * Math.PI) this.highPhase -= 2 * Math.PI
      this.writeIdx = (this.writeIdx + 1) % MAX_DELAY
    }
    return true
  }
}

registerProcessor('rotary-processor', RotaryProcessor)
