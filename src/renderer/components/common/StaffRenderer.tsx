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
  Dot
} from 'vexflow'
import type {
  SongNotation,
  NotationMeasure,
  NotationNote,
  NoteDuration
} from '../../utils/learn-types'

type ViewMode = 'staff' | 'tab' | 'staff+tab'

interface StaffRendererProps {
  notation: SongNotation
  songKey: string
  viewMode: ViewMode
  measuresPerLine?: number
}

const MEASURE_WIDTH = 220
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

function pitchToVex(pitch: string): string {
  if (pitch === 'rest') return 'b/4'
  const match = pitch.match(/^([A-G])(#|b)?(\d)$/)
  if (!match) return 'c/4'
  return `${match[1].toLowerCase()}${match[2] ?? ''}/${match[3]}`
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

  const systems: NotationMeasure[][] = []
  for (let i = 0; i < notation.measures.length; i += measuresPerLine) {
    systems.push(notation.measures.slice(i, i + measuresPerLine))
  }

  const totalWidth = STAVE_X_START + measuresPerLine * MEASURE_WIDTH + 20
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
    const isFirst = si === 0
    const yStaff = si * systemHeight + STAFF_Y_START
    const yTab = yStaff + (showStaff ? 110 : 0)

    measures.forEach((measure, mi) => {
      const x = STAVE_X_START + mi * MEASURE_WIDTH
      const width = MEASURE_WIDTH

      let stave: Stave | null = null
      let tabStave: TabStave | null = null

      if (showStaff) {
        stave = new Stave(x, yStaff, width)
        if (mi === 0 && isFirst) {
          stave.addClef('treble').addKeySignature(songKey).addTimeSignature(timeSig)
        } else if (mi === 0) {
          stave.addClef('treble')
        }
        stave.setContext(context)
        stave.setStyle({ fillStyle: '#71717a', strokeStyle: '#52525b' })
        stave.draw()
      }

      if (showTab) {
        tabStave = new TabStave(x, yTab, width)
        if (mi === 0) tabStave.addClef('tab')
        tabStave.setContext(context)
        tabStave.setStyle({ fillStyle: '#71717a', strokeStyle: '#52525b' })
        tabStave.draw()
      }

      const staveNotes: StaveNote[] = []
      const tabNotes: TabNote[] = []

      for (const note of measure.notes) {
        const isRest = note.pitch === 'rest'

        if (showStaff) {
          const dur = DURATION_MAP[note.duration] + (isRest ? 'r' : '')
          const keys = isRest ? ['b/4'] : [pitchToVex(note.pitch)]
          const sn = new StaveNote({ keys, duration: dur })

          if (!isRest) {
            const parsed = note.pitch.match(/^([A-G])(#|b)?(\d)$/)
            if (parsed?.[2] === '#') sn.addModifier(new Accidental('#'), 0)
            else if (parsed?.[2] === 'b') sn.addModifier(new Accidental('b'), 0)
          }

          if (note.dotted) Dot.buildAndAttach([sn])

          sn.setStyle(NOTE_STYLE)
          sn.setStemStyle(NOTE_STYLE)
          if (!isRest) sn.setFlagStyle(NOTE_STYLE)

          staveNotes.push(sn)
        }

        if (showTab) {
          const positions = isRest
            ? [{ str: 1, fret: 0 }]
            : note.tab
              ? [{ str: note.tab.string + 1, fret: note.tab.fret }]
              : [{ str: 1, fret: 0 }]
          const tn = new TabNote({ positions, duration: DURATION_MAP[note.duration] })
          tn.setStyle(NOTE_STYLE)
          tabNotes.push(tn)
        }
      }

      if (showStaff && stave && staveNotes.length > 0) {
        const voice = new Voice({ numBeats: tsNum, beatValue: tsDen })
        voice.setStrict(false)
        voice.addTickables(staveNotes)
        new Formatter().joinVoices([voice]).format([voice], width - 50)

        const beams = Beam.generateBeams(staveNotes)
        voice.draw(context, stave)
        beams.forEach((b) => {
          b.setStyle(NOTE_STYLE)
          b.setContext(context).draw()
        })
      }

      if (showTab && tabStave && tabNotes.length > 0) {
        const tabVoice = new Voice({ numBeats: tsNum, beatValue: tsDen })
        tabVoice.setStrict(false)
        tabVoice.addTickables(tabNotes)
        new Formatter().joinVoices([tabVoice]).format([tabVoice], width - 50)
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
        context.fillText(measure.lyricFragment, x + width / 2 - 20, lyricY)
        context.restore()
      }
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
