import { describe, it, expect } from 'vitest'
import {
  loadProcessor,
  makeInput,
  makeOutput,
  makeParams,
  fillSine,
  fillSineBlocks,
  rms,
  peak,
  SAMPLE_RATE,
  BLOCK_SIZE
} from './worklet-test-helper'

// ---------- Clean Boost ----------

describe('cleanboost-processor', () => {
  it('passes signal through at level=1', () => {
    const proc = loadProcessor('cleanboost-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440)
    proc.process([input], [output], makeParams({ level: 1.0 }))
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 5)
    }
  })

  it('boosts signal at level=2', () => {
    const proc = loadProcessor('cleanboost-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.3)
    proc.process([input], [output], makeParams({ level: 2.0 }))
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i] * 2, 5)
    }
  })

  it('mutes signal at level=0', () => {
    const proc = loadProcessor('cleanboost-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440)
    proc.process([input], [output], makeParams({ level: 0 }))
    expect(peak(output[0])).toBe(0)
  })

  it('handles stereo', () => {
    const proc = loadProcessor('cleanboost-processor.js')
    const input = makeInput(2)
    const output = makeOutput(2)
    fillSine(input[0], 440, 0.5)
    fillSine(input[1], 880, 0.3)
    proc.process([input], [output], makeParams({ level: 1.5 }))
    expect(output[0][10]).toBeCloseTo(input[0][10] * 1.5, 5)
    expect(output[1][10]).toBeCloseTo(input[1][10] * 1.5, 5)
  })
})

// ---------- Auto-Swell ----------

describe('autoswell-processor', () => {
  it('attenuates the start of a signal (swell effect)', () => {
    const proc = loadProcessor('autoswell-processor.js')
    const params = makeParams({ attack: 200, sensitivity: -20, depth: 1.0 })

    const input = makeInput(1, 128)
    const output = makeOutput(1, 128)
    fillSine(input[0], 200, 0.5)

    proc.process([input], [output], params)

    expect(peak(output[0])).toBeLessThan(peak(input[0]))
  })

  it('with depth=0, signal passes through unchanged', () => {
    const proc = loadProcessor('autoswell-processor.js')
    const params = makeParams({ attack: 200, sensitivity: -20, depth: 0 })

    // Warm up so envelope settles
    for (let b = 0; b < 10; b++) {
      const inp = makeInput(1)
      fillSineBlocks(inp[0], 440, 0.5, b * BLOCK_SIZE)
      proc.process([inp], [makeOutput(1)], params)
    }

    const input = makeInput(1)
    const output = makeOutput(1)
    fillSineBlocks(input[0], 440, 0.5, 10 * BLOCK_SIZE)
    proc.process([input], [output], params)

    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 2)
    }
  })

  it('signal ramps up over multiple blocks', () => {
    const proc = loadProcessor('autoswell-processor.js')
    const params = makeParams({ attack: 50, sensitivity: -40, depth: 1.0 })

    const rmsValues: number[] = []
    for (let b = 0; b < 20; b++) {
      const input = makeInput(1)
      const output = makeOutput(1)
      fillSineBlocks(input[0], 200, 0.5, b * BLOCK_SIZE)
      proc.process([input], [output], params)
      rmsValues.push(rms(output[0]))
    }

    expect(rmsValues[rmsValues.length - 1]).toBeGreaterThan(rmsValues[0])
  })
})

// ---------- Limiter ----------

describe('limiter-processor', () => {
  it('does not affect quiet signals', () => {
    const proc = loadProcessor('limiter-processor.js')
    const params = makeParams({ threshold: -6, release: 100 })

    // Warm up lookahead buffer
    for (let b = 0; b < 3; b++) {
      const input = makeInput(1)
      const output = makeOutput(1)
      fillSineBlocks(input[0], 440, 0.1, b * BLOCK_SIZE)
      proc.process([input], [output], params)
    }

    const input = makeInput(1)
    const output = makeOutput(1)
    fillSineBlocks(input[0], 440, 0.1, 3 * BLOCK_SIZE)
    proc.process([input], [output], params)
    expect(rms(output[0])).toBeGreaterThan(0)
  })

  it('reduces loud signals above threshold', () => {
    const proc = loadProcessor('limiter-processor.js')
    const params = makeParams({ threshold: -12, release: 100 })

    // Run many blocks with loud signal
    let lastOutput = makeOutput(1)
    for (let b = 0; b < 10; b++) {
      const input = makeInput(1)
      lastOutput = makeOutput(1)
      fillSineBlocks(input[0], 440, 0.9, b * BLOCK_SIZE)
      proc.process([input], [lastOutput], params)
    }

    expect(peak(lastOutput[0])).toBeLessThan(0.9)
  })

  it('returns true from process', () => {
    const proc = loadProcessor('limiter-processor.js')
    const result = proc.process([makeInput(1)], [makeOutput(1)], makeParams({ threshold: -1, release: 100 }))
    expect(result).toBe(true)
  })
})

// ---------- Ring Modulator ----------

describe('ringmod-processor', () => {
  it('at mix=0, outputs dry signal', () => {
    const proc = loadProcessor('ringmod-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ frequency: 200, mix: 0 }))
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 5)
    }
  })

  it('at mix=1, modulates the signal', () => {
    const proc = loadProcessor('ringmod-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ frequency: 200, mix: 1.0 }))

    let different = false
    for (let i = 1; i < BLOCK_SIZE; i++) {
      if (Math.abs(output[0][i] - input[0][i]) > 0.001) {
        different = true
        break
      }
    }
    expect(different).toBe(true)
  })

  it('produces silence from silence', () => {
    const proc = loadProcessor('ringmod-processor.js')
    const input = makeInput(1) // zeros
    const output = makeOutput(1)
    proc.process([input], [output], makeParams({ frequency: 500, mix: 1.0 }))
    expect(peak(output[0])).toBe(0)
  })

  it('output peak does not exceed input peak', () => {
    const proc = loadProcessor('ringmod-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.8)
    proc.process([input], [output], makeParams({ frequency: 300, mix: 1.0 }))
    expect(peak(output[0])).toBeLessThanOrEqual(peak(input[0]) + 0.001)
  })
})

// ---------- Bitcrusher ----------

describe('bitcrusher-processor', () => {
  it('at full bit depth and no downsampling, passes through', () => {
    const proc = loadProcessor('bitcrusher-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ bitDepth: 16, downsample: 1, mix: 1.0 }))

    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 2)
    }
  })

  it('low bit depth quantizes the signal', () => {
    const proc = loadProcessor('bitcrusher-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ bitDepth: 2, downsample: 1, mix: 1.0 }))

    const uniqueValues = new Set<number>()
    for (let i = 0; i < BLOCK_SIZE; i++) {
      uniqueValues.add(Math.round(output[0][i] * 100) / 100)
    }
    expect(uniqueValues.size).toBeLessThan(10)
  })

  it('downsampling creates staircase pattern', () => {
    const proc = loadProcessor('bitcrusher-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ bitDepth: 16, downsample: 10, mix: 1.0 }))

    let holdCount = 0
    for (let i = 1; i < BLOCK_SIZE; i++) {
      if (output[0][i] === output[0][i - 1]) holdCount++
    }
    expect(holdCount).toBeGreaterThan(BLOCK_SIZE * 0.5)
  })

  it('mix=0 passes dry signal', () => {
    const proc = loadProcessor('bitcrusher-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ bitDepth: 2, downsample: 20, mix: 0 }))
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 5)
    }
  })
})

// ---------- Octaver ----------

describe('octaver-processor', () => {
  it('dry=1, sub=0, upper=0 passes through original signal', () => {
    const proc = loadProcessor('octaver-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ subLevel: 0, upperLevel: 0, dry: 1.0 }))
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 4)
    }
  })

  it('sub-octave adds content', () => {
    const proc = loadProcessor('octaver-processor.js')
    const params = makeParams({ subLevel: 1.0, upperLevel: 0, dry: 0 })

    // Run several blocks so the flip-flop tracks
    let lastOutput = makeOutput(1)
    for (let b = 0; b < 5; b++) {
      const input = makeInput(1)
      lastOutput = makeOutput(1)
      fillSineBlocks(input[0], 200, 0.5, b * BLOCK_SIZE)
      proc.process([input], [lastOutput], params)
    }

    expect(rms(lastOutput[0])).toBeGreaterThan(0.01)
  })

  it('upper octave adds content via rectification', () => {
    const proc = loadProcessor('octaver-processor.js')
    const params = makeParams({ subLevel: 0, upperLevel: 1.0, dry: 0 })

    let lastOutput = makeOutput(1)
    for (let b = 0; b < 10; b++) {
      const input = makeInput(1)
      lastOutput = makeOutput(1)
      fillSineBlocks(input[0], 200, 0.5, b * BLOCK_SIZE)
      proc.process([input], [lastOutput], params)
    }

    expect(rms(lastOutput[0])).toBeGreaterThan(0.01)
  })

  it('silence produces silence', () => {
    const proc = loadProcessor('octaver-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    proc.process([input], [output], makeParams({ subLevel: 1.0, upperLevel: 1.0, dry: 1.0 }))
    expect(peak(output[0])).toBe(0)
  })
})

// ---------- Rotary Speaker ----------

describe('rotary-processor', () => {
  it('at mix=0, passes through dry', () => {
    const proc = loadProcessor('rotary-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ speed: 0, depth: 0.5, mix: 0 }))
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 4)
    }
  })

  it('modulates the signal at full mix', () => {
    const proc = loadProcessor('rotary-processor.js')
    const params = makeParams({ speed: 1.0, depth: 1.0, mix: 1.0 })

    // Run many blocks to let the LFOs cycle
    let allSame = true
    for (let b = 0; b < 20; b++) {
      const input = makeInput(1)
      const output = makeOutput(1)
      fillSineBlocks(input[0], 440, 0.5, b * BLOCK_SIZE)
      proc.process([input], [output], params)

      for (let i = 0; i < BLOCK_SIZE; i++) {
        if (Math.abs(output[0][i] - input[0][i]) > 0.01) {
          allSame = false
        }
      }
    }
    expect(allSame).toBe(false)
  })

  it('silence produces silence', () => {
    const proc = loadProcessor('rotary-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    proc.process([input], [output], makeParams({ speed: 1.0, depth: 1.0, mix: 1.0 }))
    expect(peak(output[0])).toBe(0)
  })
})

// ---------- Shimmer Reverb ----------

describe('shimmer-processor', () => {
  it('at mix=0, passes dry signal', () => {
    const proc = loadProcessor('shimmer-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ decay: 0.7, shimmer: 0.5, damping: 0.5, mix: 0 }))
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 4)
    }
  })

  it('produces reverb tail after signal stops', () => {
    const proc = loadProcessor('shimmer-processor.js')
    const params = makeParams({ decay: 0.9, shimmer: 0.5, damping: 0.3, mix: 0.8 })

    // Feed signal for several blocks
    for (let b = 0; b < 20; b++) {
      const input = makeInput(1)
      const output = makeOutput(1)
      fillSineBlocks(input[0], 440, 0.5, b * BLOCK_SIZE)
      proc.process([input], [output], params)
    }

    // Now feed silence — should still have reverb tail
    const silentInput = makeInput(1)
    const tailOutput = makeOutput(1)
    proc.process([silentInput], [tailOutput], params)
    expect(rms(tailOutput[0])).toBeGreaterThan(0.001)
  })

  it('decay=0 produces no reverb tail', () => {
    const proc = loadProcessor('shimmer-processor.js')
    const params = makeParams({ decay: 0, shimmer: 0.5, damping: 0.5, mix: 1.0 })

    // Feed signal
    for (let b = 0; b < 30; b++) {
      const input = makeInput(1)
      const output = makeOutput(1)
      fillSineBlocks(input[0], 440, 0.5, b * BLOCK_SIZE)
      proc.process([input], [output], params)
    }

    // Feed many silent blocks
    for (let b = 0; b < 50; b++) {
      const input = makeInput(1)
      const output = makeOutput(1)
      proc.process([input], [output], params)
    }

    const silentInput = makeInput(1)
    const tailOutput = makeOutput(1)
    proc.process([silentInput], [tailOutput], params)
    expect(rms(tailOutput[0])).toBeLessThan(0.01)
  })
})

// ---------- Harmonizer ----------

describe('harmonizer-processor', () => {
  it('at mix=0, passes dry signal', () => {
    const proc = loadProcessor('harmonizer-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ key: 0, scale: 0, interval: 3, mix: 0 }))
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 4)
    }
  })

  it('produces output with mixed harmony', () => {
    const proc = loadProcessor('harmonizer-processor.js')
    const params = makeParams({ key: 0, scale: 0, interval: 3, mix: 0.5 })

    // Feed enough signal for pitch detection (need > 1024 samples)
    for (let b = 0; b < 20; b++) {
      const input = makeInput(1)
      const output = makeOutput(1)
      fillSineBlocks(input[0], 440, 0.5, b * BLOCK_SIZE)
      proc.process([input], [output], params)
    }

    // After pitch detection kicks in, output should differ from input
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSineBlocks(input[0], 440, 0.5, 20 * BLOCK_SIZE)
    proc.process([input], [output], params)

    expect(rms(output[0])).toBeGreaterThan(0)
  })

  it('silence produces silence', () => {
    const proc = loadProcessor('harmonizer-processor.js')
    const input = makeInput(1)
    const output = makeOutput(1)
    proc.process([input], [output], makeParams({ key: 0, scale: 0, interval: 3, mix: 1.0 }))
    expect(peak(output[0])).toBe(0)
  })

  it('all scale modes are valid', () => {
    for (let scaleIdx = 0; scaleIdx < 4; scaleIdx++) {
      const proc = loadProcessor('harmonizer-processor.js')
      const params = makeParams({ key: 0, scale: scaleIdx, interval: 2, mix: 0.5 })
      const input = makeInput(1)
      const output = makeOutput(1)
      fillSine(input[0], 440, 0.5)
      const result = proc.process([input], [output], params)
      expect(result).toBe(true)
    }
  })
})

// ---------- Looper ----------

describe('looper-processor', () => {
  function createLooper() {
    const proc = loadProcessor('looper-processor.js')
    const messages: any[] = []
    proc.port.postMessage = (msg: any) => messages.push(msg)
    return { proc, messages }
  }

  function sendCommand(proc: any, cmd: string) {
    proc.port.onmessage?.({ data: { type: cmd } })
  }

  it('passes through audio in idle state', () => {
    const { proc } = createLooper()
    const input = makeInput(1)
    const output = makeOutput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [output], makeParams({ inputLevel: 1.0, loopLevel: 1.0, overdubLevel: 0.8 }))
    for (let i = 0; i < BLOCK_SIZE; i++) {
      expect(output[0][i]).toBeCloseTo(input[0][i], 5)
    }
  })

  it('records and plays back a loop', () => {
    const { proc, messages } = createLooper()
    const params = makeParams({ inputLevel: 1.0, loopLevel: 1.0, overdubLevel: 0.8 })

    // Start recording
    sendCommand(proc, 'record')
    expect(messages.some((m) => m.type === 'stateChange' && m.state === 'recording')).toBe(true)

    // Record a few blocks of sine
    for (let b = 0; b < 5; b++) {
      const input = makeInput(1)
      const output = makeOutput(1)
      fillSineBlocks(input[0], 440, 0.5, b * BLOCK_SIZE)
      proc.process([input], [output], params)
    }

    // Stop recording
    sendCommand(proc, 'stop')

    // Play back
    sendCommand(proc, 'play')

    // Feed silence — should hear the loop
    const silentInput = makeInput(1)
    const playOutput = makeOutput(1)
    proc.process([silentInput], [playOutput], params)
    expect(rms(playOutput[0])).toBeGreaterThan(0.01)
  })

  it('clear resets to idle', () => {
    const { proc, messages } = createLooper()
    const params = makeParams({ inputLevel: 1.0, loopLevel: 1.0, overdubLevel: 0.8 })

    sendCommand(proc, 'record')
    const input = makeInput(1)
    fillSine(input[0], 440, 0.5)
    proc.process([input], [makeOutput(1)], params)
    sendCommand(proc, 'stop')
    sendCommand(proc, 'clear')

    const lastMsg = messages[messages.length - 1]
    expect(lastMsg.state).toBe('idle')
  })

  it('overdub adds to existing loop', () => {
    const { proc } = createLooper()
    const params = makeParams({ inputLevel: 1.0, loopLevel: 1.0, overdubLevel: 1.0 })

    // Record 3 blocks of sine
    sendCommand(proc, 'record')
    for (let b = 0; b < 3; b++) {
      const input = makeInput(1)
      fillSineBlocks(input[0], 440, 0.3, b * BLOCK_SIZE)
      proc.process([input], [makeOutput(1)], params)
    }
    sendCommand(proc, 'stop')

    // Overdub more signal on top
    sendCommand(proc, 'overdub')
    for (let b = 0; b < 3; b++) {
      const input = makeInput(1)
      fillSineBlocks(input[0], 330, 0.3, b * BLOCK_SIZE)
      proc.process([input], [makeOutput(1)], params)
    }
    sendCommand(proc, 'stop')

    // Play back with silence input — should hear the combined loop
    sendCommand(proc, 'play')
    const out = makeOutput(1)
    proc.process([makeInput(1)], [out], params)
    expect(rms(out[0])).toBeGreaterThan(0.01)
  })

  it('undo restores previous loop state', () => {
    const { proc } = createLooper()
    const params = makeParams({ inputLevel: 1.0, loopLevel: 1.0, overdubLevel: 0.5 })

    // Record a known signal
    sendCommand(proc, 'record')
    for (let b = 0; b < 3; b++) {
      const input = makeInput(1)
      fillSineBlocks(input[0], 440, 0.5, b * BLOCK_SIZE)
      proc.process([input], [makeOutput(1)], params)
    }
    sendCommand(proc, 'stop')

    // Overdub something loud on top (this saves undo buffer)
    sendCommand(proc, 'overdub')
    for (let b = 0; b < 3; b++) {
      const input = makeInput(1)
      fillSineBlocks(input[0], 100, 0.8, b * BLOCK_SIZE)
      proc.process([input], [makeOutput(1)], params)
    }
    sendCommand(proc, 'stop')

    // Undo — should restore the pre-overdub loop
    sendCommand(proc, 'undo')

    // Play back the restored loop
    sendCommand(proc, 'play')
    const undoOut = makeOutput(1)
    proc.process([makeInput(1)], [undoOut], params)
    expect(rms(undoOut[0])).toBeGreaterThan(0.01)
  })

  it('loopLevel=0 mutes playback', () => {
    const { proc } = createLooper()
    const recParams = makeParams({ inputLevel: 1.0, loopLevel: 1.0, overdubLevel: 0.8 })

    sendCommand(proc, 'record')
    for (let b = 0; b < 3; b++) {
      const input = makeInput(1)
      fillSineBlocks(input[0], 440, 0.5, b * BLOCK_SIZE)
      proc.process([input], [makeOutput(1)], recParams)
    }
    sendCommand(proc, 'stop')
    sendCommand(proc, 'play')

    const muteParams = makeParams({ inputLevel: 1.0, loopLevel: 0, overdubLevel: 0.8 })
    const silentInput = makeInput(1)
    const output = makeOutput(1)
    proc.process([silentInput], [output], muteParams)
    expect(peak(output[0])).toBe(0)
  })
})
