const MAX_LOOP_SECONDS = 30

class LooperProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.maxSamples = Math.floor(MAX_LOOP_SECONDS * sampleRate)
    this.loopBuf = new Float32Array(this.maxSamples)
    this.undoBuf = new Float32Array(this.maxSamples)
    this.loopLength = 0
    this.position = 0
    this.state = 'idle' // idle, recording, playing, overdubbing, stopped
    this.hasUndo = false

    this.port.onmessage = (e) => {
      const cmd = e.data.type
      switch (cmd) {
        case 'record':
          if (this.state === 'idle' || this.state === 'stopped') {
            this.loopBuf.fill(0)
            this.loopLength = 0
            this.position = 0
            this.state = 'recording'
          }
          break
        case 'play':
          if (this.loopLength > 0) {
            this.position = 0
            this.state = 'playing'
          }
          break
        case 'overdub':
          if (this.loopLength > 0) {
            this.undoBuf.set(this.loopBuf)
            this.hasUndo = true
            this.state = 'overdubbing'
          }
          break
        case 'stop':
          if (this.state === 'recording' && this.position > 0) {
            this.loopLength = this.position
            this.position = 0
          }
          this.state = this.loopLength > 0 ? 'stopped' : 'idle'
          break
        case 'clear':
          this.loopBuf.fill(0)
          this.undoBuf.fill(0)
          this.loopLength = 0
          this.position = 0
          this.hasUndo = false
          this.state = 'idle'
          break
        case 'undo':
          if (this.hasUndo) {
            const tmp = this.loopBuf
            this.loopBuf = this.undoBuf
            this.undoBuf = tmp
            this.hasUndo = false
          }
          break
      }
      this.port.postMessage({ type: 'stateChange', state: this.state })
    }

    this.posReportCounter = 0
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'inputLevel',
        defaultValue: 1.0,
        minValue: 0,
        maxValue: 2.0,
        automationRate: 'k-rate'
      },
      {
        name: 'loopLevel',
        defaultValue: 1.0,
        minValue: 0,
        maxValue: 1.0,
        automationRate: 'k-rate'
      },
      {
        name: 'overdubLevel',
        defaultValue: 0.8,
        minValue: 0,
        maxValue: 1.0,
        automationRate: 'k-rate'
      }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const inputLevel = parameters.inputLevel[0]
    const loopLevel = parameters.loopLevel[0]
    const overdubLevel = parameters.overdubLevel[0]
    const n = input[0].length

    for (let i = 0; i < n; i++) {
      const mono = (input[0][i] || 0) * inputLevel

      switch (this.state) {
        case 'recording':
          if (this.position < this.maxSamples) {
            this.loopBuf[this.position] = mono
            this.position++
          } else {
            this.loopLength = this.maxSamples
            this.position = 0
            this.state = 'playing'
            this.port.postMessage({ type: 'stateChange', state: this.state })
          }
          for (let ch = 0; ch < output.length; ch++) {
            output[ch][i] = input[ch] ? input[ch][i] : mono
          }
          break

        case 'playing': {
          const loopSample = this.loopBuf[this.position] * loopLevel
          for (let ch = 0; ch < output.length; ch++) {
            output[ch][i] = (input[ch] ? input[ch][i] : mono) + loopSample
          }
          this.position = (this.position + 1) % this.loopLength
          break
        }

        case 'overdubbing': {
          const existing = this.loopBuf[this.position] * overdubLevel
          this.loopBuf[this.position] = existing + mono
          const loopOut = this.loopBuf[this.position] * loopLevel
          for (let ch = 0; ch < output.length; ch++) {
            output[ch][i] = (input[ch] ? input[ch][i] : mono) + loopOut
          }
          this.position = (this.position + 1) % this.loopLength
          break
        }

        default:
          for (let ch = 0; ch < output.length; ch++) {
            output[ch][i] = input[ch] ? input[ch][i] : mono
          }
          break
      }
    }

    this.posReportCounter += n
    if (this.posReportCounter >= 4800 && this.loopLength > 0) {
      this.posReportCounter = 0
      this.port.postMessage({ type: 'position', position: this.position / this.loopLength })
    }

    return true
  }
}

registerProcessor('looper-processor', LooperProcessor)
