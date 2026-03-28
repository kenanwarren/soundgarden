import { describe, expect, it } from 'vitest'
import {
  CHORD_CHANGE_PRESETS,
  EAR_TRAINING_PRESETS,
  PRACTICE_PATHS,
  SCALE_SEQUENCE_PRESETS,
  getGenreProgress,
  getNextIncompleteStep,
  getPathsForGenre,
  getPathsForSkill,
  getStarterPath,
  getVisibleGenres
} from '../../src/renderer/utils/learn-data'
import { CHORD_VOICINGS } from '../../src/renderer/utils/chord-voicings'
import { RHYTHM_PATTERNS } from '../../src/renderer/utils/rhythm-patterns'
import { SCALES } from '../../src/renderer/utils/scale-data'

const connectedStatus = {
  permissionState: 'granted',
  isConnected: true,
  inputDeviceId: 'input-1',
  inputDeviceLabel: 'Interface',
  outputDeviceId: 'output-1',
  outputDeviceLabel: 'Speakers',
  inputLevel: 0.3,
  signalBand: 'healthy',
  signalLabel: 'Healthy',
  latencyMs: 12,
  latencyBand: 'good',
  latencyLabel: 'Good (12.0ms)',
  activeMode: 'Idle',
  lastRecoverableError: null,
  devicesLoading: false
} as const

describe('learn-data', () => {
  it('exposes six visible starter genres and hides the general bucket', () => {
    const genres = getVisibleGenres()
    expect(genres).toHaveLength(6)
    expect(genres.some((genre) => genre.id === 'general')).toBe(false)
  })

  it('returns starter paths and tagged content for each visible genre', () => {
    expect(getStarterPath('blues')?.id).toBe('blues-foundations')
    expect(getStarterPath('rock')?.id).toBe('rock-riff-builder')
    expect(getStarterPath('fingerpicking')?.id).toBe('fingerpicking-foundations')

    expect(CHORD_CHANGE_PRESETS.some((preset) => preset.genreTags.includes('funk'))).toBe(true)
    expect(SCALE_SEQUENCE_PRESETS.some((preset) => preset.genreTags.includes('country'))).toBe(true)
    expect(EAR_TRAINING_PRESETS.some((preset) => preset.genreTags.includes('pop'))).toBe(true)
  })

  it('filters paths by genre and by skill tags', () => {
    const bluesPaths = getPathsForGenre('blues')
    expect(bluesPaths.map((path) => path.id)).toEqual(['blues-foundations'])

    const fingerstylePaths = getPathsForSkill('fingerstyle')
    expect(fingerstylePaths.some((path) => path.id === 'fingerpicking-foundations')).toBe(true)

    const rhythmPaths = getPathsForSkill('rhythm')
    expect(rhythmPaths.some((path) => path.id === 'funk-pocket-builder')).toBe(true)
    expect(rhythmPaths.some((path) => path.id === 'timing-builder')).toBe(true)
  })

  it('aggregates genre progress from the paths inside that genre', () => {
    const progress = getGenreProgress(
      'blues',
      {
        'blues-dominant-focus': Date.now(),
        'blues-shuffle-pocket': Date.now()
      },
      connectedStatus
    )

    expect(progress.totalCount).toBeGreaterThan(0)
    expect(progress.completedCount).toBe(2)
    expect(progress.percent).toBeGreaterThan(0)
  })

  it('returns the correct next step based on setup readiness and completed lesson state', () => {
    const foundations = PRACTICE_PATHS.find((path) => path.id === 'foundations')
    expect(foundations).toBeDefined()

    const disconnectedStatus = {
      ...connectedStatus,
      isConnected: false,
      inputDeviceId: null
    } as const

    expect(getNextIncompleteStep(foundations!, {}, disconnectedStatus)?.id).toBe('foundations-setup')
    expect(getNextIncompleteStep(foundations!, {}, connectedStatus)?.id).toBe('foundations-open-c')
    expect(
      getNextIncompleteStep(
        foundations!,
        {
          'foundations-open-c': Date.now(),
          'foundations-quarter-notes': Date.now()
        },
        connectedStatus
      )?.id
    ).toBe('foundations-ear-note')
  })

  it('keeps every genre preset and guided step aligned with valid underlying inventory', () => {
    const chordNames = new Set(CHORD_VOICINGS.map((voicing) => voicing.name))
    const rhythmNames = new Set(RHYTHM_PATTERNS.map((pattern) => pattern.name))
    const rhythmPresetIds = new Set(
      RHYTHM_PATTERNS.map((pattern) =>
        pattern.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      )
    )
    const scaleNames = new Set(SCALES.map((scale) => scale.name))
    const chordPresetIds = new Set(CHORD_CHANGE_PRESETS.map((preset) => preset.id))
    const sequencePresetIds = new Set(SCALE_SEQUENCE_PRESETS.map((preset) => preset.id))
    const earPresetIds = new Set(EAR_TRAINING_PRESETS.map((preset) => preset.id))

    for (const preset of CHORD_CHANGE_PRESETS) {
      expect(preset.chordNames.every((name) => chordNames.has(name))).toBe(true)
    }

    for (const preset of SCALE_SEQUENCE_PRESETS) {
      expect(scaleNames.has(preset.scaleName)).toBe(true)
    }

    for (const path of PRACTICE_PATHS) {
      for (const starterPresetId of path.starterPresetIds ?? []) {
        const [kind, id] = starterPresetId.split(':')
        if (kind === 'rhythm') expect(rhythmPresetIds.has(id)).toBe(true)
        if (kind === 'chord-changes') expect(chordPresetIds.has(id)).toBe(true)
        if (kind === 'scale-sequences') expect(sequencePresetIds.has(id)).toBe(true)
        if (kind === 'ear') expect(earPresetIds.has(id)).toBe(true)
      }

      for (const step of path.steps) {
        switch (step.prefill.module) {
          case 'chord-library':
            if (step.prefill.chordName) {
              expect(chordNames.has(step.prefill.chordName)).toBe(true)
            }
            break
          case 'rhythm-trainer':
            expect(rhythmNames.has(step.prefill.patternName)).toBe(true)
            break
          case 'chord-changes':
            expect(chordPresetIds.has(step.prefill.presetId)).toBe(true)
            break
          case 'scale-sequences':
            expect(scaleNames.has(step.prefill.scaleName)).toBe(true)
            if (step.prefill.presetId) {
              expect(sequencePresetIds.has(step.prefill.presetId)).toBe(true)
            }
            break
          case 'ear-training':
            if (step.prefill.presetId) {
              expect(earPresetIds.has(step.prefill.presetId)).toBe(true)
            }
            break
          case 'scale-explorer':
            expect(scaleNames.has(step.prefill.scaleName)).toBe(true)
            break
          case 'setup':
            break
        }
      }
    }
  })
})
