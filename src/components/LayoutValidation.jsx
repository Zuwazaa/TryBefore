import { FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi'
import { Field, Input, Notice } from './ui'
import { UNITS, fromCm, toCm, parseNumber } from '../lib/units'
import { fmtLen } from '../lib/units'

function RuleInput({ label, valueCm, min, max, unit, onChange, hint }) {
  return (
    <Field label={`${label} (${UNITS[unit].label})`} hint={hint}>
      {(id) => (
        <Input
          id={id}
          key={`${label}-${unit}-${valueCm}`}
          inputMode="decimal"
          defaultValue={fromCm(valueCm, unit)}
          onBlur={(e) => {
            const cm = toCm(parseNumber(e.target.value), unit)
            if (Number.isFinite(cm)) onChange(Math.min(max, Math.max(min, cm)))
            else e.target.value = fromCm(valueCm, unit)
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      )}
    </Field>
  )
}

function Issue({ text, onClick }) {
  return (
    <li>
      <button type="button" onClick={onClick} disabled={!onClick} className="flex w-full cursor-pointer items-start gap-2 rounded-md border border-[#e7bcb0] bg-brick-wash px-3 py-2 text-left text-[13px] text-brick hover:brightness-95 disabled:cursor-default">
        <FiAlertTriangle aria-hidden className="mt-0.5 shrink-0" size={14} />
        <span>{text}</span>
      </button>
    </li>
  )
}

export default function LayoutValidation({ evaluation: ev, rules, unit, onRules, onSelect }) {
  const sel = (id) => () => onSelect({ kind: 'item', id })
  const clean = ev.problemCount === 0
  return (
    <div className="space-y-5">
      <section aria-labelledby="geo">
        <h3 id="geo" className="mb-1 text-lg">Geometry checks</h3>
        <p className="mb-3 text-xs text-ink-soft">Calculated from the positions and sizes of the objects in your plan.</p>
        {clean ? (
          <Notice tone="ok" className="flex items-center gap-2"><FiCheckCircle aria-hidden /> No overlaps, boundary problems, blocked doors or narrow passages.</Notice>
        ) : (
          <ul className="space-y-2">
            {ev.outOfBounds.map((o) => <Issue key={`b-${o.id}`} text={`${o.name} extends beyond the room walls.`} onClick={sel(o.id)} />)}
            {ev.overlaps.map((o) => <Issue key={`o-${o.a}-${o.b}`} text={`${o.aName} overlaps ${o.bName} by about ${fmtLen(o.depth, unit)}.`} onClick={sel(o.a)} />)}
            {ev.doorBlocks.map((o) => <Issue key={`d-${o.id}-${o.openingId}`} text={`${o.name} is inside the clear space in front of a door.`} onClick={sel(o.id)} />)}
            {ev.narrow.map((o) => <Issue key={`n-${o.a}-${o.b}`} text={`Only ${fmtLen(o.gap, unit)} between ${o.aName} and ${o.bName}, less than your ${fmtLen(rules.minPassage, unit)} minimum.`} onClick={sel(o.a)} />)}
          </ul>
        )}
      </section>

      <section aria-labelledby="rules">
        <h3 id="rules" className="mb-2 text-lg">Clearance settings</h3>
        <div className="grid grid-cols-3 gap-2">
          <RuleInput label="Min passage" unit={unit} valueCm={rules.minPassage} min={10} max={200} onChange={(v) => onRules({ minPassage: v })} />
          <RuleInput label="Door clear" unit={unit} valueCm={rules.doorClearance} min={30} max={200} onChange={(v) => onRules({ doorClearance: v })} />
          <RuleInput label="Snap grid" unit={unit} valueCm={rules.grid} min={1} max={50} onChange={(v) => onRules({ grid: v })} />
        </div>
        <p className="mt-2 text-xs text-ink-soft">Gaps of about {fmtLen(8, unit)} or less count as furniture placed side by side.</p>
      </section>

      <section aria-labelledby="guide">
        <h3 id="guide" className="mb-1 flex items-center gap-2 text-lg">Guidance <FiInfo aria-hidden size={14} className="text-ink-soft" /></h3>
        <p className="mb-3 text-xs text-ink-soft">General ergonomic recommendations, not exact rules. Use your judgement.</p>
        {ev.guidance.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing to suggest right now.</p>
        ) : (
          <ul className="space-y-2">{ev.guidance.map((g) => <li key={g.id}><Notice tone="warn">{g.text}</Notice></li>)}</ul>
        )}
      </section>
    </div>
  )
}
