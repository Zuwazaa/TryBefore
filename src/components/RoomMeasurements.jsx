import { fmtArea, fmtLen } from '../lib/units'

function Row({ label, value, tone }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/70 py-2 text-sm last:border-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`tabular-nums font-medium ${tone === 'bad' ? 'text-brick' : tone === 'good' ? 'text-sage-deep' : ''}`}>{value}</dd>
    </div>
  )
}

export default function RoomMeasurements({ room, furniture, evaluation: ev, unit }) {
  const pct = ev.roomArea ? Math.round((ev.freeArea / ev.roomArea) * 100) : 0
  return (
    <dl aria-label="Layout summary">
      <Row label="Room size" value={`${fmtLen(room.length, unit)} × ${fmtLen(room.width, unit)}`} />
      <Row label="Floor area" value={fmtArea(ev.roomArea, unit)} />
      <Row label="Furniture items" value={furniture.length} />
      <Row label="Open floor (estimated)" value={`${fmtArea(ev.freeArea, unit)} · ${pct}%`} />
      <Row label="Overlaps" value={ev.overlaps.length} tone={ev.overlaps.length ? 'bad' : 'good'} />
      <Row label="Outside the room" value={ev.outOfBounds.length} tone={ev.outOfBounds.length ? 'bad' : 'good'} />
      <Row label="Blocking a door" value={ev.doorBlocks.length} tone={ev.doorBlocks.length ? 'bad' : 'good'} />
      <Row label="Narrow passages" value={ev.narrow.length} tone={ev.narrow.length ? 'bad' : 'good'} />
    </dl>
  )
}
