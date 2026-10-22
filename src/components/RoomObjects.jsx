import { FiPlus } from 'react-icons/fi'
import { Button } from './ui'
import { fmtLen } from '../lib/units'

export default function RoomObjects({ room, unit, selection, onSelect, onAdd }) {
  const doors = room.openings.filter((o) => o.kind === 'door')
  const windows = room.openings.filter((o) => o.kind === 'window')
  const group = (title, list) => (
    <section>
      <h3 className="mb-2 text-lg">{title}</h3>
      {list.length === 0 ? <p className="text-sm text-ink-soft">None yet.</p> : (
        <ul className="space-y-1.5">
          {list.map((o, i) => {
            const active = selection?.kind === 'opening' && selection.id === o.id
            return (
              <li key={o.id}>
                <button type="button" onClick={() => onSelect({ kind: 'opening', id: o.id })} aria-pressed={active}
                  className={`w-full cursor-pointer rounded-md border px-3 py-2 text-left text-sm transition-colors ${active ? 'border-sage bg-sage-wash' : 'border-line bg-paper hover:border-sage/60'}`}>
                  <span className="font-medium">{o.kind === 'door' ? 'Door' : 'Window'} {i + 1}</span>
                  <span className="block text-xs text-ink-soft">{o.wall[0].toUpperCase() + o.wall.slice(1)} wall · {fmtLen(o.width, unit)} wide</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
  return (
    <div className="space-y-6 p-3">
      <div className="flex gap-2">
        <Button size="sm" icon={FiPlus} onClick={() => onAdd('door')}>Add door</Button>
        <Button size="sm" icon={FiPlus} onClick={() => onAdd('window')}>Add window</Button>
      </div>
      {group('Doors', doors)}
      {group('Windows', windows)}
      <p className="text-xs text-ink-soft">Select a door or window, then drag it along the walls on the plan or edit it on the right.</p>
    </div>
  )
}
