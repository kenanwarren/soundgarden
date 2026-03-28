import type { ChordVoicing } from '../../utils/chord-voicings'

interface ChordDiagramProps {
  voicing: ChordVoicing
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { width: 80, height: 100, stringSpacing: 12, fretSpacing: 16, dotRadius: 4, fontSize: 8 },
  md: { width: 120, height: 150, stringSpacing: 18, fretSpacing: 24, dotRadius: 6, fontSize: 11 },
  lg: { width: 160, height: 200, stringSpacing: 24, fretSpacing: 32, dotRadius: 8, fontSize: 14 }
}

const FRETS_SHOWN = 4

export function ChordDiagram({
  voicing,
  size = 'md',
  className = ''
}: ChordDiagramProps): JSX.Element {
  const s = SIZES[size]
  const paddingTop = s.fretSpacing + 8
  const paddingLeft = 14
  const gridWidth = 5 * s.stringSpacing
  const gridHeight = FRETS_SHOWN * s.fretSpacing
  const totalWidth = gridWidth + paddingLeft * 2
  const totalHeight = gridHeight + paddingTop + 20

  const playedFrets = voicing.frets.filter((f): f is number => f !== null)
  const minFret = Math.min(...playedFrets)
  const maxFret = Math.max(...playedFrets)
  const startFret = minFret <= 2 ? 1 : minFret

  const stringX = (i: number) => paddingLeft + i * s.stringSpacing
  const fretY = (f: number) => paddingTop + (f - startFret) * s.fretSpacing

  const isFirstPosition = startFret === 1

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={s.width}
      height={s.height}
      className={className}
    >
      {/* Chord name */}
      <text
        x={totalWidth / 2}
        y={s.fontSize + 2}
        textAnchor="middle"
        fontSize={s.fontSize + 2}
        fontWeight="bold"
        fill="white"
      >
        {voicing.name}
      </text>

      {/* Nut or position indicator */}
      {isFirstPosition ? (
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft + gridWidth}
          y2={paddingTop}
          stroke="#d4d4d8"
          strokeWidth="3"
        />
      ) : (
        <text
          x={paddingLeft - 10}
          y={fretY(startFret) + s.fretSpacing / 2 + 4}
          textAnchor="middle"
          fontSize={s.fontSize - 1}
          fill="#a1a1aa"
        >
          {startFret}
        </text>
      )}

      {/* Fret lines */}
      {Array.from({ length: FRETS_SHOWN + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={paddingLeft}
          y1={paddingTop + i * s.fretSpacing}
          x2={paddingLeft + gridWidth}
          y2={paddingTop + i * s.fretSpacing}
          stroke="#52525b"
          strokeWidth="1"
        />
      ))}

      {/* String lines */}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={stringX(i)}
          y1={paddingTop}
          x2={stringX(i)}
          y2={paddingTop + gridHeight}
          stroke="#71717a"
          strokeWidth={1 + i * 0.15}
        />
      ))}

      {/* Barre indicators */}
      {voicing.barres.map((barre, i) => {
        const y = fretY(barre.fret) + s.fretSpacing / 2
        return (
          <rect
            key={`barre-${i}`}
            x={stringX(barre.fromString) - s.dotRadius}
            y={y - s.dotRadius}
            width={stringX(barre.toString) - stringX(barre.fromString) + s.dotRadius * 2}
            height={s.dotRadius * 2}
            rx={s.dotRadius}
            fill="#10b981"
          />
        )
      })}

      {/* Finger positions and muted/open indicators */}
      {voicing.frets.map((fret, i) => {
        const x = stringX(i)

        if (fret === null) {
          return (
            <text
              key={`mute-${i}`}
              x={x}
              y={paddingTop - 6}
              textAnchor="middle"
              fontSize={s.fontSize}
              fill="#ef4444"
            >
              ×
            </text>
          )
        }

        if (fret === 0) {
          return (
            <circle
              key={`open-${i}`}
              cx={x}
              cy={paddingTop - 8}
              r={s.dotRadius - 1}
              fill="none"
              stroke="#a1a1aa"
              strokeWidth="1.5"
            />
          )
        }

        const y = fretY(fret) + s.fretSpacing / 2
        const hasBarre = voicing.barres.some(
          (b) => b.fret === fret && i >= b.fromString && i <= b.toString
        )
        if (hasBarre) return null

        return (
          <circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r={s.dotRadius}
            fill="#10b981"
          />
        )
      })}
    </svg>
  )
}
