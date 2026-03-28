export interface PsarcHeader {
  magic: string
  versionMajor: number
  versionMinor: number
  compressionMethod: string
  tocSize: number
  tocEntrySize: number
  tocEntryCount: number
  blockSize: number
  archiveFlags: number
}

export interface PsarcTocEntry {
  md5Hash: Buffer
  blockListStart: number
  originalSize: bigint
  offset: bigint
}

export interface PsarcFile {
  path: string
  data: Buffer
}

export interface SngBeat {
  time: number
  measure: number
  beat: number
  phraseIteration: number
  mask: number
}

export interface SngNote {
  time: number
  string: number
  fret: number
  chordId: number
  sustain: number
  bend: number
  slideTo: number
  slideUnpitchTo: number
  vibrato: number
  techniques: number
  difficulty: number
  anchorFret: number
  anchorWidth: number
  fingerprint: number[]
}

export interface SngChordTemplate {
  mask: number
  frets: number[]
  fingers: number[]
  notes: number[]
  name: string
}

export interface SngSection {
  name: string
  number: number
  startTime: number
  endTime: number
  startPhraseIterationId: number
  endPhraseIterationId: number
  stringMask: number[]
}

export interface SngPhrase {
  solo: number
  disparity: number
  ignore: number
  maxDifficulty: number
  phraseIterationLinks: number
  name: string
}

export interface SngPhraseIteration {
  phraseId: number
  startTime: number
  nextPhraseTime: number
  difficulty: number[]
}

export interface SngVocal {
  time: number
  note: number
  length: number
  lyric: string
}

export interface SngArrangement {
  notes: SngNote[]
  chordTemplates: SngChordTemplate[]
  beats: SngBeat[]
  sections: SngSection[]
  phrases: SngPhrase[]
  phraseIterations: SngPhraseIteration[]
  vocals: SngVocal[]
}

export interface SngData {
  beats: SngBeat[]
  phrases: SngPhrase[]
  phraseIterations: SngPhraseIteration[]
  chordTemplates: SngChordTemplate[]
  sections: SngSection[]
  arrangements: SngArrangementLevel[]
  notes: SngNoteArray[]
  vocals: SngVocal[]
}

export interface SngArrangementLevel {
  difficulty: number
  anchors: SngAnchor[]
  notes: SngNoteData[]
  chordNotes: SngChordNoteData[]
  phraseCount: number
}

export interface SngAnchor {
  startTime: number
  endTime: number
  fret: number
  width: number
  phraseIterationId: number
}

export interface SngNoteData {
  time: number
  string: number
  fret: number
  chordId: number
  chordNotesId: number
  sustain: number
  bend: number
  slideTo: number
  slideUnpitchTo: number
  vibrato: number
  mask: number
  anchorFret: number
  anchorWidth: number
  fingerprint0: number
  fingerprint1: number
}

export interface SngChordNoteData {
  mask: number[]
  bend: number[]
  slideTo: number[]
  slideUnpitchTo: number[]
  vibrato: number[]
  string: number[]
  fret: number[]
  sustain: number[]
}

export interface SngNoteArray {
  difficulty: number
  notes: SngNoteData[]
}

export interface ManifestAttributes {
  songName: string
  artistName: string
  albumName: string
  songYear: number
  arrangementName: string
  tuning: {
    string0: number
    string1: number
    string2: number
    string3: number
    string4: number
    string5: number
  }
  capo: number
  centOffset: number
  songLength: number
  tempo: number
  sngAsset: string
  persistentID: string
  fullName: string
  arrangementType: number
  chordTemplates?: Array<{ chordName: string; fingers: number[]; frets: number[] }>
  sections?: Array<{ name: string; number: number; startTime: number; endTime: number }>
  phrases?: Array<{ name: string; maxDifficulty: number }>
}

export interface ManifestData {
  attributes: ManifestAttributes
  header: {
    dlcKey: string
  }
}

export interface ParsedPsarc {
  manifests: ManifestData[]
  arrangements: Map<string, SngData>
  files: Map<string, Buffer>
}

export const enum Platform {
  PC = 'pc',
  Mac = 'mac'
}
