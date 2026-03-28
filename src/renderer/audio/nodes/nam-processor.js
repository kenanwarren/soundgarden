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

    for (var ch = 0; ch < output.length; ch++) {
      if (input[ch]) {
        for (var i = 0; i < output[ch].length; i++) output[ch][i] = input[ch][i]
      }
    }

    if (!this.model || !input[0]) return true

    try {
      var modelInputScale = this.model.inputScale || 1.0
      var inGain = this.inputGain * modelInputScale
      var outGain = this.outputGain
      var mono = input[0]
      var inputPeak = 0
      var outputPeak = 0
      for (var i = 0; i < output[0].length; i++) {
        var dry = mono[i]
        if (Math.abs(dry) > inputPeak) inputPeak = Math.abs(dry)
        var s = this.model.forward(dry * inGain) * outGain
        if (s !== s) s = 0
        if (Math.abs(s) > outputPeak) outputPeak = Math.abs(s)
        for (var ch = 0; ch < output.length; ch++) output[ch][i] = s
      }

      if (inputPeak > 1e-4 && outputPeak < 1e-6) {
        for (var ch = 0; ch < output.length; ch++) {
          if (!input[ch]) continue
          for (var i = 0; i < output[ch].length; i++) output[ch][i] = input[ch][i]
        }
        if (!this.reportedSilentOutput) {
          this.reportedSilentOutput = true
          this.port.postMessage({ type: 'modelError', error: 'Model produced near-silent output; falling back to dry signal' })
        }
      } else {
        this.reportedSilentOutput = false
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
        var kernelWeights = new Array(ks)
        for (var k = 0; k < ks; k++) kernelWeights[k] = new Float32Array(co * ch)
        for (var o = 0; o < co; o++) {
          var srcBase = o * ch * ks
          var dstBase = o * ch
          for (var c = 0; c < ch; c++) {
            var src = srcBase + c * ks
            for (var k = 0; k < ks; k++) kernelWeights[k][dstBase + c] = cW[src + k]
          }
        }
        var tapSamples = new Int32Array(ks)
        for (var k = 0; k < ks; k++) tapSamples[k] = (bs - d * (ks - 1 - k)) % bs
        layers.push({
          cB: cB,
          condW: condW,
          condSize: condSize,
          mW: mW,
          mB: mB,
          buf: new Float32Array(bs * ch),
          bi: 0,
          bs: bs,
          ks: ks,
          ch: ch,
          co: co,
          kernelWeights: kernelWeights,
          tapSamples: tapSamples
        })
      }
      var hW = take(ch * headSize), hB = headBias ? take(headSize) : null
      blocks.push({ inSize: inSize, ch: ch, co: co, ks: ks, gated: gated, hs: headSize, rW: rechannelW, layers: layers, hW: hW, hB: hB, x: new Float32Array(ch), cv: new Float32Array(co) })
    }
    var headScale = w.length > pos ? w[pos] : (config.head_scale || 1.0)

    return { forward: function(sample) {
      var ph = null
      for (var b = 0; b < blocks.length; b++) {
        var bl = blocks[b], ch = bl.ch, co = bl.co, x = bl.x, cv = bl.cv
        if (bl.inSize === 1) {
          for (var c = 0; c < ch; c++) x[c] = sample * bl.rW[c]
        } else {
          for (var c = 0; c < ch; c++) {
            var v = 0
            var rwBase = c * bl.inSize
            for (var j = 0; j < bl.inSize; j++) v += ph[j] * bl.rW[rwBase + j]
            x[c] = v
          }
        }
        for (var l = 0; l < bl.layers.length; l++) {
          var ly = bl.layers[l], bi = ly.bi, buf = ly.buf, frameBase = bi * ch
          for (var c = 0; c < ch; c++) buf[frameBase + c] = x[c]
          for (var o = 0; o < co; o++) cv[o] = ly.cB[o]
          if (ly.condW && ly.condSize > 0) {
            if (ly.condSize === 1) {
              for (var o = 0; o < co; o++) cv[o] += ly.condW[o] * conditionValue
            } else {
              for (var o = 0; o < co; o++) {
                for (var ci = 0; ci < ly.condSize; ci++) {
                  cv[o] += ly.condW[ci * co + o] * conditionValue
                }
              }
            }
          }
          for (var k = 0; k < ly.ks; k++) {
            var bO = ly.tapSamples[k] * ch
            var kw = ly.kernelWeights[k]
            for (var o = 0; o < co; o++) {
              var kwBase = o * ch
              var sum = 0
              for (var c = 0; c < ch; c++) sum += kw[kwBase + c] * buf[bO + c]
              cv[o] += sum
            }
          }
          if (bl.gated) { for (var c = 0; c < ch; c++) cv[c] = Math.tanh(cv[c]) * (1 / (1 + Math.exp(-cv[c + ch]))) }
          else { for (var c = 0; c < co; c++) cv[c] = Math.tanh(cv[c]) }
          for (var o = 0; o < ch; o++) {
            var v = ly.mB[o]
            var mBase = o * ch
            for (var c = 0; c < ch; c++) v += ly.mW[mBase + c] * cv[c]
            x[o] = v + buf[frameBase + o]
          }
          ly.bi = bi + 1
          if (ly.bi === ly.bs) ly.bi = 0
          for (var k = 0; k < ly.ks; k++) {
            var nextTap = ly.tapSamples[k] + 1
            if (nextTap === ly.bs) nextTap = 0
            ly.tapSamples[k] = nextTap
          }
        }
        ph = x
        if (bl.hs === 1) { var v = bl.hB ? bl.hB[0] : 0; for (var c = 0; c < ch; c++) v += bl.hW[c] * x[c]; sample = v }
      }
      return sample * headScale
    }, inputScale: this._getInputScale(data) }
  }

  _buildLSTM(data) {
    var cfg = data.config || {}, w = data.weights, pos = 0
    function take(n) { var a = new Float32Array(n); for (var i = 0; i < n; i++) a[i] = w[pos++]; return a }
    var hs = cfg.hidden_size || 32, nl = cfg.num_layers || 1, layers = []
    for (var l = 0; l < nl; l++) {
      var is = l === 0 ? (cfg.input_size || 1) : hs
      var Wi = take(4*hs*is), Wh = take(4*hs*hs)
      var biasIH = take(4*hs), biasHH = take(4*hs)
      var bias = new Float32Array(4*hs)
      for (var g = 0; g < 4*hs; g++) bias[g] = biasIH[g] + biasHH[g]
      layers.push({ Wi: Wi, Wh: Wh, bias: bias, h: new Float32Array(hs), c: new Float32Array(hs), is: is })
    }
    var hW = take(hs), hB = take(1), gates = new Float32Array(4 * hs)
    return { forward: function(sample) {
      var inp = [sample]
      for (var l = 0; l < nl; l++) {
        var ly = layers[l]
        for (var g = 0; g < 4*hs; g++) { var v = ly.bias[g]; for (var j = 0; j < ly.is; j++) v += ly.Wi[g*ly.is+j]*inp[j]; for (var j = 0; j < hs; j++) v += ly.Wh[g*hs+j]*ly.h[j]; gates[g] = v }
        for (var j = 0; j < hs; j++) { var ig=1/(1+Math.exp(-gates[j])),fg=1/(1+Math.exp(-gates[hs+j])),gg=Math.tanh(gates[2*hs+j]),og=1/(1+Math.exp(-gates[3*hs+j])); ly.c[j]=fg*ly.c[j]+ig*gg; ly.h[j]=og*Math.tanh(ly.c[j]) }
        inp = ly.h
      }
      var out = hB[0]||0; for (var j = 0; j < hs; j++) out += hW[j]*inp[j]; return out
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
