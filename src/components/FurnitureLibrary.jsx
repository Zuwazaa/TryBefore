import { useMemo, useState } from 'react'
import { FiPlus, FiSearch } from 'react-icons/fi'
import { CATALOG, CATEGORIES } from '../lib/catalog'
import { glyphSvg } from '../lib/planSvg'
import { fmtLen } from '../lib/units'

function Thumb({ spec }) {
  const item = { type: spec.type, w: spec.w, d: spec.d }
  const pad = 6
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${spec.w + pad * 2} ${spec.d + pad * 2}">${glyphSvg(item, { sw: Math.max(2, spec.w / 40) })}</svg>`
  return <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded bg-linen/70 p-1.5 [&>svg]:max-h-full [&>svg]:max-w-full" aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />
}

export default function FurnitureLibrary({ onAdd, unit }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('All')
  const items = useMemo(
    () => CATALOG.filter((c) => (cat === 'All' || c.category === cat) && c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query, cat],
  )
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-line p-3">
        <div className="relative">
          <FiSearch aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={15} />
          <input
            type="search"
            aria-label="Search furniture"
            placeholder="Search furniture"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-line bg-paper pl-9 pr-3 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Furniture categories">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${cat === c ? 'border-sage-deep bg-sage-deep text-ivory' : 'border-line bg-paper hover:border-sage'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <ul className="scroll-thin flex-1 space-y-1.5 overflow-y-auto p-3">
        {items.length === 0 && <li className="py-8 text-center text-sm text-ink-soft">Nothing matches “{query}”. Try another word or clear the category.</li>}
        {items.map((spec) => (
          <li key={spec.type}>
            <div
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('application/x-trybefore-type', spec.type); e.dataTransfer.effectAllowed = 'copy' }}
              className="flex cursor-grab items-center gap-3 rounded-md border border-line bg-paper p-2 active:cursor-grabbing"
            >
              <Thumb spec={spec} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{spec.name}</p>
                <p className="text-xs text-ink-soft">{fmtLen(spec.w, unit)} × {fmtLen(spec.d, unit)}</p>
              </div>
              <button type="button" aria-label={`Add ${spec.name} to the room`} onClick={() => onAdd(spec.type)}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line text-sage-deep transition-colors hover:border-sage hover:bg-sage-wash">
                <FiPlus aria-hidden size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-3 py-2 text-xs text-ink-soft">Drag an item into the room, or use the + button.</p>
    </div>
  )
}
