import type {
  SngBeat,
  SngChordTemplate,
  SngData,
  SngNoteData,
  SngPhrase,
  SngPhraseIteration,
  SngSection,
  SngVocal
} from './types'

function attr(element: string, name: string): string {
  const regex = new RegExp(`${name}="([^"]*)"`)
  const match = element.match(regex)
  return match?.[1] ?? ''
}

function attrFloat(element: string, name: string): number {
  return parseFloat(attr(element, name)) || 0
}

function attrInt(element: string, name: string): number {
  return parseInt(attr(element, name), 10) || 0
}

function findElements(xml: string, tagName: string): string[] {
  const results: string[] = []
  const selfClosing = new RegExp(`<${tagName}\\s[^>]*/>`, 'g')
  let match: RegExpExecArray | null
  while ((match = selfClosing.exec(xml)) !== null) {
    results.push(match[0])
  }
  return results
}

function findBlock(xml: string, tagName: string): string {
  const start = xml.indexOf(`<${tagName}`)
  if (start === -1) return ''
  const end = xml.indexOf(`</${tagName}>`, start)
  if (end === -1) return ''
  return xml.substring(start, end + tagName.length + 3)
}

function parseBeats(xml: string): SngBeat[] {
  const block = findBlock(xml, 'ebeats')
  const elements = findElements(block, 'ebeat')
  let measure = -1
  let beat = 0

  return elements.map((el) => {
    const newMeasure = attrInt(el, 'measure')
    if (newMeasure >= 0 && attr(el, 'measure') !== '') {
      measure = newMeasure
      beat = 0
    }
    return {
      time: attrFloat(el, 'time'),
      measure,
      beat: beat++,
      phraseIteration: 0,
      mask: 0
    }
  })
}

function parsePhrases(xml: string): SngPhrase[] {
  const block = findBlock(xml, 'phrases')
  return findElements(block, 'phrase').map((el) => ({
    solo: attrInt(el, 'solo'),
    disparity: attrInt(el, 'disparity'),
    ignore: attrInt(el, 'ignore'),
    maxDifficulty: attrInt(el, 'maxDifficulty'),
    phraseIterationLinks: 0,
    name: attr(el, 'name')
  }))
}

function parsePhraseIterations(xml: string): SngPhraseIteration[] {
  const block = findBlock(xml, 'phraseIterations')
  return findElements(block, 'phraseIteration').map((el) => ({
    phraseId: attrInt(el, 'phraseId'),
    startTime: attrFloat(el, 'time'),
    nextPhraseTime: 0,
    difficulty: []
  }))
}

function parseChordTemplates(xml: string): SngChordTemplate[] {
  const block = findBlock(xml, 'chordTemplates')
  return findElements(block, 'chordTemplate').map((el) => ({
    mask: 0,
    frets: [
      attrInt(el, 'fret0'),
      attrInt(el, 'fret1'),
      attrInt(el, 'fret2'),
      attrInt(el, 'fret3'),
      attrInt(el, 'fret4'),
      attrInt(el, 'fret5')
    ],
    fingers: [
      attrInt(el, 'finger0'),
      attrInt(el, 'finger1'),
      attrInt(el, 'finger2'),
      attrInt(el, 'finger3'),
      attrInt(el, 'finger4'),
      attrInt(el, 'finger5')
    ],
    notes: [0, 0, 0, 0, 0, 0],
    name: attr(el, 'chordName') || attr(el, 'displayName')
  }))
}

function parseSections(xml: string): SngSection[] {
  const block = findBlock(xml, 'sections')
  return findElements(block, 'section').map((el) => ({
    name: attr(el, 'name'),
    number: attrInt(el, 'number'),
    startTime: attrFloat(el, 'startTime'),
    endTime: 0,
    startPhraseIterationId: 0,
    endPhraseIterationId: 0,
    stringMask: []
  }))
}

function parseNotes(levelBlock: string): SngNoteData[] {
  const notesBlock = findBlock(levelBlock, 'notes')
  return findElements(notesBlock, 'note').map((el) => ({
    time: attrFloat(el, 'time'),
    string: attrInt(el, 'string'),
    fret: attrInt(el, 'fret'),
    chordId: -1,
    chordNotesId: -1,
    sustain: attrFloat(el, 'sustain'),
    bend: attrFloat(el, 'bend'),
    slideTo: attrInt(el, 'slideTo'),
    slideUnpitchTo: attrInt(el, 'slideUnpitchTo'),
    vibrato: 0,
    mask: buildNoteMask(el),
    anchorFret: 0,
    anchorWidth: 0,
    fingerprint0: 0,
    fingerprint1: 0
  }))
}

function buildNoteMask(el: string): number {
  let mask = 0
  if (attrInt(el, 'hammerOn')) mask |= 0x0002
  if (attrInt(el, 'pullOff')) mask |= 0x0004
  if (attrInt(el, 'harmonic')) mask |= 0x0008
  if (attrInt(el, 'palmMute')) mask |= 0x0040
  if (attrInt(el, 'mute')) mask |= 0x0020
  if (attrInt(el, 'accent')) mask |= 0x2000
  if (attrInt(el, 'tremolo')) mask |= 0x8000
  if (attrInt(el, 'harmonicPinch')) mask |= 0x8000_0000
  if (attrInt(el, 'hopo')) mask |= 0x0002 | 0x0004
  if (attrFloat(el, 'bend') > 0) mask |= 0x0010
  if (attrInt(el, 'slideTo') >= 0) mask |= 0x0080
  if (attrInt(el, 'slideUnpitchTo') >= 0) mask |= 0x2000_0000
  return mask
}

interface ChordInLevel {
  time: number
  chordId: number
  strum: string
  chordNotes: Array<{ string: number; fret: number; sustain: number; slideTo: number; bend: number; mask: number }>
}

function parseChords(levelBlock: string): ChordInLevel[] {
  const chordsBlock = findBlock(levelBlock, 'chords')
  if (!chordsBlock) return []

  const results: ChordInLevel[] = []
  const chordRegex = /<chord\s([^>]*)>/g
  let match: RegExpExecArray | null

  while ((match = chordRegex.exec(chordsBlock)) !== null) {
    const attrs = match[1]
    const chordId = attrInt(attrs, 'chordId')
    const time = attrFloat(attrs, 'time')
    const strum = attr(attrs, 'strum')

    const chordNotes: ChordInLevel['chordNotes'] = []
    const closeIdx = chordsBlock.indexOf('</chord>', match.index)
    if (closeIdx > -1) {
      const inner = chordsBlock.substring(match.index, closeIdx)
      const noteEls = findElements(inner, 'chordNote')
      for (const cn of noteEls) {
        chordNotes.push({
          string: attrInt(cn, 'string'),
          fret: attrInt(cn, 'fret'),
          sustain: attrFloat(cn, 'sustain'),
          slideTo: attrInt(cn, 'slideTo'),
          bend: attrFloat(cn, 'bend'),
          mask: buildNoteMask(cn)
        })
      }
    }

    results.push({ time, chordId, strum, chordNotes })
  }

  return results
}

function parseLevels(xml: string): Array<{ difficulty: number; notes: SngNoteData[]; chords: ChordInLevel[] }> {
  const levelsBlock = findBlock(xml, 'levels')
  const levels: Array<{ difficulty: number; notes: SngNoteData[]; chords: ChordInLevel[] }> = []

  const levelRegex = /<level\s[^>]*difficulty="(\d+)"[^>]*>/g
  let match: RegExpExecArray | null
  const positions: Array<{ difficulty: number; start: number }> = []

  while ((match = levelRegex.exec(levelsBlock)) !== null) {
    positions.push({ difficulty: parseInt(match[1], 10), start: match.index })
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].start
    const end = i + 1 < positions.length ? positions[i + 1].start : levelsBlock.length
    const levelBlock = levelsBlock.substring(start, end)
    levels.push({
      difficulty: positions[i].difficulty,
      notes: parseNotes(levelBlock),
      chords: parseChords(levelBlock)
    })
  }

  return levels
}

export function parseArrangementXml(xml: string): SngData & { chordInstances: Map<number, ChordInLevel[]> } {
  const beats = parseBeats(xml)
  const phrases = parsePhrases(xml)
  const phraseIterations = parsePhraseIterations(xml)
  const chordTemplates = parseChordTemplates(xml)
  const sections = parseSections(xml)
  const levels = parseLevels(xml)

  const chordInstances = new Map<number, ChordInLevel[]>()

  const arrangements = levels.map((level) => {
    if (level.chords.length > 0) {
      chordInstances.set(level.difficulty, level.chords)
    }
    return {
      difficulty: level.difficulty,
      anchors: [],
      notes: level.notes,
      chordNotes: [],
      phraseCount: 0
    }
  })

  return {
    beats,
    phrases,
    phraseIterations,
    chordTemplates,
    sections,
    arrangements,
    notes: arrangements.map((a) => ({ difficulty: a.difficulty, notes: a.notes })),
    vocals: [],
    chordInstances
  }
}

export function parseVocalsXml(xml: string): SngVocal[] {
  const vocals: SngVocal[] = []
  const elements = findElements(xml, 'vocal')
  for (const el of elements) {
    vocals.push({
      time: attrFloat(el, 'time'),
      note: attrInt(el, 'note'),
      length: attrFloat(el, 'length'),
      lyric: attr(el, 'lyric')
    })
  }
  return vocals
}
