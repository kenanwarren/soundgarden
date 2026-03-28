const BUFFER_SIZE = 4096
const GRAIN_SIZE = 1024
const HOP = 256
const OVERLAP = GRAIN_SIZE / HOP
const DETECT_SIZE = 1024

const SCALES = [
  [0, 2, 4, 5, 7, 9, 11], // major
  [0, 2, 3, 5, 7, 8, 10], // minor
  [0, 2, 3, 5, 7, 9, 10], // dorian
  [0, 2, 4, 5, 7, 9, 10]  // mixolydian
]

class HarmonizerProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.inBuf = new Float32Array(BUFFER_SIZE)
    this.outBuf = new Float32Array(BUFFER_SIZE)
    this.writePos = 0
    this.readPos = 0
    this.hopCounter = 0
    this.detectedSemitones = 0

    this.detectBuf = new Float32Array(DETECT_SIZE)
    this.detectPos = 0
    this.detectCounter = 0

    this.win = new Float32Array(GRAIN_SIZE)
    const scale = 2 * Math.PI / GRAIN_SIZE
    for (let i = 0; i < GRAIN_SIZE; i++) {
      this.win[i] = 0.5 * (1 - Math.cos(scale * i)) / OVERLAP
    }
  }

  static get parameterDescriptors() {
    return [
      { name: 'key', defaultValue: 0, minValue: 0, maxValue: 11, automationRate: 'k-rate' },
      { name: 'scale', defaultValue: 0, minValue: 0, maxValue: 3, automationRate: 'k-rate' },
      { name: 'interval', defaultValue: 3, minValue: -7, maxValue: 7, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 0.5, minValue: 0, maxValue: 1.0, automationRate: 'k-rate' }
    ]
  }

  detectPitch() {
    const buf = this.detectBuf
    const n = DETECT_SIZE

    let rms = 0
    for (let i = 0; i < n; i++) rms += buf[i] * buf[i]
    rms = Math.sqrt(rms / n)
    if (rms < 0.01) return -1

    let bestCorr = 0
    let bestLag = 0
    const minLag = Math.floor(sampleRate / 2000) // ~2000Hz max
    const maxLag = Math.floor(sampleRate / 60)    // ~60Hz min

    for (let lag = minLag; lag <= maxLag && lag < n; lag++) {
      let corr = 0
      let norm1 = 0
      let norm2 = 0
      for (let j = 0; j < n - lag; j++) {
        corr += buf[j] * buf[j + lag]
        norm1 += buf[j] * buf[j]
        norm2 += buf[j + lag] * buf[j + lag]
      }
      const normCorr = corr / (Math.sqrt(norm1 * norm2) + 1e-10)
      if (normCorr > bestCorr) {
        bestCorr = normCorr
        bestLag = lag
      }
    }

    if (bestCorr < 0.8 || bestLag === 0) return -1
    const freq = sampleRate / bestLag
    return 12 * Math.log2(freq / 440) + 69
  }

  getHarmonySemitones(midi, key, scaleIdx, interval) {
    const scaleNotes = SCALES[scaleIdx] || SCALES[0]
    const noteInOctave = ((Math.round(midi) % 12) - key + 12) % 12

    let degree = 0
    let minDist = 12
    for (let i = 0; i < scaleNotes.length; i++) {
      const dist = Math.abs(noteInOctave - scaleNotes[i])
      if (dist < minDist) {
        minDist = dist
        degree = i
      }
    }

    let targetDegree = degree + interval
    let octaveShift = 0
    while (targetDegree < 0) { targetDegree += scaleNotes.length; octaveShift-- }
    while (targetDegree >= scaleNotes.length) { targetDegree -= scaleNotes.length; octaveShift++ }

    const targetNote = key + scaleNotes[targetDegree] + octaveShift * 12
    const currentNote = key + scaleNotes[degree]
    return targetNote - currentNote
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const key = Math.round(parameters.key[0])
    const scaleIdx = Math.round(parameters.scale[0])
    const interval = Math.round(parameters.interval[0])
    const mix = parameters.mix[0]
    const dry = 1 - mix
    const n = input[0].length
    const mask = BUFFER_SIZE - 1

    for (let i = 0; i < n; i++) {
      const mono = input[0][i]

      this.detectBuf[this.detectPos] = mono
      this.detectPos = (this.detectPos + 1) % DETECT_SIZE
      this.detectCounter++
      if (this.detectCounter >= DETECT_SIZE) {
        this.detectCounter = 0
        const midi = this.detectPitch()
        if (midi > 0) {
          this.detectedSemitones = this.getHarmonySemitones(midi, key, scaleIdx, interval)
        }
      }

      const semitones = this.detectedSemitones
      if (Math.abs(semitones) < 0.01) {
        for (let ch = 0; ch < output.length; ch++) {
          output[ch][i] = input[ch] ? input[ch][i] : mono
        }
        continue
      }

      const pitchRatio = Math.pow(2, semitones / 12)
      const wp = this.writePos
      this.inBuf[wp] = mono

      this.hopCounter++
      if (this.hopCounter >= HOP) {
        this.hopCounter = 0
        const grainStart = (wp - GRAIN_SIZE + 1 + BUFFER_SIZE) & mask
        for (let g = 0; g < GRAIN_SIZE; g++) {
          const srcG = (g * pitchRatio) | 0
          if (srcG >= GRAIN_SIZE) break
          const src = this.inBuf[(grainStart + srcG) & mask]
          const outIdx = (this.readPos + g) & mask
          this.outBuf[outIdx] += src * this.win[g]
        }
        this.readPos = (this.readPos + HOP) & mask
      }

      const rp = (this.readPos - HOP + this.hopCounter + BUFFER_SIZE) & mask
      const shifted = this.outBuf[rp]
      this.outBuf[rp] = 0

      for (let ch = 0; ch < output.length; ch++) {
        const d = input[ch] ? input[ch][i] : mono
        output[ch][i] = d * dry + shifted * mix
      }

      this.writePos = (wp + 1) & mask
    }
    return true
  }
}

registerProcessor('harmonizer-processor', HarmonizerProcessor)
