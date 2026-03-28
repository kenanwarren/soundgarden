class NAMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.model = null
    this.inputGain = 1.0
    this.outputGain = 1.0
    this.reportedSilentOutput = false
    var self = this
    this.port.onmessage = function(e) {
      if (e.data.type === 'loadModel') {
        try {
          self.model = self._buildModel(e.data.modelData)
          self.port.postMessage({ type: 'modelLoaded', success: true })
        } catch (err) {
          self.port.postMessage({ type: 'modelLoaded', success: false, error: String(err) })
          self.model = null
        }
      } else if (e.data.type === 'unloadModel') {
        self.model = null
      } else if (e.data.type === 'setParam') {
        if (e.data.name === 'inputGain') self.inputGain = e.data.value
        if (e.data.name === 'outputGain') self.outputGain = e.data.value
      }
    }
  }

  process(inputs, outputs) {
    var input = inputs[0]
    var output = outputs[0]
    if (!input || !output) return true

    var numCh = output.length
    var numFrames = output[0].length

    for (var ch = 0; ch < numCh; ch++) {
      if (input[ch]) {
        for (var i = 0; i < numFrames; i++) output[ch][i] = input[ch][i]
      }
    }

    if (!this.model || !input[0]) return true

    try {
      var mono = input[0]
      var outBuf = output[0]
      var inGain = this.inputGain * (this.model.inputScale || 1.0)
      var outGain = this.outputGain
      var forwardBuf = this.model.forwardBuffer

      forwardBuf(mono, outBuf, numFrames, inGain, outGain)

      var inputPeak = 0
      var outputPeak = 0
      for (var i = 0; i < numFrames; i++) {
        var av = mono[i]; if (av < 0) av = -av
        if (av > inputPeak) inputPeak = av
        av = outBuf[i]; if (av < 0) av = -av
        if (av > outputPeak) outputPeak = av
      }

      if (inputPeak > 1e-4 && outputPeak < 1e-6) {
        for (var ch = 0; ch < numCh; ch++) {
          if (!input[ch]) continue
          for (var i = 0; i < numFrames; i++) output[ch][i] = input[ch][i]
        }
        if (!this.reportedSilentOutput) {
          this.reportedSilentOutput = true
          this.port.postMessage({ type: 'modelError', error: 'Model produced near-silent output; falling back to dry signal' })
        }
      } else {
        this.reportedSilentOutput = false
        for (var ch = 1; ch < numCh; ch++) {
          for (var i = 0; i < numFrames; i++) output[ch][i] = outBuf[i]
        }
      }
    } catch (err) {
      this.model = null
      this.port.postMessage({ type: 'modelError', error: String(err) })
    }
    return true
  }

  _buildModel(data) {
    var arch = (data.architecture || '').toLowerCase()
    if (arch === 'wavenet') return this._buildWaveNet(data)
    if (arch === 'lstm') return this._buildLSTM(data)
    throw new Error('Unsupported: ' + data.architecture)
  }

  _buildWaveNet(data) {
    var config = data.config
    var w = data.weights
    var pos = 0
    var conditionValue = this._getConditionValue(data)
    function take(n) { var a = new Float32Array(n); for (var i = 0; i < n; i++) a[i] = w[pos++]; return a }

    var blockConfigs = config.layers || []
    var blocks = []
    for (var b = 0; b < blockConfigs.length; b++) {
      var bc = blockConfigs[b]
      var inSize = bc.input_size || 1, ch = bc.channels || 16, ks = bc.kernel_size || 3
      var dilations = bc.dilations || [], headSize = bc.head_size || 1
      var gated = bc.gated || false, headBias = bc.head_bias || false
      var condSize = bc.condition_size || 0, co = gated ? 2 * ch : ch

      var rechannelW = take(inSize * ch)
      var layers = []
      for (var l = 0; l < dilations.length; l++) {
        var d = dilations[l], bs = d * (ks - 1) + 1
        var cW = take(ch * co * ks), cB = take(co)
        var condW = condSize > 0 ? take(condSize * co) : null
        var mW = take(ch * ch), mB = take(ch)

        var flatKernel = new Float32Array(ks * co * ch)
        for (var k = 0; k < ks; k++) {
          for (var o = 0; o < co; o++) {
            var srcBase = o * ch * ks
            var dstBase = k * co * ch + o * ch
            for (var c = 0; c < ch; c++) {
              flatKernel[dstBase + c] = cW[srcBase + c * ks + k]
            }
          }
        }

        var condBias = null
        if (condW && condSize > 0) {
          condBias = new Float32Array(co)
          if (condSize === 1) {
            for (var o = 0; o < co; o++) condBias[o] = cB[o] + condW[o] * conditionValue
          } else {
            for (var o = 0; o < co; o++) {
              var v = cB[o]
              for (var ci = 0; ci < condSize; ci++) v += condW[ci * co + o] * conditionValue
              condBias[o] = v
            }
          }
        }

        var tapOffsets = new Int32Array(ks)
        for (var k = 0; k < ks; k++) tapOffsets[k] = ((bs - d * (ks - 1 - k)) % bs) * ch

        layers.push({
          bias: condBias || cB,
          mW: mW,
          mB: mB,
          buf: new Float32Array(bs * ch),
          bi: 0,
          bs: bs,
          ks: ks,
          ch: ch,
          co: co,
          flatKernel: flatKernel,
          tapOffsets: tapOffsets,
          tapDelta: ch
        })
      }
      var hW = take(ch * headSize), hB = headBias ? take(headSize) : null
      blocks.push({ inSize: inSize, ch: ch, co: co, ks: ks, gated: gated, hs: headSize, rW: rechannelW, layers: layers, hW: hW, hB: hB, x: new Float32Array(ch), cv: new Float32Array(co) })
    }
    var headScale = w.length > pos ? w[pos] : (config.head_scale || 1.0)

    var numBlocks = blocks.length

    return { forwardBuffer: function(inBuf, outBuf, numFrames, inGain, outGain) {
      for (var i = 0; i < numFrames; i++) {
        var sample = inBuf[i] * inGain
        var ph = null
        for (var b = 0; b < numBlocks; b++) {
          var bl = blocks[b], ch = bl.ch, co = bl.co, x = bl.x, cv = bl.cv, rW = bl.rW
          if (bl.inSize === 1) {
            for (var c = 0; c < ch; c++) x[c] = sample * rW[c]
          } else {
            var inSz = bl.inSize
            for (var c = 0; c < ch; c++) {
              var v = 0, rwBase = c * inSz
              for (var j = 0; j < inSz; j++) v += ph[j] * rW[rwBase + j]
              x[c] = v
            }
          }
          var numLayers = bl.layers.length
          for (var l = 0; l < numLayers; l++) {
            var ly = bl.layers[l], bi = ly.bi, buf = ly.buf, frameBase = bi * ch
            var bias = ly.bias, mW = ly.mW, mB = ly.mB
            var lks = ly.ks, lco = ly.co, fk = ly.flatKernel, tO = ly.tapOffsets

            for (var c = 0; c < ch; c++) buf[frameBase + c] = x[c]

            for (var o = 0; o < lco; o++) cv[o] = bias[o]

            for (var k = 0; k < lks; k++) {
              var bO = tO[k]
              var fkBase = k * lco * ch
              for (var o = 0; o < lco; o++) {
                var kwOff = fkBase + o * ch
                var sum = 0
                for (var c = 0; c < ch; c++) sum += fk[kwOff + c] * buf[bO + c]
                cv[o] += sum
              }
            }

            if (bl.gated) {
              for (var c = 0; c < ch; c++) cv[c] = Math.tanh(cv[c]) * (1 / (1 + Math.exp(-cv[c + ch])))
            } else {
              for (var c = 0; c < lco; c++) cv[c] = Math.tanh(cv[c])
            }

            for (var o = 0; o < ch; o++) {
              var v = mB[o], mBase = o * ch
              for (var c = 0; c < ch; c++) v += mW[mBase + c] * cv[c]
              x[o] = v + buf[frameBase + o]
            }

            ly.bi = bi + 1
            if (ly.bi === ly.bs) ly.bi = 0
            for (var k = 0; k < lks; k++) {
              tO[k] += ch
              if (tO[k] >= ly.bs * ch) tO[k] = 0
            }
          }
          ph = x
          if (bl.hs === 1) { var v = bl.hB ? bl.hB[0] : 0; for (var c = 0; c < ch; c++) v += bl.hW[c] * x[c]; sample = v }
        }
        var s = sample * headScale * outGain
        outBuf[i] = s !== s ? 0 : s
      }
    }, inputScale: this._getInputScale(data) }
  }

  _buildLSTM(data) {
    var cfg = data.config || {}, w = data.weights, pos = 0
    function take(n) { var a = new Float32Array(n); for (var i = 0; i < n; i++) a[i] = w[pos++]; return a }
    var hs = cfg.hidden_size || 32, nl = cfg.num_layers || 1, layers = []
    var hs4 = 4 * hs
    for (var l = 0; l < nl; l++) {
      var is = l === 0 ? (cfg.input_size || 1) : hs
      var Wi = take(hs4 * is), Wh = take(hs4 * hs)
      var biasIH = take(hs4), biasHH = take(hs4)
      var bias = new Float32Array(hs4)
      for (var g = 0; g < hs4; g++) bias[g] = biasIH[g] + biasHH[g]
      layers.push({ Wi: Wi, Wh: Wh, bias: bias, h: new Float32Array(hs), c: new Float32Array(hs), is: is })
    }
    var hW = take(hs), hB = take(1)
    var gates = new Float32Array(hs4)
    var tmpInp = new Float32Array(hs)

    return { forwardBuffer: function(inBuf, outBuf, numFrames, inGain, outGain) {
      for (var i = 0; i < numFrames; i++) {
        var inpVal = inBuf[i] * inGain
        var inp = null, inpLen = 1
        for (var l = 0; l < nl; l++) {
          var ly = layers[l], lyIs = ly.is, lyWi = ly.Wi, lyWh = ly.Wh, lyBias = ly.bias
          var lyH = ly.h, lyC = ly.c

          for (var g = 0; g < hs4; g++) {
            var v = lyBias[g]
            if (inpLen === 1) {
              v += lyWi[g] * inpVal
            } else {
              var wiBase = g * lyIs
              for (var j = 0; j < lyIs; j++) v += lyWi[wiBase + j] * inp[j]
            }
            var whBase = g * hs
            for (var j = 0; j < hs; j++) v += lyWh[whBase + j] * lyH[j]
            gates[g] = v
          }

          for (var j = 0; j < hs; j++) {
            var ig = 1 / (1 + Math.exp(-gates[j]))
            var fg = 1 / (1 + Math.exp(-gates[hs + j]))
            var gg = Math.tanh(gates[2 * hs + j])
            var og = 1 / (1 + Math.exp(-gates[3 * hs + j]))
            lyC[j] = fg * lyC[j] + ig * gg
            lyH[j] = og * Math.tanh(lyC[j])
          }

          inp = lyH
          inpLen = hs
          inpVal = 0
        }
        var out = hB[0] || 0
        for (var j = 0; j < hs; j++) out += hW[j] * inp[j]
        var s = out * outGain
        outBuf[i] = s !== s ? 0 : s
      }
    }, inputScale: this._getInputScale(data) }
  }

  _getInputScale(data) {
    var gain = data && data.metadata ? data.metadata.gain : null
    if (typeof gain === 'number' && gain > 0) {
      var scale = 1 / gain
      if (scale > 64) scale = 64
      if (scale < 0.25) scale = 0.25
      return scale
    }
    return 1.0
  }

  _getConditionValue(data) {
    var gain = data && data.metadata ? data.metadata.gain : null
    if (typeof gain === 'number' && isFinite(gain)) {
      return gain
    }
    return 0.0
  }
}

registerProcessor('nam-processor', NAMProcessor)
