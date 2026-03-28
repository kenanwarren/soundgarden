import { describe, expect, it } from 'vitest'
import { buildScaleSequence, matchesChordVoicing } from '../../src/renderer/utils/learn-drills'

describe('learn-drills', () => {
  it('builds ascending and descending sequences directly from the scale notes', () => {
    expect(buildScaleSequence(['A', 'C', 'D', 'E', 'G'], 'ascending')).toEqual([
      'A',
      'C',
      'D',
      'E',
      'G'
    ])
    expect(buildScaleSequence(['A', 'C', 'D', 'E', 'G'], 'descending')).toEqual([
      'G',
      'E',
      'D',
      'C',
      'A'
    ])
  })

  it('builds thirds without wrapping beyond the available scale notes', () => {
    expect(buildScaleSequence(['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'], 'thirds')).toEqual([
      'A',
      'C#',
      'B',
      'D',
      'C#',
      'E',
      'D',
      'F#',
      'E',
      'G#'
    ])
  })

  it('matches only the configured chord root and quality', () => {
    expect(
      matchesChordVoicing({ root: 'C', quality: 'major' }, { root: 'C', quality: 'major' })
    ).toBe(true)
    expect(
      matchesChordVoicing({ root: 'C', quality: 'major' }, { root: 'G', quality: 'major' })
    ).toBe(false)
    expect(
      matchesChordVoicing({ root: 'C', quality: 'major' }, { root: 'C', quality: 'minor' })
    ).toBe(false)
    expect(matchesChordVoicing({ root: 'C', quality: 'major' }, null)).toBe(false)
  })
})
