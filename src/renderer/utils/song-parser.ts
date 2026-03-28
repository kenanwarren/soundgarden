export interface LyricSegment {
  chord: string | null
  text: string
}

export interface ParsedLine {
  type: 'lyrics' | 'section' | 'blank'
  segments?: LyricSegment[]
  label?: string
}

export function parseSongLine(line: string): ParsedLine {
  if (line === '') return { type: 'blank' }

  const sectionMatch = line.match(/^\[section:(.+)\]$/)
  if (sectionMatch) return { type: 'section', label: sectionMatch[1] }

  const segments: LyricSegment[] = []
  const re = /\[([^\]]+)\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ chord: null, text: line.slice(lastIndex, match.index) })
    }
    const chord = match[1]
    const nextBracket = line.indexOf('[', re.lastIndex)
    const text =
      nextBracket === -1 ? line.slice(re.lastIndex) : line.slice(re.lastIndex, nextBracket)
    segments.push({ chord, text })
    lastIndex = re.lastIndex + text.length
  }

  if (lastIndex < line.length) {
    segments.push({ chord: null, text: line.slice(lastIndex) })
  }

  if (segments.length === 0) {
    segments.push({ chord: null, text: line })
  }

  return { type: 'lyrics', segments }
}
