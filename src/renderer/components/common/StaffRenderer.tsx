import { useEffect, useRef } from 'react'
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Beam,
  Accidental,
  TabStave,
  TabNote,
  Dot,
  GhostNote,
  type Tickable
} from 'vexflow'
import type {
  SongNotation,
  NotationMeasure,
  NotationNote,
  NoteDuration
} from '../../utils/learn-types'
import { getMeasureDurationUnits, getTimeSignatureUnits } from '../../utils/notation'

type ViewMode = 'staff' | 'tab' | 'staff+tab'

interface StaffRendererProps {
  notation: SongNotation
  songKey: string
  viewMode: ViewMode
  measuresPerLine?: number
}

const BASE_MEASURE_WIDTH = 210
const MIN_MEASURE_WIDTH = 118
const FIRST_SYSTEM_PADDING = 96
const SYSTEM_CLEF_PADDING = 34
const TAB_ONLY_CLEF_PADDING = 28
const STAVE_X_START = 10
const STAFF_Y_START = 40

const NOTE_STYLE = { fillStyle: '#d4d4d8', strokeStyle: '#d4d4d8' }

const DURATION_MAP: Record<NoteDuration, string> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
  sixteenth: '16'
}

const GHOST_DURATION_MAP: Record<NoteDuration, string> = {
  whole: '1',
  half: '2',
  quarter: '4',
  eighth: '8',
  sixteenth: '16'
}

function pitchToVex(pitch: string): string {
  if (pitch === 'rest') return 'b/4'
  const match = pitch.match(/^([A-G])(#|b)?(\d)$/)
  if (!match) return 'c/4'
  return `${match[1].toLowerCase()}${match[2] ?? ''}/${match[3]}`
}

function buildMeasureVoice(measure: NotationMeasure): Voice {
  return new Voice({
    numBeats: Math.max(getMeasureDurationUnits(measure), 1),
    beatValue: 32
  }).setMode(Voice.Mode.FULL)
}

function createStaffNote(note: NotationNote): StaveNote {
  const isRest = note.pitch === 'rest'
  const duration = DURATION_MAP[note.duration] + (isRest ? 'r' : '')
  const keys = isRest ? ['b/4'] : [pitchToVex(note.pitch)]
  const staveNote = new StaveNote({ keys, duration })

  if (!isRest) {
    const parsed = note.pitch.match(/^([A-G])(#|b)?(\d)$/)
    if (parsed?.[2] === '#') staveNote.addModifier(new Accidental('#'), 0)
    else if (parsed?.[2] === 'b') staveNote.addModifier(new Accidental('b'), 0)
  }

  if (note.dotted) Dot.buildAndAttach([staveNote])

  staveNote.setStyle(NOTE_STYLE)
  staveNote.setStemStyle(NOTE_STYLE)
  if (!isRest) staveNote.setFlagStyle(NOTE_STYLE)

  return staveNote
}

function createTabTickable(note: NotationNote): Tickable {
  if (note.pitch === 'rest') {
    return new GhostNote({
      duration: GHOST_DURATION_MAP[note.duration] + (note.dotted ? 'd' : '')
    })
  }

  const tabNote = new TabNote({
    positions: note.tab ? [{ str: note.tab.string + 1, fret: note.tab.fret }] : [{ str: 1, fret: 0 }],
    duration: DURATION_MAP[note.duration]
  })

  if (note.dotted) Dot.buildAndAttach([tabNote])
  tabNote.setStyle(NOTE_STYLE)
  return tabNote
}

function getMeasureWidth(
  measure: NotationMeasure,
  expectedUnits: number,
  isFirstMeasureOfSong: boolean,
  isFirstMeasureOfSystem: boolean,
  showStaff: boolean,
  showTab: boolean
): number {
  const actualUnits = Math.max(getMeasureDurationUnits(measure), 1)
  const widthRatio = Math.max(actualUnits / expectedUnits, 0.35)
  const accidentalCount = measure.notes.filter((note) => /[#b]/.test(note.pitch)).length
  const denseNotePadding = Math.max(0, measure.notes.length - 4) * 18
  const dottedPadding = measure.notes.filter((note) => note.dotted).length * 6
  const lyricPadding = Math.max(0, (measure.lyricFragment?.length ?? 0) - 12) * 2

  let width = Math.max(Math.round(BASE_MEASURE_WIDTH * widthRatio), MIN_MEASURE_WIDTH)
  width += accidentalCount * 12 + denseNotePadding + dottedPadding + lyricPadding

  if (isFirstMeasureOfSystem) {
    if (showStaff) {
      width += isFirstMeasureOfSong ? FIRST_SYSTEM_PADDING : SYSTEM_CLEF_PADDING
    } else if (showTab) {
      width += TAB_ONLY_CLEF_PADDING
    }
  }

  return width
}

function renderNotation(
  container: HTMLDivElement,
  notation: SongNotation,
  songKey: string,
  viewMode: ViewMode,
  measuresPerLine: number
): void {
  container.innerHTML = ''

  const showStaff = viewMode === 'staff' || viewMode === 'staff+tab'
  const showTab = viewMode === 'tab' || viewMode === 'staff+tab'

  const expectedUnits = getTimeSignatureUnits(notation.timeSignature)
  const systems: Array<Array<{ measure: NotationMeasure; width: number }>> = []
  for (let i = 0; i < notation.measures.length; i += measuresPerLine) {
    systems.push(
      notation.measures.slice(i, i + measuresPerLine).map((measure, offset) => ({
        measure,
        width: getMeasureWidth(
          measure,
          expectedUnits,
          i === 0 && offset === 0,
          offset === 0,
          showStaff,
          showTab
        )
      }))
    )
  }

  const totalWidth =
    Math.max(
      ...systems.map(
        (system) => STAVE_X_START + system.reduce((sum, measure) => sum + measure.width, 0) + 20
      ),
      STAVE_X_START + 20
    )
  let systemHeight = 0
  if (showStaff) systemHeight += 130
  if (showTab) systemHeight += 130
  systemHeight += 30
  const totalHeight = systems.length * systemHeight + 40

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(totalWidth, totalHeight)
  const context = renderer.getContext()

  const svg = container.querySelector('svg')
  if (svg) {
    svg.style.width = '100%'
    svg.style.height = 'auto'
    svg.style.background = 'transparent'
  }

  context.setFillStyle('#d4d4d8')
  context.setStrokeStyle('#71717a')
  context.setFont('sans-serif', 10)

  const [tsNum, tsDen] = notation.timeSignature
  const timeSig = `${tsNum}/${tsDen}`

  systems.forEach((measures, si) => {
    const yStaff = si * systemHeight + STAFF_Y_START
    const yTab = yStaff + (showStaff ? 110 : 0)
    let x = STAVE_X_START

    measures.forEach(({ measure, width }, mi) => {
      const isFirstMeasureOfSystem = mi === 0
      const isFirstMeasureOfSong = si === 0 && mi === 0

      let stave: Stave | null = null
      let tabStave: TabStave | null = null

      if (showStaff) {
        stave = new Stave(x, yStaff, width)
        if (isFirstMeasureOfSong) {
          stave.addClef('treble').addKeySignature(songKey).addTimeSignature(timeSig)
        } else if (isFirstMeasureOfSystem) {
          stave.addClef('treble')
        }
        stave.setContext(context)
        stave.setStyle({ fillStyle: '#71717a', strokeStyle: '#52525b' })
        stave.draw()
      }

      if (showTab) {
        tabStave = new TabStave(x, yTab, width)
        if (isFirstMeasureOfSystem) tabStave.addClef('tab')
        tabStave.setContext(context)
        tabStave.setStyle({ fillStyle: '#71717a', strokeStyle: '#52525b' })
        tabStave.draw()
      }

      const staveNotes: StaveNote[] = []
      const tabTickables: Tickable[] = []

      for (const note of measure.notes) {
        if (showStaff) staveNotes.push(createStaffNote(note))
        if (showTab) tabTickables.push(createTabTickable(note))
      }

      if (showStaff && showTab && stave && tabStave && staveNotes.length > 0 && tabTickables.length > 0) {
        const voice = buildMeasureVoice(measure)
        const tabVoice = buildMeasureVoice(measure)
        voice.addTickables(staveNotes)
        tabVoice.addTickables(tabTickables)
        tabStave.setNoteStartX(stave.getNoteStartX())
        new Formatter().joinVoices([voice]).joinVoices([tabVoice]).formatToStave([voice, tabVoice], stave)
        const beams = Beam.generateBeams(staveNotes)
        voice.draw(context, stave)
        tabVoice.draw(context, tabStave)
        beams.forEach((b) => {
          b.setStyle(NOTE_STYLE)
          b.setContext(context).draw()
        })
      } else if (showStaff && stave && staveNotes.length > 0) {
        const voice = buildMeasureVoice(measure)
        voice.addTickables(staveNotes)
        new Formatter().joinVoices([voice]).formatToStave([voice], stave)

        const beams = Beam.generateBeams(staveNotes)
        voice.draw(context, stave)
        beams.forEach((b) => {
          b.setStyle(NOTE_STYLE)
          b.setContext(context).draw()
        })
      } else if (showTab && tabStave && tabTickables.length > 0) {
        const tabVoice = buildMeasureVoice(measure)
        tabVoice.addTickables(tabTickables)
        new Formatter().joinVoices([tabVoice]).formatToStave([tabVoice], tabStave)
        tabVoice.draw(context, tabStave)
      }

      if (measure.chord) {
        const topStave = showStaff ? stave : tabStave
        const chordY = topStave
          ? topStave.getTopLineTopY() - (showStaff ? 20 : 14)
          : (showStaff ? yStaff : yTab) + 8
        context.save()
        context.setFont('sans-serif', 13, 'bold')
        context.setFillStyle('#34d399')
        context.fillText(measure.chord, x + 10, chordY)
        context.restore()
      }

      if (measure.lyricFragment) {
        // Position lyrics below the bottommost stave.
        // VexFlow TabStave: created at yTab, bottom line is at yTab + numLines*spacing + padding.
        // Use getBottomLineBottomY() for the actual last line, then add margin.
        const bottomStave = showTab ? tabStave : stave
        const lyricY = bottomStave
          ? bottomStave.getBottomLineBottomY() + 25
          : (showTab ? yTab : yStaff) + 120
        context.save()
        context.setFont('sans-serif', 10, 'italic')
        context.setFillStyle('#a1a1aa')
        context.fillText(measure.lyricFragment, x + 10, lyricY)
        context.restore()
      }

      x += width
    })
  })

  // Fix clearRect artifacts: VexFlow's SVG context emits <rect> with fill="#ffffff"
  // to erase staff lines behind tab fret numbers. Recolor them to match our dark bg.
  if (svg) {
    svg.querySelectorAll('rect[fill="#ffffff"], rect[fill="white"]').forEach((rect) => {
      rect.setAttribute('fill', '#18181b')
    })
  }
}

export function StaffRenderer({
  notation,
  songKey,
  viewMode,
  measuresPerLine = 4
}: StaffRendererProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    renderNotation(containerRef.current, notation, songKey, viewMode, measuresPerLine)
  }, [notation, songKey, viewMode, measuresPerLine])

  return <div ref={containerRef} className="overflow-x-auto" />
}
