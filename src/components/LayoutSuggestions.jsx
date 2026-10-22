import { useMemo, useState } from 'react'
import { FiColumns, FiCheck, FiSave, FiTrash2 } from 'react-icons/fi'
import { Badge, Button, EmptyState, IconButton, Input, Modal, Notice, Select } from './ui'
import PlanPreview from './PlanPreview'
import { STRATEGIES, generateLayout, summarise } from '../lib/layouts'
import { evaluate } from '../lib/geometry'
import { fmtArea } from '../lib/units'

function Metrics({ before, after, unit }) {
  return (
    <p className="mt-2 text-xs text-ink-soft tabular-nums">
      Problems {before.problems} → <b className={after.problems ? 'text-brick' : 'text-sage-deep'}>{after.problems}</b>
      {' · '}Open floor {fmtArea(before.freeArea, unit)} → {fmtArea(after.freeArea, unit)}
    </p>
  )
}

export function CompareModal({ open, onClose, options, doc, rules, unit }) {
  const [a, setA] = useState('current')
  const [b, setB] = useState(options.find((o) => o.id !== 'current')?.id || 'current')
  const pick = (id) => options.find((o) => o.id === id) || options[0]
  const A = pick(a)
  const B = pick(b)
  const rows = useMemo(() => [A, B].map((o) => ({ ...summarise(doc.room, o.furniture, rules), items: o.furniture.length, toBuy: o.furniture.filter((f) => f.status === 'buy').length, issues: evaluate(doc.room, o.furniture, rules).issues })), [A, B, doc.room, rules])
  const Row = ({ label, k, fmt = (v) => v }) => (
    <tr className="border-t border-line"><th scope="row" className="py-1.5 pr-3 text-left text-sm font-normal text-ink-soft">{label}</th>{rows.map((r, i) => <td key={i} className="py-1.5 text-sm tabular-nums">{fmt(r[k])}</td>)}</tr>
  )
  return (
    <Modal open={open} onClose={onClose} title="Compare layouts" wide>
      {options.length < 2 ? (
        <Notice>Save at least one layout to compare it with the current plan.</Notice>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {[[A, a, setA, 'Left'], [B, b, setB, 'Right']].map(([o, id, set, side], i) => (
              <div key={side}>
                <Select aria-label={`${side} layout`} value={id} onChange={(e) => set(e.target.value)}>{options.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
                <div className="mt-2 aspect-[4/3] rounded-md border border-line bg-paper">
                  <PlanPreview room={doc.room} furniture={o.furniture} unit={unit} issues={rows[i].issues} labels className="h-full w-full p-2" label={`Plan: ${o.name}`} />
                </div>
              </div>
            ))}
          </div>
          <table className="mt-4 w-full max-w-lg">
            <thead><tr><th className="w-1/3" /><th className="pb-1 text-left text-sm font-medium">{A.name}</th><th className="pb-1 text-left text-sm font-medium">{B.name}</th></tr></thead>
            <tbody>
              <Row label="Geometry problems" k="problems" />
              <Row label="Overlaps" k="overlaps" />
              <Row label="Outside the room" k="bounds" />
              <Row label="Blocking doors" k="doors" />
              <Row label="Narrow passages" k="narrow" />
              <Row label="Open floor" k="freeArea" fmt={(v) => fmtArea(v, unit)} />
              <Row label="Items to buy" k="toBuy" />
            </tbody>
          </table>
        </>
      )}
    </Modal>
  )
}

export default function LayoutSuggestions({ doc, rules, unit, layouts, onApply, onSaveLayout, onDeleteLayout, onCompare }) {
  const [name, setName] = useState('')
  const base = useMemo(() => summarise(doc.room, doc.furniture, rules), [doc, rules])
  const ideas = useMemo(
    () => STRATEGIES.map((s) => {
      const res = generateLayout(s.id, doc.room, doc.furniture, rules)
      return { ...s, ...res, metrics: summarise(doc.room, res.furniture, rules) }
    }),
    [doc, rules],
  )
  const hasItems = doc.furniture.length > 0

  return (
    <div className="space-y-6">
      <section aria-labelledby="ideas">
        <h3 id="ideas" className="text-lg">Layout ideas</h3>
        <p className="mb-3 mt-1 text-xs text-ink-soft">Each idea re-arranges your current furniture with a placement heuristic, then re-checks the result against the geometry rules. Applying one can be undone.</p>
        {!hasItems ? (
          <EmptyState title="No furniture yet">Add a few items from the library and layout ideas will appear here.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {ideas.map((idea) => (
              <li key={idea.id} className="rounded-lg border border-line bg-paper p-3">
                <div className="flex gap-3">
                  <div className="h-20 w-24 shrink-0 rounded bg-linen"><PlanPreview room={doc.room} furniture={idea.furniture} unit={unit} className="h-full w-full p-1" label={`Preview of ${idea.name}`} /></div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-sans text-sm font-semibold leading-snug">{idea.name}</h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{idea.summary}</p>
                  </div>
                </div>
                <Metrics before={base} after={idea.metrics} unit={unit} />
                {idea.unplaced.length > 0 && <p className="mt-1 text-xs text-brick">No clean spot found for: {idea.unplaced.join(', ')}.</p>}
                <div className="mt-2 flex items-center gap-2">
                  <Button size="sm" variant="primary" icon={FiCheck} disabled={idea.moved === 0} onClick={() => onApply(idea.furniture, idea.name)}>{idea.moved === 0 ? 'Already like this' : `Apply (${idea.moved} item${idea.moved > 1 ? 's' : ''} move${idea.moved > 1 ? '' : 's'})`}</Button>
                  <Button size="sm" onClick={() => onSaveLayout(idea.name, idea.furniture)}>Save as layout</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-soft">“Problems” counts overlaps, items outside the room, blocked doors and narrow passages. These ideas are checked against those rules but are not claimed to be optimal.</p>
      </section>

      <section aria-labelledby="saved">
        <div className="flex items-center justify-between">
          <h3 id="saved" className="text-lg">Saved layouts</h3>
          <Button size="sm" icon={FiColumns} onClick={onCompare}>Compare</Button>
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); onSaveLayout(name.trim() || `Layout ${layouts.length + 1}`, doc.furniture); setName('') }}>
          <Input aria-label="Layout name" placeholder="Name the current layout" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" icon={FiSave}>Save</Button>
        </form>
        {layouts.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Nothing saved yet. Save the current arrangement before you try something new.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {layouts.map((l) => {
              const same = l.furniture.length === doc.furniture.length && l.furniture.every((f, i) => { const c = doc.furniture[i]; return c && c.id === f.id && c.x === f.x && c.y === f.y && c.rotation === f.rotation && c.w === f.w && c.d === f.d })
              return (
                <li key={l.id} className="flex items-center gap-3 rounded-md border border-line bg-paper p-2">
                  <div className="h-12 w-16 shrink-0 rounded bg-linen"><PlanPreview room={doc.room} furniture={l.furniture} unit={unit} className="h-full w-full p-0.5" label={`Preview of ${l.name}`} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-ink-soft">{l.furniture.length} items {same && <Badge tone="sage">Current</Badge>}</p>
                  </div>
                  <Button size="sm" disabled={same} onClick={() => onApply(l.furniture, l.name)}>Switch</Button>
                  <IconButton label={`Delete layout ${l.name}`} icon={FiTrash2} onClick={() => onDeleteLayout(l.id)} />
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
