const BUFFER_SIZE = 4096
const MIN_FREQUENCY = 60
const MAX_FREQUENCY = 1500
const RMS_THRESHOLD = 0.01
const CLARITY_THRESHOLD = 0.5
const MPM_PEAK_RATIO = 0.85

class TunerProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = new Float32Array(BUFFER_SIZE)
    this.writeIndex = 0
    this.samplesCollected = 0
    this.minLag = 0
    this.maxLag = 0
    this.lagRange = 0
    this.nsdfResult = null
    this.initialized = false
  }

  init() {
    this.minLag = Math.floor(sampleRate / MAX_FREQUENCY)
    this.maxLag = Math.min(Math.ceil(sampleRate / MIN_FREQUENCY), BUFFER_SIZE - 1)
    this.lagRange = this.maxLag - this.minLag + 1
    this.nsdfResult = new Float32Array(this.lagRange)
    this.initialized = true
  }

  process(inputs, outputs) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true
    if (!this.initialized) this.init()

    for (let ch = 0; ch < output.length; ch++) {
      if (input[ch]) {
        output[ch].set(input[ch])
      }
    }

    const channelData = input[0]
    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.writeIndex] = channelData[i]
      this.writeIndex = (this.writeIndex + 1) % BUFFER_SIZE
      this.samplesCollected++
    }

    if (this.samplesCollected >= 3200) {
      this.samplesCollected = 0
      this.analyze()
    }

    return true
  }

  analyze() {
    const buf = this.buffer
    const wi = this.writeIndex
    const n = BUFFER_SIZE

    let sum = 0
    for (let i = 0; i < n; i++) {
      const s = buf[(wi + i) % n]
      sum += s * s
    }
    if (Math.sqrt(sum / n) < RMS_THRESHOLD) {
      this.port.postMessage({ frequency: 0, clarity: 0 })
      return
    }

    const minLag = this.minLag
    const result = this.nsdfResult

    for (let idx = 0; idx < this.lagRange; idx++) {
      const tau = minLag + idx
      let acf = 0
      let denomA = 0
      let denomB = 0
      const limit = n - tau

      for (let i = 0; i < limit; i++) {
        const a = buf[(wi + i) % n]
        const b = buf[(wi + i + tau) % n]
        acf += a * b
        denomA += a * a
        denomB += b * b
      }

      const denom = denomA + denomB
      result[idx] = denom > 0 ? (2 * acf) / denom : 0
    }

    const peaks = []
    let wasNegative = false
    let inPeak = false
    let peakIdx = 0
    let peakVal = 0

    for (let idx = 0; idx < this.lagRange; idx++) {
      const v = result[idx]

      if (v < 0) {
        if (inPeak && peakVal > CLARITY_THRESHOLD) {
          peaks.push({ idx: peakIdx, value: peakVal })
        }
        wasNegative = true
        inPeak = false
        peakIdx = 0
        peakVal = 0
        continue
      }

      if (!wasNegative) continue

      inPeak = true
      if (v > peakVal) {
        peakVal = v
        peakIdx = idx
      }
    }
    if (inPeak && peakVal > CLARITY_THRESHOLD) {
      peaks.push({ idx: peakIdx, value: peakVal })
    }

    if (peaks.length === 0) {
      this.port.postMessage({ frequency: 0, clarity: 0 })
      return
    }

    let globalMax = 0
    for (let i = 0; i < peaks.length; i++) {
      if (peaks[i].value > globalMax) globalMax = peaks[i].value
    }

    // First peak above threshold avoids octave errors from harmonics
    const threshold = MPM_PEAK_RATIO * globalMax
    let chosen = null
    for (let i = 0; i < peaks.length; i++) {
      if (peaks[i].value >= threshold) {
        chosen = peaks[i]
        break
      }
    }

    if (!chosen) {
      this.port.postMessage({ frequency: 0, clarity: 0 })
      return
    }

    let refinedLag = minLag + chosen.idx
    if (chosen.idx > 0 && chosen.idx < this.lagRange - 1) {
      const a = result[chosen.idx - 1]
      const b = result[chosen.idx]
      const c = result[chosen.idx + 1]
      const denom = 2 * (2 * b - a - c)
      if (Math.abs(denom) > 1e-10) {
        refinedLag += (a - c) / denom
      }
    }

    const frequency = sampleRate / refinedLag
    if (frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY) {
      this.port.postMessage({ frequency, clarity: chosen.value })
    } else {
      this.port.postMessage({ frequency: 0, clarity: 0 })
    }
  }
}

registerProcessor('tuner-processor', TunerProcessor)
