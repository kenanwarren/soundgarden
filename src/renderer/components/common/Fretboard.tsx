import type { FretPosition } from '../../utils/fretboard-data'

interface FretboardProps {
  highlightedPositions: FretPosition[]
  activeNote?: { note: string; octave: number } | null
  rootNote?: string
  maxFret?: number
  className?: string
}

const STRING_COUNT = 6
const FRET_MARKER_FRETS = [3, 5, 7, 9, 12, 15]
const DOUBLE_MARKER_FRETS = [12]

export function Fretboard({
  highlightedPositions,
  activeNote,
  rootNote,
  maxFret = 15,
  className = ''
}: FretboardProps): JSX.Element {
  const paddingLeft = 40
  const paddingRight = 10
  const paddingTop = 20
  const paddingBottom = 20
  const stringSpacing = 20
  const totalWidth = 900
  const fretAreaWidth = totalWidth - paddingLeft - paddingRight
  const totalHeight = paddingTop + (STRING_COUNT - 1) * stringSpacing + paddingBottom

  const fretX = (fret: number) => {
    if (fret === 0) return paddingLeft
    const ratio = fret / maxFret
    return paddingLeft + ratio * fretAreaWidth
  }

  const stringY = (s: number) => paddingTop + s * stringSpacing

  const positionSet = new Set(
    highlightedPositions.map((p) => `${p.string}-${p.fret}`)
  )
  const positionMap = new Map(
    highlightedPositions.map((p) => [`${p.string}-${p.fret}`, p])
  )

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className={`w-full ${className}`}
      style={{ maxHeight: '200px' }}
    >
      {/* Nut */}
      <line
        x1={paddingLeft}
        y1={paddingTop - 2}
        x2={paddingLeft}
        y2={stringY(STRING_COUNT - 1) + 2}
        stroke="#a1a1aa"
        strokeWidth="3"
      />

      {/* Fret lines */}
      {Array.from({ length: maxFret }, (_, i) => i + 1).map((fret) => (
        <line
          key={fret}
          x1={fretX(fret)}
          y1={paddingTop - 2}
          x2={fretX(fret)}
          y2={stringY(STRING_COUNT - 1) + 2}
          stroke="#52525b"
          strokeWidth="1"
        />
      ))}

      {/* Fret markers */}
      {FRET_MARKER_FRETS.filter((f) => f <= maxFret).map((fret) => {
        const cx = (fretX(fret) + fretX(fret - 1)) / 2
        if (DOUBLE_MARKER_FRETS.includes(fret)) {
          return (
            <g key={`marker-${fret}`}>
              <circle cx={cx} cy={stringY(1.5)} r="3" fill="#3f3f46" />
              <circle cx={cx} cy={stringY(3.5)} r="3" fill="#3f3f46" />
            </g>
          )
        }
        return (
          <circle
            key={`marker-${fret}`}
            cx={cx}
            cy={stringY(2.5)}
            r="3"
            fill="#3f3f46"
          />
        )
      })}

      {/* Strings */}
      {Array.from({ length: STRING_COUNT }, (_, s) => (
        <line
          key={`string-${s}`}
          x1={paddingLeft}
          y1={stringY(s)}
          x2={totalWidth - paddingRight}
          y2={stringY(s)}
          stroke="#71717a"
          strokeWidth={1 + s * 0.3}
        />
      ))}

      {/* Fret numbers */}
      {Array.from({ length: maxFret }, (_, i) => i + 1)
        .filter((f) => f <= 5 || f % 2 === 1 || FRET_MARKER_FRETS.includes(f))
        .map((fret) => (
          <text
            key={`label-${fret}`}
            x={(fretX(fret) + fretX(fret - 1)) / 2}
            y={totalHeight - 4}
            textAnchor="middle"
            fontSize="9"
            fill="#71717a"
          >
            {fret}
          </text>
        ))}

      {/* Highlighted positions */}
      {highlightedPositions.map((pos) => {
        const cx =
          pos.fret === 0
            ? paddingLeft - 14
            : (fretX(pos.fret) + fretX(pos.fret - 1)) / 2
        const cy = stringY(pos.string)
        const isRoot = pos.note === rootNote
        const isCurrentlyPlaying =
          activeNote && pos.note === activeNote.note && pos.octave === activeNote.octave

        return (
          <g key={`${pos.string}-${pos.fret}`}>
            <circle
              cx={cx}
              cy={cy}
              r={7}
              fill={isRoot ? '#10b981' : isCurrentlyPlaying ? '#fbbf24' : '#3b82f6'}
              opacity={isCurrentlyPlaying ? 1 : 0.85}
            />
            {isCurrentlyPlaying && (
              <circle
                cx={cx}
                cy={cy}
                r={10}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  values="8;12;8"
                  dur="1s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0.2;0.6"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <text
              x={cx}
              y={cy + 3.5}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill="white"
            >
              {pos.note}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
