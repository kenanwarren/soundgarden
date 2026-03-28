import { useCallback, useRef } from 'react'

interface KnobProps {
  value: number
  min: number
  max: number
  step?: number
  label: string
  unit?: string
  onChange: (value: number) => void
}

export function Knob({
  value,
  min,
  max,
  step = 0.01,
  label,
  unit = '',
  onChange
}: KnobProps): JSX.Element {
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startValue = useRef(0)

  const normalized = (value - min) / (max - min)
  const angle = -135 + normalized * 270 // -135 to +135 degrees

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true
      startY.current = e.clientY
      startValue.current = value

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return
        const delta = (startY.current - e.clientY) / 150
        const range = max - min
        let newValue = startValue.current + delta * range
        newValue = Math.round(newValue / step) * step
        newValue = Math.max(min, Math.min(max, newValue))
        onChange(newValue)
      }

      const handleMouseUp = () => {
        isDragging.current = false
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [value, min, max, step, onChange]
  )

  const displayValue = step >= 1 ? Math.round(value) : value.toFixed(1)

  return (
    <div
      className="flex flex-col items-center gap-1 select-none cursor-ns-resize"
      onMouseDown={handleMouseDown}
    >
      <svg width="48" height="48" viewBox="0 0 48 48">
        {/* Track */}
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="#3f3f46"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${normalized * 85} 100`}
          transform="rotate(-225 24 24)"
        />
        {/* Active arc */}
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${normalized * 85} 100`}
          transform="rotate(-225 24 24)"
          opacity={0.8}
        />
        {/* Knob body */}
        <circle cx="24" cy="24" r="12" fill="#27272a" stroke="#52525b" strokeWidth="1" />
        {/* Indicator line */}
        <line
          x1="24"
          y1="24"
          x2="24"
          y2="14"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${angle} 24 24)`}
        />
      </svg>
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-xs text-zinc-500 font-mono">
        {displayValue}
        {unit}
      </span>
    </div>
  )
}
