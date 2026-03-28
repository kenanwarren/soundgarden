import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

function countWaveNetWeights(config: any): number {
  let total = 0
  for (const bc of config.layers) {
    const ch = bc.channels || 16
    const ks = bc.kernel_size || 3
    const dilations: number[] = bc.dilations || []
    const gated = bc.gated || false
    const co = gated ? 2 * ch : ch
    const condSize = bc.condition_size || 0

    total += (bc.input_size || 1) * ch // rechannel, no bias
    for (let l = 0; l < dilations.length; l++) {
      total += ch * co * ks + co // conv weight + bias
      total += ch * ch + ch // mixer weight + bias
      total += condSize * co // condition weight
    }
    total += ch * (bc.head_size || 1) // head weight
    if (bc.head_bias) total += bc.head_size || 1 // head bias
  }
  total += 1 // head_scale
  return total
}

describe('NAM parser', () => {
  it('weight count matches Fender Super Reverb .nam file', () => {
    const filePath = join(
      process.env.HOME!,
      'Downloads/Fender Super Reverb 1977/Fender Super Reverb_ EQ Flat, Volume 3, AKG 414.nam'
    )

    let data: any
    try {
      data = JSON.parse(readFileSync(filePath, 'utf-8'))
    } catch {
      return // file not available
    }

    expect(data.architecture).toBe('WaveNet')
    expect(countWaveNetWeights(data.config)).toBe(data.weights.length)
  })

  it('counts weights for simple synthetic config', () => {
    const config = {
      layers: [
        {
          input_size: 1,
          channels: 4,
          kernel_size: 3,
          dilations: [1, 2],
          head_size: 1,
          gated: false,
          head_bias: true,
          condition_size: 0
        }
      ]
    }

    // rechannel: 1*4 = 4
    // per layer: 4*4*3 + 4 + 4*4 + 4 = 48+4+16+4 = 72, x2 = 144
    // head: 4*1 + 1 = 5
    // head_scale: 1
    // total: 4 + 144 + 5 + 1 = 154
    expect(countWaveNetWeights(config)).toBe(154)
  })

  it('counts weights for gated config', () => {
    const config = {
      layers: [
        {
          input_size: 1,
          channels: 4,
          kernel_size: 3,
          dilations: [1],
          head_size: 1,
          gated: true,
          head_bias: false,
          condition_size: 0
        }
      ]
    }

    // rechannel: 4
    // conv_out = 8 (gated doubles)
    // layer: 4*8*3 + 8 + 4*4 + 4 = 96+8+16+4 = 124
    // head: 4
    // head_scale: 1
    expect(countWaveNetWeights(config)).toBe(4 + 124 + 4 + 1)
  })
})
