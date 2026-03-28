class CleanBoostProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'level', defaultValue: 1.0, minValue: 0, maxValue: 4.0, automationRate: 'k-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    if (!input || !input[0]) return true

    const level = parameters.level[0]
    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue
      const inp = input[ch]
      const out = output[ch]
      for (let i = 0; i < inp.length; i++) {
        out[i] = inp[i] * level
      }
    }
    return true
  }
}

registerProcessor('cleanboost-processor', CleanBoostProcessor)
