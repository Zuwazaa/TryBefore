import { useEffect, useState } from 'react'
import { FiCopy, FiRotateCw, FiTrash2 } from 'react-icons/fi'
import { Button, Field, Input, Notice, Select } from './ui'
import { WALLS, wallLength } from '../lib/geometry'
import { UNITS, fromCm, toCm, parseNumber } from '../lib/units'

// A number input that commits on blur / Enter so typing doesn't spam the undo history.
function NumField({ label, valueCm, onCommit, unit, min, max, hint, suffix, raw }) {
  const show = raw ? String(Math.round(valueCm)) : String(fromCm(valueCm, unit))
  const [text, setText] = useState(show)
  const [error, setError] = useState('')
  useEffect(() => { setText(show); setError('') }, [show])
  const commit = () => {
    const n = parseNumber(text)
    if (!Number.isFinite(n)) { setError('Enter a number.'); return }
    const cm = raw ? n : toCm(n, unit)
    if (cm < min || cm > max) {
      setError(raw ? `Use ${min} to ${max}.` : `Use ${fromCm(min, unit)} to ${fromCm(max, unit)} ${UNITS[unit].label}.`)
      return
    }
    setError('')
    if (Math.abs(cm - valueCm) > 0.01) onCommit(cm)
  }
  return (
    <Field label={`${label}${suffix ? ` (${suffix})` : ''}`} error={error} hint={hint}>
      {(id) => <Input id={id} inputMode="decimal" value={text} aria-invalid={!!error} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />}
    </Field>
  )
}

function ItemProperties({ item, unit, onChange, onDuplicate, onDelete }) {
  const [name, setName] = useState(item.name)
  useEffect(() => setName(item.name), [item.id, item.name])
  const u = UNITS[unit].label
  return (
    <div className="space-y-4">
      <Field label="Name">{(id) => <Input id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== item.name && onChange({ name: name.trim() })} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />}</Field>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Width" suffix={u} unit={unit} valueCm={item.w} min={10} max={1000} onCommit={(v) => onChange({ w: v })} />
        <NumField label="Depth" suffix={u} unit={unit} valueCm={item.d} min={10} max={1000} onCommit={(v) => onChange({ d: v })} />
        <NumField label="Centre X" suffix={u} unit={unit} valueCm={item.x} min={-200} max={4000} onCommit={(v) => onChange({ x: v })} />
        <NumField label="Centre Y" suffix={u} unit={unit} valueCm={item.y} min={-200} max={4000} onCommit={(v) => onChange({ y: v })} />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="rot" className="text-[13px] font-medium">Rotation</label>
          <span className="text-xs tabular-nums text-ink-soft">{Math.round(item.rotation)}°</span>
        </div>
        <div className="flex items-center gap-3">
          <input id="rot" type="range" min={0} max={359} step={1} value={Math.round(item.rotation) % 360} onChange={(e) => onChange({ rotation: Number(e.target.value) })} className="h-2 flex-1 cursor-pointer accent-[#3f4a38]" />
          <Button size="sm" icon={FiRotateCw} onClick={() => onChange({ rotation: (Math.round(item.rotation / 90) * 90 + 90) % 360 })} aria-label="Rotate 90 degrees">90°</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Budget status">{(id) => <Select id={id} value={item.status} onChange={(e) => onChange({ status: e.target.value })}><option value="owned">Already owned</option><option value="buy">Might purchase</option></Select>}</Field>
        <NumField label="Price estimate" raw valueCm={item.price} min={0} max={10000000} onCommit={(v) => onChange({ price: v })} />
      </div>
      <div className="flex gap-2 border-t border-line pt-4">
        <Button icon={FiCopy} onClick={onDuplicate}>Duplicate</Button>
        <Button icon={FiTrash2} className="hover:!border-brick hover:!bg-brick-wash hover:text-brick" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  )
}

function OpeningProperties({ op, room, unit, onChange, onDelete }) {
  const u = UNITS[unit].label
  const len = wallLength(room, op.wall)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">{(id) => <Select id={id} value={op.kind} onChange={(e) => onChange({ kind: e.target.value })}><option value="door">Door</option><option value="window">Window</option></Select>}</Field>
        <Field label="Wall">{(id) => <Select id={id} value={op.wall} onChange={(e) => { const l = wallLength(room, e.target.value); const w = Math.min(op.width, l); onChange({ wall: e.target.value, width: w, offset: Math.min(op.offset, l - w) }) }}>{WALLS.map((w) => <option key={w} value={w}>{w[0].toUpperCase() + w.slice(1)}</option>)}</Select>}</Field>
        <NumField label="Position" suffix={u} unit={unit} valueCm={op.offset} min={0} max={Math.max(0, len - op.width)} hint="From the top-left corner." onCommit={(v) => onChange({ offset: v })} />
        <NumField label="Width" suffix={u} unit={unit} valueCm={op.width} min={40} max={len - op.offset} onCommit={(v) => onChange({ width: v })} />
      </div>
      <p className="text-xs text-ink-soft">You can also drag it along the walls on the plan.</p>
      <Button icon={FiTrash2} className="hover:!border-brick hover:!bg-brick-wash hover:text-brick" onClick={onDelete}>Delete {op.kind}</Button>
    </div>
  )
}

function RoomProperties({ room, unit, onChange }) {
  const u = UNITS[unit].label
  return (
    <div className="space-y-4">
      <Notice>Nothing is selected. Click furniture, a door or a window on the plan to edit it, or edit the room itself here.</Notice>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Length" suffix={u} unit={unit} valueCm={room.length} min={100} max={3000} onCommit={(v) => onChange({ length: v })} />
        <NumField label="Width" suffix={u} unit={unit} valueCm={room.width} min={100} max={3000} onCommit={(v) => onChange({ width: v })} />
        <NumField label="Ceiling" suffix={u} unit={unit} valueCm={room.height} min={150} max={600} onCommit={(v) => onChange({ height: v })} />
        <Field label="Wall colour">{(id) => <input id={id} type="color" value={room.wallColor} onChange={(e) => onChange({ wallColor: e.target.value })} className="h-10 w-full cursor-pointer rounded border border-line bg-paper p-1" />}</Field>
      </div>
    </div>
  )
}

export default function FurnitureProperties({ selection, doc, unit, onItemChange, onOpeningChange, onRoomChange, onDuplicate, onDelete }) {
  if (selection?.kind === 'item') {
    const item = doc.furniture.find((f) => f.id === selection.id)
    if (item) return <ItemProperties item={item} unit={unit} onChange={(p) => onItemChange(item.id, p)} onDuplicate={onDuplicate} onDelete={onDelete} />
  }
  if (selection?.kind === 'opening') {
    const op = doc.room.openings.find((o) => o.id === selection.id)
    if (op) return <OpeningProperties op={op} room={doc.room} unit={unit} onChange={(p) => onOpeningChange(op.id, p)} onDelete={onDelete} />
  }
  return <RoomProperties room={doc.room} unit={unit} onChange={onRoomChange} />
}
