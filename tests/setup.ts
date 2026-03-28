import { readFileSync } from 'fs'
import { join } from 'path'
import { _initIntervals } from '../src/renderer/utils/interval-data'
import { _initConstants } from '../src/renderer/utils/constants'
import { _initChordTemplates } from '../src/renderer/utils/chord-detection'
import { _initScales } from '../src/renderer/utils/scale-data'
import { _initChordVoicings } from '../src/renderer/utils/chord-voicings'
import { _initRhythmPatterns } from '../src/renderer/utils/rhythm-patterns'
import { _initGenreDefinitions } from '../src/renderer/utils/genres'
import { _initChordChangePresets } from '../src/renderer/utils/presets/chord-changes'
import { _initScaleSequencePresets } from '../src/renderer/utils/presets/scale-sequences'
import { _initEarTrainingPresets } from '../src/renderer/utils/presets/ear-training'
import { _initPracticePaths } from '../src/renderer/utils/practice-paths'

function loadJson<T>(relativePath: string): T {
  const fullPath = join(__dirname, '..', 'resources', 'data', relativePath)
  return JSON.parse(readFileSync(fullPath, 'utf-8'))
}

const intervals = loadJson('intervals.json')
const constants = loadJson<{ noteNames: string[]; tuningPresets: Record<string, string[]> }>(
  'constants.json'
)
const chordTemplates = loadJson<{ quality: string; intervals: number[] }[]>('chord-templates.json')
const scales = loadJson('scales.json')
const chordVoicings = loadJson('chord-voicings.json')
const rhythmPatterns = loadJson('rhythm-patterns.json')
const genres = loadJson('genres.json')
const chordChangePresets = loadJson('presets/chord-changes.json')
const scaleSequencePresets = loadJson('presets/scale-sequences.json')
const earTrainingPresets = loadJson('presets/ear-training.json')
const practicePaths = loadJson('practice-paths.json')

_initIntervals(intervals as any)
_initConstants(constants.noteNames, constants.tuningPresets)
_initChordTemplates(chordTemplates.map((t: any) => [t.quality, t.intervals] as [string, number[]]))
_initScales(scales as any)
_initChordVoicings(chordVoicings as any)
_initRhythmPatterns(rhythmPatterns as any)
_initGenreDefinitions(genres as any)
_initChordChangePresets(chordChangePresets as any)
_initScaleSequencePresets(scaleSequencePresets as any)
_initEarTrainingPresets(earTrainingPresets as any)
_initPracticePaths(practicePaths as any)
