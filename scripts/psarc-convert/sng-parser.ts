import type {
  SngAnchor,
  SngArrangementLevel,
  SngBeat,
  SngChordNoteData,
  SngChordTemplate,
  SngData,
  SngNoteData,
  SngPhrase,
  SngPhraseIteration,
  SngSection,
  SngVocal
} from './types'

class BinaryReader {
  private offset = 0
  constructor(private buf: Buffer) {}

  get position(): number {
    return this.offset
  }

  get remaining(): number {
    return this.buf.length - this.offset
  }

  skip(bytes: number): void {
    this.offset += bytes
  }

  readInt8(): number {
    const val = this.buf.readInt8(this.offset)
    this.offset += 1
    return val
  }

  readUInt8(): number {
    const val = this.buf.readUInt8(this.offset)
    this.offset += 1
    return val
  }

  readInt16LE(): number {
    const val = this.buf.readInt16LE(this.offset)
    this.offset += 2
    return val
  }

  readUInt16LE(): number {
    const val = this.buf.readUInt16LE(this.offset)
    this.offset += 2
    return val
  }

  readInt32LE(): number {
    const val = this.buf.readInt32LE(this.offset)
    this.offset += 4
    return val
  }

  readUInt32LE(): number {
    const val = this.buf.readUInt32LE(this.offset)
    this.offset += 4
    return val
  }

  readFloat32LE(): number {
    const val = this.buf.readFloatLE(this.offset)
    this.offset += 4
    return val
  }

  readFloat64LE(): number {
    const val = this.buf.readDoubleLE(this.offset)
    this.offset += 8
    return val
  }

  readBytes(count: number): Buffer {
    const val = this.buf.subarray(this.offset, this.offset + count)
    this.offset += count
    return val
  }

  readFixedString(length: number): string {
    const raw = this.buf.subarray(this.offset, this.offset + length)
    this.offset += length
    const nullIndex = raw.indexOf(0)
    return raw.toString('utf8', 0, nullIndex === -1 ? length : nullIndex)
  }
}

function readBeats(r: BinaryReader): SngBeat[] {
  const count = r.readUInt32LE()
  const beats: SngBeat[] = []
  for (let i = 0; i < count; i++) {
    beats.push({
      time: r.readFloat32LE(),
      measure: r.readInt16LE(),
      beat: r.readInt16LE(),
      phraseIteration: r.readInt32LE(),
      mask: r.readInt32LE()
    })
  }
  return beats
}

function readPhrases(r: BinaryReader): SngPhrase[] {
  const count = r.readUInt32LE()
  const phrases: SngPhrase[] = []
  for (let i = 0; i < count; i++) {
    phrases.push({
      solo: r.readUInt8(),
      disparity: r.readUInt8(),
      ignore: r.readUInt8(),
      maxDifficulty: r.readUInt8(),
      phraseIterationLinks: r.readInt32LE(),
      name: r.readFixedString(32)
    })
  }
  return phrases
}

function readPhraseIterations(r: BinaryReader): SngPhraseIteration[] {
  const count = r.readUInt32LE()
  const items: SngPhraseIteration[] = []
  for (let i = 0; i < count; i++) {
    items.push({
      phraseId: r.readInt32LE(),
      startTime: r.readFloat32LE(),
      nextPhraseTime: r.readFloat32LE(),
      difficulty: [r.readInt32LE(), r.readInt32LE(), r.readInt32LE()]
    })
  }
  return items
}

function readPhraseExtraInfo(r: BinaryReader): void {
  const count = r.readUInt32LE()
  r.skip(count * 20)
}

function readLinkedDiffs(r: BinaryReader): void {
  const count = r.readUInt32LE()
  for (let i = 0; i < count; i++) {
    r.readInt32LE()
    const nldPhraseCount = r.readInt32LE()
    r.skip(nldPhraseCount * 4)
  }
}

function readActions(r: BinaryReader): void {
  const count = r.readUInt32LE()
  r.skip(count * 260)
}

function readEvents(r: BinaryReader): void {
  const count = r.readUInt32LE()
  r.skip(count * 260)
}

function readTones(r: BinaryReader): void {
  const count = r.readUInt32LE()
  r.skip(count * 8)
}

function readDNAs(r: BinaryReader): void {
  const count = r.readUInt32LE()
  r.skip(count * 8)
}

function readSections(r: BinaryReader): SngSection[] {
  const count = r.readUInt32LE()
  const sections: SngSection[] = []
  for (let i = 0; i < count; i++) {
    const name = r.readFixedString(32)
    const number = r.readInt32LE()
    const startTime = r.readFloat32LE()
    const endTime = r.readFloat32LE()
    const startPhraseIterationId = r.readInt32LE()
    const endPhraseIterationId = r.readInt32LE()
    const stringMask: number[] = []
    for (let s = 0; s < 36; s++) {
      stringMask.push(r.readUInt8())
    }
    sections.push({
      name,
      number,
      startTime,
      endTime,
      startPhraseIterationId,
      endPhraseIterationId,
      stringMask
    })
  }
  return sections
}

function readChordTemplates(r: BinaryReader): SngChordTemplate[] {
  const count = r.readUInt32LE()
  const chords: SngChordTemplate[] = []
  for (let i = 0; i < count; i++) {
    const mask = r.readUInt32LE()
    const frets: number[] = []
    for (let s = 0; s < 6; s++) frets.push(r.readInt8())
    const fingers: number[] = []
    for (let s = 0; s < 6; s++) fingers.push(r.readInt8())
    const notes: number[] = []
    for (let s = 0; s < 6; s++) notes.push(r.readInt32LE())
    const name = r.readFixedString(32)
    chords.push({ mask, frets, fingers, notes, name })
  }
  return chords
}

function readBendData32(r: BinaryReader): void {
  for (let i = 0; i < 32; i++) {
    r.readFloat32LE() // time
    r.readFloat32LE() // step
    r.skip(3)         // padding
    r.readUInt8()     // used flag
  }
}

function readChordNotes(r: BinaryReader): SngChordNoteData[] {
  const count = r.readUInt32LE()
  const chordNotes: SngChordNoteData[] = []
  for (let i = 0; i < count; i++) {
    const mask: number[] = []
    for (let s = 0; s < 6; s++) mask.push(r.readUInt32LE())
    const bend: number[] = []
    for (let s = 0; s < 6; s++) {
      readBendData32(r)
      bend.push(0)
    }
    const slideTo: number[] = []
    for (let s = 0; s < 6; s++) slideTo.push(r.readUInt8())
    const slideUnpitchTo: number[] = []
    for (let s = 0; s < 6; s++) slideUnpitchTo.push(r.readUInt8())
    const vibrato: number[] = []
    for (let s = 0; s < 6; s++) vibrato.push(r.readUInt16LE())
    const string: number[] = []
    const fret: number[] = []
    const sustain: number[] = []
    chordNotes.push({ mask, bend, slideTo, slideUnpitchTo, vibrato, string, fret, sustain })
  }
  return chordNotes
}

function readNote(r: BinaryReader): SngNoteData {
  const mask = r.readUInt32LE()
  const noteFlags = r.readUInt32LE()
  const time = r.readFloat32LE()
  const string = r.readInt8()
  const fret = r.readInt8()
  const anchorFret = r.readInt8()
  const anchorWidth = r.readInt8()
  const chordId = r.readInt32LE()
  const chordNotesId = r.readInt32LE()
  const phraseId = r.readInt32LE()
  const phraseIterationId = r.readInt32LE()
  const fp1Start = r.readInt16LE()
  const fp1End = r.readInt16LE()
  const fp2Start = r.readInt16LE()
  const fp2End = r.readInt16LE()
  r.readInt16LE() // bitfield
  const sustain = r.readFloat32LE()
  const bend = r.readFloat32LE()
  const slideTo = r.readInt8()
  const slideUnpitchTo = r.readInt8()
  const vibrato = r.readInt8()
  r.readInt8() // left hand
  r.readInt8() // tap
  r.readUInt8() // pickDirection
  r.readUInt8() // slap
  r.readUInt8() // pluck

  readBendData32(r)

  void noteFlags
  void phraseId
  void phraseIterationId
  void fp1Start
  void fp1End
  void fp2Start
  void fp2End

  return {
    time,
    string,
    fret,
    chordId,
    chordNotesId,
    sustain,
    bend,
    slideTo,
    slideUnpitchTo,
    vibrato,
    mask,
    anchorFret,
    anchorWidth,
    fingerprint0: 0,
    fingerprint1: 0
  }
}

function readArrangementLevels(r: BinaryReader): SngArrangementLevel[] {
  const count = r.readUInt32LE()
  const levels: SngArrangementLevel[] = []
  for (let i = 0; i < count; i++) {
    const difficulty = r.readInt32LE()

    const anchorCount = r.readUInt32LE()
    const anchors: SngAnchor[] = []
    for (let a = 0; a < anchorCount; a++) {
      const startTime = r.readFloat32LE()
      const endTime = r.readFloat32LE()
      r.readFloat32LE() // unk_time
      r.readFloat32LE() // unk_time2
      const fret = r.readInt32LE()
      const width = r.readInt32LE()
      const phraseIterationId = r.readInt32LE()
      anchors.push({ startTime, endTime, fret, width, phraseIterationId })
    }

    r.readUInt32LE() // anchor extension count
    // anchor extensions are already accounted for

    const fingerprint1Count = r.readUInt32LE()
    r.skip(fingerprint1Count * 32)

    const fingerprint2Count = r.readUInt32LE()
    r.skip(fingerprint2Count * 32)

    const noteCount = r.readUInt32LE()
    const notes: SngNoteData[] = []
    for (let n = 0; n < noteCount; n++) {
      notes.push(readNote(r))
    }

    const phraseCount = r.readUInt32LE()
    r.skip(phraseCount * 12)

    const chordNotes: SngChordNoteData[] = []
    levels.push({ difficulty, anchors, notes, chordNotes, phraseCount })
  }
  return levels
}

function readVocals(r: BinaryReader): SngVocal[] {
  if (r.remaining < 4) return []
  const count = r.readUInt32LE()
  const vocals: SngVocal[] = []
  for (let i = 0; i < count; i++) {
    vocals.push({
      time: r.readFloat32LE(),
      note: r.readInt32LE(),
      length: r.readFloat32LE(),
      lyric: r.readFixedString(48)
    })
  }
  return vocals
}

export function parseSng(data: Buffer): SngData {
  const r = new BinaryReader(data)
  const beats = readBeats(r)
  const phrases = readPhrases(r)
  const chordTemplates = readChordTemplates(r)
  readChordNotes(r)
  readVocals(r) // vocals in non-vocal SNG are empty
  readPhraseExtraInfo(r)
  readLinkedDiffs(r)
  readActions(r)
  readEvents(r)
  readTones(r)
  readDNAs(r)
  const sections = readSections(r)
  const phraseIterations = readPhraseIterations(r)
  const arrangements = readArrangementLevels(r)

  return {
    beats,
    phrases,
    phraseIterations,
    chordTemplates,
    sections,
    arrangements,
    notes: arrangements.map((a) => ({ difficulty: a.difficulty, notes: a.notes })),
    vocals: []
  }
}

export function parseVocalsSng(data: Buffer): SngVocal[] {
  const r = new BinaryReader(data)

  try {
    const vocals = readVocals(r)
    if (vocals.length > 0) return vocals
  } catch {
    // fallback: skip header sections
  }

  const r2 = new BinaryReader(data)
  readBeats(r2)
  readPhrases(r2)
  readChordTemplates(r2)
  readChordNotes(r2)
  return readVocals(r2)
}
