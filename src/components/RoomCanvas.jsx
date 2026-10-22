import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Group, Rect, Ellipse, Line, Text, Shape, Transformer } from 'react-konva'
import { CATALOG, catalogByType, glyphFills, isFlat } from '../lib/catalog'
import { bounds, corners, openingZone, wallLength } from '../lib/geometry'
import { fmtLen } from '../lib/units'

const FLOOR = '#f3efe4'
const MIN_SCALE = 0.15
const MAX_SCALE = 6

const frameFor = (room, wall) => ({
  top: { o: [0, 0], t: [1, 0], n: [0, 1] },
  bottom: { o: [0, room.width], t: [1, 0], n: [0, -1] },
  left: { o: [0, 0], t: [0, 1], n: [1, 0] },
  right: { o: [room.length, 0], t: [0, 1], n: [-1, 0] },
}[wall])

function Opening({ room, op, selected, onSelect, onDragStart, onDragMove, onDragEnd }) {
  const fr = frameFor(room, op.wall)
  const P = (s, u) => [fr.o[0] + fr.t[0] * s + fr.n[0] * u, fr.o[1] + fr.t[1] * s + fr.n[1] * u]
  const [a, b] = [P(op.offset, -8), P(op.offset + op.width, 8)]
  const x = Math.min(a[0], b[0])
  const y = Math.min(a[1], b[1])
  const w = Math.abs(a[0] - b[0])
  const h = Math.abs(a[1] - b[1])
  const H = P(op.offset, 0)
  const A = P(op.offset, op.width)
  const B = P(op.offset + op.width, 0)
  const sweepPositive = fr.n[0] * fr.t[1] - fr.n[1] * fr.t[0] > 0
  return (
    <Group
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'grab' }}
      onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default' }}
    >
      <Rect x={x} y={y} width={w} height={h} fill={op.kind === 'window' ? '#d5e3e6' : FLOOR} stroke={selected ? '#6f7f62' : undefined} strokeWidth={selected ? 3 : 0} strokeScaleEnabled={false} />
      {op.kind === 'window' && [-4, 0, 4].map((u) => {
        const p = P(op.offset, u)
        const q = P(op.offset + op.width, u)
        return <Line key={u} points={[...p, ...q]} stroke="#4d6a74" strokeWidth={2} listening={false} />
      })}
      {op.kind === 'door' && (
        <>
          <Line points={[...H, ...A]} stroke="#26282a" strokeWidth={3} listening={false} />
          <Shape
            listening={false}
            stroke="#7a7d75"
            strokeWidth={1.5}
            dash={[6, 5]}
            sceneFunc={(ctx, shape) => {
              const a0 = Math.atan2(A[1] - H[1], A[0] - H[0])
              const a1 = Math.atan2(B[1] - H[1], B[0] - H[0])
              ctx.beginPath()
              ctx.arc(H[0], H[1], op.width, a0, a1, !sweepPositive)
              ctx.fillStrokeShape(shape)
            }}
          />
        </>
      )}
    </Group>
  )
}

function Glyph({ item, issue, selected }) {
  const spec = catalogByType[item.type]
  const fills = glyphFills(item)
  const m = Math.min(item.w, item.d)
  const stroke = issue ? '#b5503c' : '#4a4d4f'
  return (
    <>
      {spec.glyph.map((s, i) => s.k === 'c'
        ? <Ellipse key={i} x={s.x * item.w} y={s.y * item.d} radiusX={(s.d * item.w) / 2} radiusY={(s.d * item.d) / 2} fill={fills[s.f]} listening={false} />
        : <Rect key={i} x={s.x * item.w} y={s.y * item.d} width={s.w * item.w} height={s.h * item.d} cornerRadius={s.rad * m} fill={fills[s.f]} listening={false} />)}
      {spec.round
        ? <Ellipse x={item.w / 2} y={item.d / 2} radiusX={item.w / 2} radiusY={item.d / 2} stroke={stroke} strokeWidth={issue ? 2.5 : 1.25} strokeScaleEnabled={false} fillEnabled={false} />
        : <Rect width={item.w} height={item.d} cornerRadius={m * 0.04} stroke={stroke} strokeWidth={issue ? 2.5 : 1.25} strokeScaleEnabled={false} fill={issue ? 'rgba(181,80,60,0.12)' : 'rgba(255,255,255,0.001)'} />}
      {selected && <Rect width={item.w} height={item.d} stroke="#6f7f62" strokeWidth={1.5} dash={[4, 3]} strokeScaleEnabled={false} listening={false} />}
    </>
  )
}

const RoomCanvas = forwardRef(function RoomCanvas(
  { room, furniture, issues, selection, onSelect, onItemChange, onOpeningChange, onOpeningStart, onDropItem, grid, snap, unit, showZones, rules, onZoomChange },
  ref,
) {
  const wrap = useRef(null)
  const stageRef = useRef(null)
  const trRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState({ scale: 0.5, x: 0, y: 0 })
  const fitted = useRef('')

  useLayoutEffect(() => {
    const el = wrap.current
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const fit = useCallback(() => {
    const margin = size.w < 600 ? 36 : 72
    const scale = Math.max(MIN_SCALE, Math.min((size.w - margin * 2) / room.length, (size.h - margin * 2) / room.width, MAX_SCALE))
    setView({ scale, x: (size.w - room.length * scale) / 2, y: (size.h - room.width * scale) / 2 })
  }, [size, room.length, room.width])

  useEffect(() => {
    const key = `${room.length}x${room.width}`
    if (size.w > 50 && size.h > 50 && (fitted.current !== key)) { fitted.current = key; fit() }
  }, [size, room.length, room.width, fit])

  useEffect(() => { onZoomChange?.(view.scale) }, [view.scale, onZoomChange])

  const zoomBy = useCallback((factor, center) => {
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
      const c = center || { x: size.w / 2, y: size.h / 2 }
      const wx = (c.x - v.x) / v.scale
      const wy = (c.y - v.y) / v.scale
      return { scale, x: c.x - wx * scale, y: c.y - wy * scale }
    })
  }, [size])

  useImperativeHandle(ref, () => ({ zoomIn: () => zoomBy(1.2), zoomOut: () => zoomBy(1 / 1.2), fit }), [zoomBy, fit])

  // attach transformer
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const node = selection?.kind === 'item' ? stage.findOne(`#item-${selection.id}`) : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selection, furniture, view.scale])

  const snapVal = useCallback((v) => (snap ? Math.round(v / grid) * grid : Math.round(v)), [snap, grid])

  const snapCenter = useCallback((node, item) => {
    const t = (node.rotation() * Math.PI) / 180
    const hx = (Math.abs(Math.cos(t)) * item.w + Math.abs(Math.sin(t)) * item.d) / 2
    const hy = (Math.abs(Math.sin(t)) * item.w + Math.abs(Math.cos(t)) * item.d) / 2
    return { x: snapVal(node.x() - hx) + hx, y: snapVal(node.y() - hy) + hy }
  }, [snapVal])

  const sorted = useMemo(() => [...furniture].sort((a, b) => Number(isFlat(b)) - Number(isFlat(a))), [furniture])
  const selectedItem = selection?.kind === 'item' ? furniture.find((f) => f.id === selection.id) : null
  const doors = room.openings.filter((o) => o.kind === 'door')
  const inv = 1 / view.scale
  const fs = 12 * inv

  const gridShape = (
    <Shape
      listening={false}
      sceneFunc={(ctx) => {
        let step = grid
        while (step * view.scale < 7) step *= 2
        ctx.lineWidth = 1 * inv
        for (let x = 0; x <= room.length + 0.01; x += step) {
          ctx.beginPath(); ctx.strokeStyle = x % 100 === 0 ? '#d8d1bf' : '#e7e1d1'; ctx.moveTo(x, 0); ctx.lineTo(x, room.width); ctx.stroke()
        }
        for (let y = 0; y <= room.width + 0.01; y += step) {
          ctx.beginPath(); ctx.strokeStyle = y % 100 === 0 ? '#d8d1bf' : '#e7e1d1'; ctx.moveTo(0, y); ctx.lineTo(room.length, y); ctx.stroke()
        }
      }}
    />
  )

  const dist = (() => {
    if (!selectedItem) return null
    const b = bounds(corners(selectedItem))
    const cx = (b.minX + b.maxX) / 2
    const cy = (b.minY + b.maxY) / 2
    return [
      { key: 'l', from: [0, cy], to: [b.minX, cy], v: b.minX, at: [b.minX / 2, cy] },
      { key: 'r', from: [b.maxX, cy], to: [room.length, cy], v: room.length - b.maxX, at: [(b.maxX + room.length) / 2, cy] },
      { key: 't', from: [cx, 0], to: [cx, b.minY], v: b.minY, at: [cx, b.minY / 2] },
      { key: 'b', from: [cx, b.maxY], to: [cx, room.width], v: room.width - b.maxY, at: [cx, (b.maxY + room.width) / 2] },
    ].filter((d) => d.v > 4)
  })()

  const onWheel = (e) => {
    e.evt.preventDefault()
    const p = stageRef.current.getPointerPosition()
    zoomBy(e.evt.deltaY < 0 ? 1.1 : 1 / 1.1, p)
  }

  return (
    <div
      ref={wrap}
      className="relative h-full w-full overflow-hidden bg-[#ece7d9]"
      onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-trybefore-type')) e.preventDefault() }}
      onDrop={(e) => {
        const type = e.dataTransfer.getData('application/x-trybefore-type')
        if (!type) return
        e.preventDefault()
        const stage = stageRef.current
        stage.setPointersPositions(e)
        const p = stage.getRelativePointerPosition()
        onDropItem(type, p.x, p.y)
      }}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        scaleX={view.scale}
        scaleY={view.scale}
        x={view.x}
        y={view.y}
        draggable
        onWheel={onWheel}
        onDragEnd={(e) => { if (e.target === e.currentTarget) setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() })) }}
        onMouseDown={(e) => { if (e.target === e.target.getStage() || e.target.name() === 'floor') onSelect(null) }}
        onTouchStart={(e) => { if (e.target === e.target.getStage() || e.target.name() === 'floor') onSelect(null) }}
      >
        <Layer>
          <Rect name="floor" x={0} y={0} width={room.length} height={room.width} fill={FLOOR} shadowColor="#26282a" shadowOpacity={0.18} shadowBlur={24 * inv} shadowOffsetY={6 * inv} />
          {gridShape}
          {showZones && doors.map((d) => {
            const poly = openingZone(room, d, rules.doorClearance)
            return <Line key={`z-${d.id}`} points={poly.flat()} closed fill="rgba(111,127,98,0.10)" stroke="#6f7f62" strokeWidth={1} dash={[6 * inv, 4 * inv]} strokeScaleEnabled={false} listening={false} />
          })}
          <Rect x={-7} y={-7} width={room.length + 14} height={room.width + 14} stroke={room.wallColor} strokeWidth={14} listening={false} />
          <Rect x={-14} y={-14} width={room.length + 28} height={room.width + 28} stroke="#26282a" strokeWidth={1.5} strokeScaleEnabled={false} listening={false} />
          <Rect x={0} y={0} width={room.length} height={room.width} stroke="#26282a" strokeWidth={1.5} strokeScaleEnabled={false} listening={false} />
        </Layer>

        <Layer>
          {sorted.map((it) => {
            const issue = issues.get(it.id)?.size > 0
            const selected = selection?.kind === 'item' && selection.id === it.id
            return (
              <Group
                key={it.id}
                id={`item-${it.id}`}
                x={it.x}
                y={it.y}
                width={it.w}
                height={it.d}
                offsetX={it.w / 2}
                offsetY={it.d / 2}
                rotation={it.rotation}
                draggable
                onMouseDown={(e) => { e.cancelBubble = true; onSelect({ kind: 'item', id: it.id }) }}
                onTouchStart={(e) => { e.cancelBubble = true; onSelect({ kind: 'item', id: it.id }) }}
                onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'move' }}
                onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default' }}
                onDragMove={(e) => { const p = snapCenter(e.target, it); e.target.position(p) }}
                onDragEnd={(e) => {
                  e.cancelBubble = true
                  const p = snapCenter(e.target, it)
                  const x = Math.min(room.length + 100, Math.max(-100, p.x))
                  const y = Math.min(room.width + 100, Math.max(-100, p.y))
                  e.target.position({ x, y })
                  onItemChange(it.id, { x, y })
                }}
                onTransformEnd={(e) => {
                  const node = e.target
                  const w = Math.max(10, Math.round(it.w * node.scaleX()))
                  const d = Math.max(10, Math.round(it.d * node.scaleY()))
                  node.scaleX(1); node.scaleY(1)
                  onItemChange(it.id, { w, d, x: Math.round(node.x() * 10) / 10, y: Math.round(node.y() * 10) / 10, rotation: Math.round(node.rotation()) })
                }}
              >
                <Glyph item={it} issue={issue} selected={selected} />
                {(!isFlat(it) || selected) && (Math.min(it.w, it.d) * view.scale > 22 || selected) && (() => {
                  const fit = (Math.max(it.w, it.d) * 0.92) / (Math.max(it.name.length, 3) * 0.56)
                  const size = Math.min(fs, Math.max(fit, 7 * inv))
                  const tw = Math.max(it.name.length, 3) * size * 0.6 + 8
                  return (
                    <Text
                      listening={false}
                      text={it.name}
                      wrap="none"
                      width={tw}
                      x={it.w / 2}
                      y={it.d / 2}
                      offsetX={tw / 2}
                      offsetY={size / 2}
                      rotation={-it.rotation}
                      align="center"
                      fontSize={size}
                      fontFamily="Instrument Sans Variable, system-ui, sans-serif"
                      fill="#26282a"
                      shadowColor="#f7f4ec"
                      shadowBlur={3}
                      shadowOpacity={1}
                    />
                  )
                })()}
              </Group>
            )
          })}

          {room.openings.map((op) => (
            <Opening
              key={op.id}
              room={room}
              op={op}
              selected={selection?.kind === 'opening' && selection.id === op.id}
              onSelect={() => onSelect({ kind: 'opening', id: op.id })}
              onDragStart={(e) => { e.cancelBubble = true; onSelect({ kind: 'opening', id: op.id }); onOpeningStart() }}
              onDragMove={(e) => {
                e.cancelBubble = true
                const p = stageRef.current.getRelativePointerPosition()
                const cand = [['top', Math.abs(p.y)], ['bottom', Math.abs(room.width - p.y)], ['left', Math.abs(p.x)], ['right', Math.abs(room.length - p.x)]].sort((a, b) => a[1] - b[1])[0][0]
                const along = cand === 'top' || cand === 'bottom' ? p.x : p.y
                const len = wallLength(room, cand)
                const width = Math.min(op.width, len)
                const offset = Math.min(Math.max(0, Math.round((along - width / 2) / 5) * 5), len - width)
                e.target.position({ x: 0, y: 0 })
                onOpeningChange(op.id, { wall: cand, offset, width }, { live: true })
              }}
              onDragEnd={(e) => { e.cancelBubble = true; e.target.position({ x: 0, y: 0 }) }}
            />
          ))}

          {dist && dist.map((d) => (
            <Group key={d.key} listening={false}>
              <Line points={[...d.from, ...d.to]} stroke="#6f7f62" strokeWidth={1} dash={[4, 3]} strokeScaleEnabled={false} />
              <Text x={d.at[0]} y={d.at[1]} text={fmtLen(d.v, unit)} fontSize={fs * 0.92} fill="#3f4a38" offsetX={fs * 1.6} offsetY={fs * 0.5} width={fs * 3.2} align="center" shadowColor="#ece7d9" shadowBlur={4} shadowOpacity={1} />
            </Group>
          ))}

          <Transformer
            ref={trRef}
            rotateEnabled
            rotationSnaps={[0, 90, 180, 270]}
            rotationSnapTolerance={10}
            keepRatio={!!(selectedItem && catalogByType[selectedItem.type]?.round)}
            anchorSize={9}
            anchorCornerRadius={2}
            anchorStroke="#3f4a38"
            anchorFill="#f7f4ec"
            borderStroke="#3f4a38"
            borderDash={[4, 3]}
            rotateAnchorOffset={26}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 * view.scale || newBox.height < 10 * view.scale ? oldBox : newBox)}
          />

          <Group listening={false}>
            <Text x={room.length / 2} y={-34 * inv * 1.2} text={fmtLen(room.length, unit)} fontSize={fs * 1.15} fill="#3f4a38" fontStyle="600" width={200 * inv * 2} offsetX={200 * inv} align="center" />
            <Text x={-30 * inv * 1.2} y={room.width / 2} text={fmtLen(room.width, unit)} fontSize={fs * 1.15} fill="#3f4a38" fontStyle="600" rotation={-90} width={200 * inv * 2} offsetX={200 * inv} align="center" />
          </Group>
        </Layer>
      </Stage>
      <p className="pointer-events-none absolute bottom-2 left-3 hidden text-[11px] text-ink-soft sm:block">Drag to move · corners to resize · handle to rotate · scroll to zoom · drag empty space to pan</p>
    </div>
  )
})

export default RoomCanvas
export { CATALOG }
