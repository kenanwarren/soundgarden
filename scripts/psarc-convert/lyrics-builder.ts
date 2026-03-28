import type { SngSection, SngVocal } from './types'

interface ChordEvent {
  time: number
  name: string
}

export function buildLyricLines(
  vocals: SngVocal[],
  sections: SngSection[],
  chordEvents: ChordEvent[]
): string[] {
  if (vocals.length === 0 && chordEvents.length === 0) return []

  if (vocals.length === 0) {
    return buildChordOnlyLines(sections, chordEvents)
  }

  const rawLines = splitVocalsIntoLines(vocals, sections)
  return mergeWithSections(rawLines, sections, chordEvents)
}

interface RawLyricLine {
  startTime: number
  endTime: number
  text: string
}

// Rocksmith vocal format:
// - "word" = standalone word
// - "syl-" = syllable continues (join with next without space)
// - "ble+" = connect to next word without space (rare, used for elision)
function splitVocalsIntoLines(vocals: SngVocal[], sections: SngSection[]): RawLyricLine[] {
  const lines: RawLyricLine[] = []
  let lineWords: string[] = []
  let currentWord = ''
  let lineStartTime = 0
  let lineEndTime = 0
  let lastVocalEnd = 0

  // Threshold for splitting lines: ~2 beats at typical tempo
  const LINE_GAP_THRESHOLD = 1.2

  for (let i = 0; i < vocals.length; i++) {
    const vocal = vocals[i]
    const lyric = vocal.lyric

    // Check if we should start a new line (timing gap or section boundary)
    // Don't split mid-word (when currentWord is non-empty from a previous hyphenated syllable)
    if ((lineWords.length > 0 || currentWord) && !currentWord) {
      const gap = vocal.time - lastVocalEnd
      const crossesSection = sections.some(
        (s) => s.startTime > lastVocalEnd - 0.1 && s.startTime < vocal.time + 0.1
      )

      if (gap > LINE_GAP_THRESHOLD || crossesSection) {
        if (lineWords.length > 0) {
          lines.push({ startTime: lineStartTime, endTime: lineEndTime, text: lineWords.join(' ') })
          lineWords = []
        }
      }
    }

    if (lineWords.length === 0 && !currentWord) {
      lineStartTime = vocal.time
    }

    lineEndTime = vocal.time + vocal.length
    lastVocalEnd = lineEndTime

    if (lyric.endsWith('-')) {
      // Syllable continues — append without space
      currentWord += lyric.slice(0, -1)
    } else if (lyric.endsWith('+')) {
      // "+" suffix = end of phrase/line break
      currentWord += lyric.slice(0, -1)
      lineWords.push(currentWord)
      currentWord = ''
      lines.push({ startTime: lineStartTime, endTime: lineEndTime, text: lineWords.join(' ') })
      lineWords = []
    } else {
      // Complete word or end of syllable chain
      currentWord += lyric
      lineWords.push(currentWord)
      currentWord = ''
    }
  }

  // Flush remaining
  if (currentWord) lineWords.push(currentWord)
  if (lineWords.length > 0) {
    lines.push({ startTime: lineStartTime, endTime: lineEndTime, text: lineWords.join(' ') })
  }

  return lines
}

function formatSectionName(name: string, number: number): string {
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1)
  if (number > 1) return `${capitalized} ${number}`
  return capitalized
}

function mergeWithSections(
  lines: RawLyricLine[],
  sections: SngSection[],
  chordEvents: ChordEvent[]
): string[] {
  const result: string[] = []
  let sectionIdx = 0
  let lastSection = ''

  for (const line of lines) {
    // Insert section headers before this line
    while (sectionIdx < sections.length && sections[sectionIdx].startTime <= line.startTime + 0.1) {
      const sectionName = formatSectionName(sections[sectionIdx].name, sections[sectionIdx].number)
      if (sectionName !== lastSection) {
        if (result.length > 0) result.push('')
        result.push(`[section:${sectionName}]`)
        lastSection = sectionName
      }
      sectionIdx++
    }

    // Find chords during this line
    const lineChords = chordEvents.filter(
      (c) => c.time >= line.startTime - 0.1 && c.time <= line.endTime + 0.1
    )

    if (lineChords.length === 0) {
      result.push(cleanLyricText(line.text))
      continue
    }

    result.push(insertChordsIntoText(line.text, line.startTime, line.endTime, lineChords))
  }

  // Remaining sections after all lyrics (instrumental sections)
  while (sectionIdx < sections.length) {
    const sectionName = formatSectionName(sections[sectionIdx].name, sections[sectionIdx].number)
    if (sectionName !== lastSection) {
      if (result.length > 0) result.push('')
      result.push(`[section:${sectionName}]`)
      lastSection = sectionName

      // Add chord-only content for instrumental sections
      const sectionStart = sections[sectionIdx].startTime
      const sectionEnd =
        sectionIdx + 1 < sections.length ? sections[sectionIdx + 1].startTime : Infinity
      const sectionChords = chordEvents.filter(
        (c) => c.time >= sectionStart - 0.1 && c.time < sectionEnd - 0.1
      )
      if (sectionChords.length > 0) {
        for (let j = 0; j < sectionChords.length; j += 4) {
          const batch = sectionChords.slice(j, j + 4)
          result.push(batch.map((c) => `[${c.name}]`).join(' '))
        }
      }
    }
    sectionIdx++
  }

  return result
}

function insertChordsIntoText(
  text: string,
  startTime: number,
  endTime: number,
  chords: ChordEvent[]
): string {
  const duration = endTime - startTime
  if (duration <= 0) return `[${chords[0].name}]${text}`

  // Build insertions sorted by position
  type Insertion = { pos: number; chord: string }
  const insertions: Insertion[] = []

  for (const chord of chords) {
    const fraction = Math.max(0, (chord.time - startTime) / duration)
    const rawPos = Math.round(fraction * text.length)
    const pos = snapToWordBoundary(text, rawPos)
    insertions.push({ pos, chord: chord.name })
  }

  // Sort descending to insert right-to-left
  insertions.sort((a, b) => b.pos - a.pos)

  let result = text
  for (const ins of insertions) {
    result = result.slice(0, ins.pos) + `[${ins.chord}]` + result.slice(ins.pos)
  }

  return cleanLyricText(result)
}

function snapToWordBoundary(text: string, pos: number): number {
  // Snap to nearest word boundary within 5 chars
  const maxSearch = 5
  let bestPos = pos
  let bestDist = maxSearch + 1

  for (let i = 0; i <= text.length; i++) {
    const isWordStart = i === 0 || text[i - 1] === ' '
    if (!isWordStart) continue
    const dist = Math.abs(i - pos)
    if (dist < bestDist) {
      bestDist = dist
      bestPos = i
    }
  }

  return bestPos
}

function cleanLyricText(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

function buildChordOnlyLines(sections: SngSection[], chordEvents: ChordEvent[]): string[] {
  const lines: string[] = []

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const nextStart = i + 1 < sections.length ? sections[i + 1].startTime : Infinity

    if (lines.length > 0) lines.push('')
    lines.push(`[section:${formatSectionName(section.name, section.number)}]`)

    const sectionChords = chordEvents.filter(
      (c) => c.time >= section.startTime - 0.1 && c.time < nextStart - 0.1
    )

    if (sectionChords.length > 0) {
      for (let j = 0; j < sectionChords.length; j += 4) {
        const batch = sectionChords.slice(j, j + 4)
        lines.push(batch.map((c) => `[${c.name}]`).join(' '))
      }
    }
  }

  return lines
}
