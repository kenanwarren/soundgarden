class GainDriveProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'gain', defaultValue: 1.0, minValue: 0, maxValue: 4.0, automationRate: 'a-rate' },
      { name: 'drive', defaultValue: 0, minValue: 0, maxValue: 1.0, automationRate: 'a-rate' }
    ]
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || !input[0]) return true

    const gain = parameters.gain
    const drive = parameters.drive

    for (let ch = 0; ch < output.length; ch++) {
      if (!input[ch]) continue

      for (let i = 0; i < input[ch].length; i++) {
        const g = gain.length > 1 ? gain[i] : gain[0]
        const d = drive.length > 1 ? drive[i] : drive[0]

        let sample = input[ch][i] * g

        if (d > 0) {
          const driveAmount = 1 + d * 10
          const clipped = Math.tanh(sample * driveAmount) / Math.tanh(driveAmount)
          sample = sample * (1 - d) + clipped * d
        }

        output[ch][i] = sample
      }
    }

    return true
  }
}

registerProcessor('gain-drive-processor', GainDriveProcessor)
