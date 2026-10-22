import { useCallback, useRef, useState } from 'react'

// Drag, tap or use arrow keys to compare two layers of the same size.
export default function BeforeAfterSlider({ before, after, beforeLabel = 'Before', afterLabel = 'After', initial = 50, className = '' }) {
  const [pos, setPos] = useState(initial)
  const box = useRef(null)
  const dragging = useRef(false)

  const move = useCallback((clientX) => {
    const r = box.current.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }, [])

  return (
    <div
      ref={box}
      className={`relative select-none overflow-hidden rounded-xl touch-pan-y ${className}`}
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX) }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => { dragging.current = false }}
      onPointerCancel={() => { dragging.current = false }}
    >
      <div className="absolute inset-0">{after}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>{before}</div>
      <span className="pointer-events-none absolute left-3 top-3 rounded bg-ink/75 px-2 py-1 text-xs font-medium text-ivory">{beforeLabel}</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded bg-sage-deep/90 px-2 py-1 text-xs font-medium text-ivory">{afterLabel}</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-ivory shadow" style={{ left: `${pos}%` }} />
      <button
        type="button"
        role="slider"
        aria-label="Comparison position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 4))
          if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 4))
          if (e.key === 'Home') setPos(0)
          if (e.key === 'End') setPos(100)
        }}
        className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-ivory bg-sage-deep text-ivory shadow-panel"
        style={{ left: `${pos}%` }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 4 2 9l4 5M12 4l4 5-4 5" /></svg>
      </button>
    </div>
  )
}
