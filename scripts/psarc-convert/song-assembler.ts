import type {
  GenreId,
  Instrument,
  NotationMeasure,
  NotationNote,
  NoteTechnique,
  PracticeDifficulty,
  SongArrangement,
  SongDefinition,
  SongNotation
} from '../../src/renderer/utils/learn-types'
import type { ManifestData, SngData, SngNoteData, SngVocal } from './types'
import { buildBeatGrid, detectTimeSignature, findMeasureAtTime } from './beat-grid'
import type { GridMeasure } from './beat-grid'
import { buildChordMapping, getChordAtTime } from './chord-mapper'
import type { ChordMapping } from './chord-mapper'
import { sampleDifficultyLevels } from './difficulty-mapper'
import type { ArrangementType } from './difficulty-mapper'
import { buildLyricLines } from './lyrics-builder'
import { computeNoteSustain, quantizeDuration } from './note-quantizer'
import { detectKey, fretToPitch, parseTuning, rsStringToTabString } from './pitch-utils'
import type { TuningInfo } from './pitch-utils'

// Note mask flags matching xml-arrangement-parser
const MASK_HAMMER_ON = 0x0002
const MASK_PULL_OFF = 0x0004
const MASK_HARMONIC = 0x0008
const MASK_BEND = 0x0010
const MASK_MUTE = 0x0020
const MASK_PALM_MUTE = 0x0040
const MASK_SLIDE = 0x0080
const MASK_ACCENT = 0x2000
const MASK_SLIDE_UNPITCH = 0x2000_0000

const ARRANGEMENT_TO_INSTRUMENT: Record<ArrangementType, Instrument> = {
  lead: 'lead-guitar',
  rhythm: 'rhythm-guitar',
  bass: 'bass'
}

export interface ConvertOptions {
  key?: string
  genre?: GenreId
  baseDifficulty?: PracticeDifficulty
}

export interface ArrangementInput {
  type: ArrangementType
  manifest?: ManifestData
  sngData: SngData
  chordInstances?: Map<
    number,
    Array<{
      time: number
      chordId: number
      chordNotes: Array<{ string: number; fret: number; sustain: number }>
    }>
  >
}

export function assembleSong(
  arrangements: ArrangementInput[],
  vocals: SngVocal[],
  options: ConvertOptions
): SongDefinition | null {
  if (arrangements.length === 0) return null

  // Prioritize: lead > rhythm > bass for primary arrangement
  const typeOrder: ArrangementType[] = ['lead', 'rhythm', 'bass']
  arrangements.sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type))

  const primaryManifest = arrangements[0].manifest
  if (!primaryManifest) return null

  const attrs = primaryManifest.attributes
  const songId = slugify(attrs.songName)
  const tuningInfo = parseTuning(attrs.tuning)
  const capo = attrs.capo || 0

  // Build from primary arrangement first
  const primaryData = arrangements[0].sngData
  const grid = buildBeatGrid(primaryData.beats)
  const timeSignature = detectTimeSignature(grid)
  const chordMapping = buildChordMapping(primaryData.chordTemplates)

  // Build chord events from highest difficulty level
  const chordEvents = buildChordEvents(arrangements[0], chordMapping)

  // Build lyric lines
  const lines = buildLyricLines(vocals, primaryData.sections, chordEvents)

  // Detect key
  const key =
    options.key ??
    detectKey(
      chordMapping.uniqueChords,
      primaryData.sections.map((s, i) => ({
        section: s.name,
        chords: chordEvents
          .filter(
            (c) =>
              c.time >= s.startTime &&
              c.time <
                (i + 1 < primaryData.sections.length
                  ? primaryData.sections[i + 1].startTime
                  : Infinity)
          )
          .map((c) => c.name)
      }))
    )

  // Build arrangements with different difficulty levels
  const songArrangements: SongArrangement[] = []

  // Count arrangements per type to handle duplicates (lead, lead2, etc.)
  const typeCounts = new Map<ArrangementType, number>()
  for (const arr of arrangements) {
    typeCounts.set(arr.type, (typeCounts.get(arr.type) ?? 0) + 1)
  }
  const typeIndex = new Map<ArrangementType, number>()

  for (const arr of arrangements) {
    const arrGrid = arr === arrangements[0] ? grid : buildBeatGrid(arr.sngData.beats)
    const arrTimeSig = arr === arrangements[0] ? timeSignature : detectTimeSignature(arrGrid)
    const arrChordMapping =
      arr === arrangements[0] ? chordMapping : buildChordMapping(arr.sngData.chordTemplates)
    const arrTuning = arr.manifest ? parseTuning(arr.manifest.attributes.tuning) : tuningInfo
    const arrCapo = arr.manifest?.attributes.capo ?? capo
    const arrChordEvents =
      arr === arrangements[0] ? chordEvents : buildChordEvents(arr, arrChordMapping)

    const idx = (typeIndex.get(arr.type) ?? 0) + 1
    typeIndex.set(arr.type, idx)
    const hasMultiple = (typeCounts.get(arr.type) ?? 0) > 1
    const typeSuffix = hasMultiple ? `${arr.type}${idx}` : arr.type

    const levels = sampleDifficultyLevels(arr.sngData, arr.type, options.baseDifficulty)

    for (const level of levels) {
      const notation = buildNotation(
        arr.sngData,
        level.rsLevel,
        arrGrid,
        arrTimeSig,
        arrTuning,
        arrCapo,
        arrChordMapping,
        arrChordEvents,
        arr.chordInstances
      )

      const label = buildArrangementLabel(
        arr.type,
        level.difficulty,
        levels.length > 1,
        hasMultiple ? idx : undefined
      )

      songArrangements.push({
        id:
          levels.length > 1
            ? `${songId}-${typeSuffix}-${level.rsLevel}`
            : `${songId}-${typeSuffix}`,
        instrument: ARRANGEMENT_TO_INSTRUMENT[arr.type],
        label,
        isDefault: songArrangements.length === 0,
        difficulty: level.difficulty,
        key,
        chords: arrChordMapping.uniqueChords,
        attribution: `${attrs.artistName}${attrs.albumName ? `, ${attrs.albumName}` : ''}${attrs.songYear ? ` (${attrs.songYear})` : ''}`,
        lines,
        notation,
        tuning: arrTuning.name !== 'Standard' ? arrTuning.name : undefined,
        capo: arrCapo > 0 ? arrCapo : undefined
      })
    }
  }

  if (songArrangements.length === 0) return null

  const defaultArr = songArrangements[0]

  return {
    id: songId,
    title: attrs.songName,
    genres: [options.genre ?? 'rock'],
    difficulty: defaultArr.difficulty,
    key: defaultArr.key,
    chords: chordMapping.uniqueChords,
    attribution: defaultArr.attribution,
    lines,
    notation: defaultArr.notation,
    tuning: defaultArr.tuning,
    capo: defaultArr.capo,
    arrangements: songArrangements
  }
}

function buildChordEvents(
  arr: ArrangementInput,
  chordMapping: ChordMapping
): Array<{ time: number; name: string }> {
  const events: Array<{ time: number; name: string }> = []

  // Use chord instances from highest difficulty level
  if (arr.chordInstances) {
    const maxLevel = Math.max(...arr.chordInstances.keys())
    const chords = arr.chordInstances.get(maxLevel) ?? []
    for (const chord of chords) {
      const name = chordMapping.chordIdToName.get(chord.chordId)
      if (name) events.push({ time: chord.time, name })
    }
  }

  // Deduplicate consecutive same-chord events
  const deduped: Array<{ time: number; name: string }> = []
  for (const event of events) {
    if (deduped.length === 0 || deduped[deduped.length - 1].name !== event.name) {
      deduped.push(event)
    }
  }

  return deduped
}

function buildNotation(
  sngData: SngData,
  rsLevel: number,
  grid: GridMeasure[],
  timeSignature: [number, number],
  tuning: TuningInfo,
  capo: number,
  chordMapping: ChordMapping,
  chordEvents: Array<{ time: number; name: string }>,
  chordInstances?: Map<
    number,
    Array<{
      time: number
      chordId: number
      chordNotes: Array<{ string: number; fret: number; sustain: number }>
    }>
  >
): SongNotation {
  // Get notes at the requested difficulty level
  const levelData = sngData.arrangements.find((a) => a.difficulty === rsLevel)
  const notes = levelData?.notes ?? []

  // Get chord instances at this level
  const levelChords = chordInstances?.get(rsLevel) ?? []

  // Merge notes and chord instances into a single timeline
  const allEvents = buildNoteTimeline(notes, levelChords, tuning, capo, chordMapping)

  // Group events into measures
  const avgTempo = grid.length > 0 ? grid.reduce((s, m) => s + m.tempo, 0) / grid.length : 120

  const measures: NotationMeasure[] = []

  for (const measure of grid) {
    const measureEvents = allEvents.filter(
      (e) => e.time >= measure.startTime - 0.01 && e.time < measure.endTime - 0.01
    )

    if (measureEvents.length === 0) continue

    const measureNotes: NotationNote[] = []

    for (let i = 0; i < measureEvents.length; i++) {
      const event = measureEvents[i]
      const nextTime = i + 1 < measureEvents.length ? measureEvents[i + 1].time : measure.endTime
      const sustain = computeNoteSustain(event.time, event.sustain, nextTime, measure.beatDuration)
      const quantized = quantizeDuration(sustain, measure.beatDuration)

      const note: NotationNote = {
        pitch: event.pitch,
        duration: quantized.duration,
        ...(quantized.dotted ? { dotted: true } : {}),
        ...(event.tab ? { tab: event.tab } : {}),
        ...(event.techniques.length > 0 ? { technique: event.techniques } : {}),
        ...(event.simultaneous.length > 0 ? { simultaneous: event.simultaneous } : {})
      }

      measureNotes.push(note)
    }

    // Find chord at measure start
    const measureChord = findChordForTime(measure.startTime, chordEvents)

    // Find lyric fragment (not used here — lyrics are in lines[])
    const tempoOverride =
      Math.abs(measure.tempo - avgTempo) > 5 ? Math.round(measure.tempo) : undefined

    measures.push({
      notes: measureNotes,
      ...(measureChord ? { chord: measureChord } : {}),
      ...(tempoOverride ? { tempo: tempoOverride } : {})
    })
  }

  return {
    timeSignature,
    tempo: Math.round(avgTempo),
    measures
  }
}

interface NoteEvent {
  time: number
  pitch: string
  sustain: number
  tab?: { string: number; fret: number }
  techniques: NoteTechnique[]
  simultaneous: Array<{ pitch: string; tab?: { string: number; fret: number } }>
}

function buildNoteTimeline(
  notes: SngNoteData[],
  chordInstances: Array<{
    time: number
    chordId: number
    chordNotes: Array<{ string: number; fret: number; sustain: number }>
  }>,
  tuning: TuningInfo,
  capo: number,
  chordMapping: ChordMapping
): NoteEvent[] {
  const events: NoteEvent[] = []

  // Add single notes
  for (const note of notes) {
    if (note.fret < 0) continue // skip muted/unused strings

    events.push({
      time: note.time,
      pitch: fretToPitch(note.string, note.fret, tuning.offsets, capo),
      sustain: note.sustain,
      tab: { string: rsStringToTabString(note.string), fret: note.fret },
      techniques: extractTechniques(note.mask, note),
      simultaneous: []
    })
  }

  // Add chord instances as notes with simultaneous voices
  for (const chord of chordInstances) {
    if (chord.chordNotes.length === 0) continue

    // First note is the primary voice (lowest string = bass note)
    const sorted = [...chord.chordNotes].sort((a, b) => a.string - b.string)
    const primary = sorted[0]
    const rest = sorted.slice(1)

    events.push({
      time: chord.time,
      pitch: fretToPitch(primary.string, primary.fret, tuning.offsets, capo),
      sustain: primary.sustain,
      tab: { string: rsStringToTabString(primary.string), fret: primary.fret },
      techniques: [],
      simultaneous: rest.map((cn) => ({
        pitch: fretToPitch(cn.string, cn.fret, tuning.offsets, capo),
        tab: { string: rsStringToTabString(cn.string), fret: cn.fret }
      }))
    })
  }

  // Sort by time
  events.sort((a, b) => a.time - b.time)

  return events
}

function extractTechniques(mask: number, note: SngNoteData): NoteTechnique[] {
  const techniques: NoteTechnique[] = []

  if (mask & MASK_HAMMER_ON) techniques.push('hammer-on')
  if (mask & MASK_PULL_OFF) techniques.push('pull-off')
  if (mask & MASK_HARMONIC) techniques.push('harmonic')
  if (mask & MASK_BEND) techniques.push('bend')
  if (mask & MASK_MUTE) techniques.push('mute')
  if (mask & MASK_PALM_MUTE) techniques.push('palm-mute')
  if (mask & MASK_SLIDE) techniques.push('slide-up')
  if (mask & MASK_SLIDE_UNPITCH) techniques.push('slide-down')
  if (mask & MASK_ACCENT) techniques.push('accent')

  return techniques
}

function findChordForTime(
  time: number,
  chordEvents: Array<{ time: number; name: string }>
): string | null {
  let best: string | null = null
  for (const event of chordEvents) {
    if (event.time <= time + 0.05) {
      best = event.name
    } else {
      break
    }
  }
  return best
}

function buildArrangementLabel(
  type: ArrangementType,
  difficulty: PracticeDifficulty,
  multiLevel: boolean,
  typeNum?: number
): string {
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
  const numSuffix = typeNum ? ` ${typeNum}` : ''
  if (!multiLevel) return `${typeLabel}${numSuffix}`
  return `${typeLabel}${numSuffix} (${difficulty.tier} ${difficulty.grade})`
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
