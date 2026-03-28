import type { IntervalDefinition } from './interval-data'
import type { ScaleDefinition } from './scale-data'
import type { ChordVoicing } from './chord-voicings'
import type { RhythmPattern } from './rhythm-patterns'
import type { GenreDefinition, PracticePath, SongDefinition } from './learn-types'
import type { ChordChangePreset } from './presets/chord-changes'
import type { ScaleSequencePreset } from './presets/scale-sequences'
import type { EarTrainingPreset } from './presets/ear-training'
import { _initIntervals } from './interval-data'
import { _initConstants } from './constants'
import { _initChordTemplates } from './chord-detection'
import { _initScales } from './scale-data'
import { _initChordVoicings } from './chord-voicings'
import { _initRhythmPatterns } from './rhythm-patterns'
import { _initGenreDefinitions } from './genres'
import { _initChordChangePresets } from './presets/chord-changes'
import { _initScaleSequencePresets } from './presets/scale-sequences'
import { _initEarTrainingPresets } from './presets/ear-training'
import { _initPracticePaths } from './practice-paths'
import { _initSongs } from './songs'

async function load<T>(relativePath: string): Promise<T> {
  return window.api.loadData(relativePath) as Promise<T>
}

async function loadDir<T>(relativeDir: string): Promise<T[]> {
  return window.api.loadDataDir(relativeDir) as Promise<T[]>
}

export async function initAppData(): Promise<void> {
  const [
    intervals,
    constants,
    chordTemplates,
    scales,
    chordVoicings,
    rhythmPatterns,
    genres,
    chordChangePresets,
    scaleSequencePresets,
    earTrainingPresets,
    practicePaths,
    songs
  ] = await Promise.all([
    load<IntervalDefinition[]>('intervals.json'),
    load<{ noteNames: string[]; tuningPresets: Record<string, string[]> }>('constants.json'),
    load<{ quality: string; intervals: number[] }[]>('chord-templates.json'),
    load<ScaleDefinition[]>('scales.json'),
    load<ChordVoicing[]>('chord-voicings.json'),
    load<RhythmPattern[]>('rhythm-patterns.json'),
    load<GenreDefinition[]>('genres.json'),
    load<ChordChangePreset[]>('presets/chord-changes.json'),
    load<ScaleSequencePreset[]>('presets/scale-sequences.json'),
    load<EarTrainingPreset[]>('presets/ear-training.json'),
    loadDir<PracticePath>('practice-paths'),
    loadDir<SongDefinition>('songs')
  ])

  _initIntervals(intervals)
  _initConstants(constants.noteNames, constants.tuningPresets)
  _initChordTemplates(chordTemplates.map((t) => [t.quality, t.intervals] as [string, number[]]))
  _initScales(scales)
  _initChordVoicings(chordVoicings)
  _initRhythmPatterns(rhythmPatterns)
  _initGenreDefinitions(genres)
  _initChordChangePresets(chordChangePresets)
  _initScaleSequencePresets(scaleSequencePresets)
  _initEarTrainingPresets(earTrainingPresets)
  _initPracticePaths(practicePaths)
  _initSongs(songs)
}
