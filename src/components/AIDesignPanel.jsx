import { useEffect, useState } from 'react'
import { FiCheck, FiCpu, FiLoader, FiPlus } from 'react-icons/fi'
import { Badge, Button, Field, Notice, Select } from './ui'
import { STYLES, localRecommendation, validateRemoteSuggestion } from '../lib/recommend'
import { getServiceStatus, requestDesign } from '../lib/aiClient'
import { UNITS, fromCm } from '../lib/units'

const PROMPTS = [
  'Make this room more comfortable for studying.',
  'I want more free space.',
  'Use my existing furniture.',
  'Suggest a warm minimalist interior.',
  'I have a limited budget.',
  'Help me arrange a small bedroom.',
]

const PURPOSES = [['general', 'General use'], ['sleep', 'Sleeping'], ['study', 'Studying or working'], ['relax', 'Relaxing'], ['hosting', 'Dining and hosting']]
const BUDGETS = [['none', 'Not set'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'Flexible']]

export default function AIDesignPanel({ doc, rules, unit, onApply, onAddItems }) {
  const [form, setForm] = useState({ goal: '', style: 'minimalist', purpose: 'general', budget: 'none', colors: '', owned: [], locked: [] })
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [applied, setApplied] = useState(false)
  const [useAI, setUseAI] = useState(true)

  useEffect(() => { getServiceStatus().then(setStatus) }, [])
  const aiReady = !!status?.ai

  const toggle = (key, id) => setForm((f) => ({ ...f, [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id] }))

  const run = async (forceLocal = false) => {
    setBusy(true); setError(''); setApplied(false)
    const input = { ...form, ownedIds: form.owned, lockedIds: form.locked, keepExisting: /existing|already have|my furniture/i.test(form.goal), colors: form.colors || undefined, room: doc.room, furniture: doc.furniture, rules, unitLabel: UNITS[unit].label }
    try {
      if (aiReady && useAI && !forceLocal) {
        const raw = await requestDesign({
          goal: form.goal, style: form.style, purpose: form.purpose, budget: form.budget, colors: form.colors,
          ownedIds: form.owned, lockedIds: form.locked, rules,
          room: { length: doc.room.length, width: doc.room.width, height: doc.room.height, type: doc.room.type, openings: doc.room.openings },
          furniture: doc.furniture.map(({ id, type, name, x, y, w, d, rotation }) => ({ id, type, name, x, y, w, d, rotation })),
        })
        setResult(validateRemoteSuggestion(raw, doc.room, doc.furniture))
      } else {
        await new Promise((r) => setTimeout(r, 250))
        setResult(localRecommendation(input))
      }
    } catch (e) {
      setError(e.message || 'Something went wrong.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  const apply = () => {
    const owned = new Set(form.owned)
    const next = result.placement.furniture.map((f) => (owned.has(f.id) ? { ...f, status: 'owned' } : f))
    onApply(next, 'AI suggestion')
    setApplied(true)
  }

  return (
    <div className="space-y-4">
      <Notice tone={aiReady ? 'ok' : 'info'}>
        {status === null ? 'Checking for an AI service…' : aiReady ? 'An AI service is connected. Suggestions are checked before they touch your plan.' : 'No AI service is connected, so suggestions come from a built-in rule-based engine that uses your room, furniture and preferences.'}
      </Notice>

      <Field label="What do you want from this room?">
        {(id) => <textarea id={id} rows={3} value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} placeholder="For example: I want more free space for studying." className="w-full rounded-md border border-line bg-paper p-3 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25" />}
      </Field>
      <div className="flex flex-wrap gap-1.5">
        {PROMPTS.map((p) => <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, goal: p }))} className="cursor-pointer rounded-full border border-line bg-paper px-2.5 py-1 text-left text-xs hover:border-sage">{p}</button>)}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Style">{(id) => <Select id={id} value={form.style} onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}>{Object.entries(STYLES).map(([k, s]) => <option key={k} value={k}>{s.name}</option>)}</Select>}</Field>
        <Field label="Main purpose">{(id) => <Select id={id} value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}>{PURPOSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>}</Field>
        <Field label="Budget range">{(id) => <Select id={id} value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}>{BUDGETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>}</Field>
        <Field label="Preferred colour">{(id) => (
          <div className="flex items-center gap-2">
            <input id={id} type="color" value={form.colors || '#8c9a7e'} onChange={(e) => setForm((f) => ({ ...f, colors: e.target.value }))} className="h-10 w-12 cursor-pointer rounded border border-line bg-paper p-1" />
            {form.colors ? <button type="button" className="cursor-pointer text-xs underline" onClick={() => setForm((f) => ({ ...f, colors: '' }))}>Clear</button> : <span className="text-xs text-ink-soft">None</span>}
          </div>
        )}</Field>
      </div>

      {doc.furniture.length > 0 && (
        <div className="grid gap-3">
          {[['owned', 'Items I already own'], ['locked', 'Items that must not move']].map(([key, label]) => (
            <fieldset key={key}>
              <legend className="mb-1 text-[13px] font-medium">{label}</legend>
              <div className="flex flex-wrap gap-1.5">
                {doc.furniture.filter((f) => f.type !== 'rug').map((f) => (
                  <label key={f.id} className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs ${form[key].includes(f.id) ? 'border-sage-deep bg-sage-deep text-ivory' : 'border-line bg-paper hover:border-sage'}`}>
                    <input type="checkbox" className="sr-only" checked={form[key].includes(f.id)} onChange={() => toggle(key, f.id)} />
                    {f.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={busy ? FiLoader : FiCpu} disabled={busy} onClick={() => run()}>{busy ? 'Working…' : 'Get suggestions'}</Button>
        {aiReady && <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} /> Use AI service</label>}
      </div>

      {error && (
        <Notice tone="error">
          {error}
          <div className="mt-2"><Button size="sm" onClick={() => run(true)}>Use the rule-based suggestions instead</Button></div>
        </Notice>
      )}

      {result && (
        <article className="space-y-4 rounded-lg border border-line bg-paper p-4" aria-live="polite">
          <div className="flex items-center gap-2">
            <h3 className="text-lg">Suggestion</h3>
            <Badge tone={result.source === 'ai' ? 'sage' : 'neutral'}>{result.source === 'ai' ? 'AI service' : 'Rule-based'}</Badge>
          </div>
          <p className="text-sm leading-relaxed">{result.summary}</p>

          <section>
            <h4 className="font-sans text-sm font-semibold">Placement changes</h4>
            {result.placement.changes.length === 0 ? <p className="mt-1 text-sm text-ink-soft">No furniture needs to move.</p> : (
              <ul className="mt-1 space-y-0.5 text-sm text-ink-soft">
                {result.placement.changes.slice(0, 12).map((c) => (
                  <li key={c.id}>{c.name}: {c.from ? `(${fromCm(c.from.x, unit)}, ${fromCm(c.from.y, unit)}) → ` : '→ '}({fromCm(c.to.x, unit)}, {fromCm(c.to.y, unit)}) {UNITS[unit].label}{c.to.rotation !== undefined ? `, ${c.to.rotation}°` : ''}</li>
                ))}
              </ul>
            )}
            <Button className="mt-2" variant="primary" size="sm" icon={FiCheck} disabled={applied || result.placement.changes.length === 0} onClick={apply}>{applied ? 'Applied to the plan' : 'Apply to the plan'}</Button>
            {applied && <p className="mt-1 text-xs text-ink-soft">Use Undo in the toolbar to go back.</p>}
          </section>

          <section>
            <h4 className="font-sans text-sm font-semibold">Style: {result.style.name}</h4>
            {result.style.palette.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{result.style.palette.map((p) => <span key={p.hex + p.name} className="inline-flex items-center gap-1.5 text-xs"><span className="h-5 w-5 rounded border border-line" style={{ background: p.hex }} />{p.name}</span>)}</div>}
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-ink-soft">{result.style.tips.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>

          {result.additions.length > 0 && (
            <section>
              <h4 className="font-sans text-sm font-semibold">Optional additions</h4>
              <ul className="mt-1 space-y-2">
                {result.additions.map((a) => (
                  <li key={a.type} className="flex items-start justify-between gap-3 text-sm">
                    <span><b className="font-medium">{a.name}</b><span className="text-ink-soft"> — {a.reason}</span></span>
                    <Button size="sm" icon={FiPlus} onClick={() => onAddItems([a.type])}>Add</Button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-soft">Prices are not suggested. Enter your own estimates in the Budget tab.</p>
            </section>
          )}

          {result.constraints.length > 0 && (
            <section>
              <h4 className="font-sans text-sm font-semibold">Constraints used</h4>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-ink-soft">{result.constraints.map((c) => <li key={c}>{c}</li>)}</ul>
            </section>
          )}
        </article>
      )}
    </div>
  )
}
