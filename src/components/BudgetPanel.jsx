import { Input, Notice, Select } from './ui'
import { formatMoney, parseNumber } from '../lib/units'

function Stat({ label, value, tone, sub }) {
  return (
    <div className="rounded-md border border-line bg-paper p-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className={`mt-0.5 font-display text-2xl tabular-nums ${tone === 'bad' ? 'text-brick' : ''}`}>{value}</p>
      {sub && <p className="text-xs text-ink-soft">{sub}</p>}
    </div>
  )
}

const cost = (items, status) => items.filter((f) => f.status === status && f.type !== undefined).reduce((s, f) => s + (Number(f.price) || 0), 0)

export function budgetNumbers(items, budget) {
  const newCost = cost(items, 'buy')
  const allCost = items.reduce((s, f) => s + (Number(f.price) || 0), 0)
  return { newCost, allCost, owned: items.filter((f) => f.status === 'owned').length, toBuy: items.filter((f) => f.status === 'buy').length, remaining: budget - newCost }
}

export default function BudgetPanel({ furniture, layouts, budget, onBudget, onItemChange, isExample }) {
  const cur = budgetNumbers(furniture, budget)
  const owned = furniture.filter((f) => f.status === 'owned')
  const reuse = { items: owned.length, newCost: 0 }
  const over = budget > 0 && cur.remaining < 0
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="budget" className="mb-1 block text-[13px] font-medium">Budget for new furniture</label>
        <Input id="budget" inputMode="decimal" defaultValue={budget || ''} key={budget} placeholder="Enter an amount" onBlur={(e) => { const n = parseNumber(e.target.value); onBudget(Number.isFinite(n) && n >= 0 ? n : 0) }} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
        <p className="mt-1 text-xs text-ink-soft">Use any currency. All prices here are estimates you type in. TryBefore does not look up real prices or stock.</p>
      </div>
      {isExample && <Notice tone="warn">The prices in this sample room are made-up example inputs, not market prices. Replace them with your own estimates.</Notice>}

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Estimated total" value={formatMoney(cur.allCost)} sub="All priced items" />
        <Stat label="New furniture only" value={formatMoney(cur.newCost)} sub={`${cur.toBuy} item${cur.toBuy === 1 ? '' : 's'} to buy`} />
        <Stat label="Remaining budget" value={budget > 0 ? formatMoney(cur.remaining) : '—'} tone={over ? 'bad' : undefined} sub={over ? 'Over budget' : budget > 0 ? 'After new purchases' : 'Set a budget above'} />
        <Stat label="Already owned" value={cur.owned} sub={`of ${furniture.length} items`} />
      </div>

      <section aria-labelledby="items">
        <h3 id="items" className="mb-2 text-lg">Items</h3>
        {furniture.length === 0 ? <p className="text-sm text-ink-soft">Add furniture to the room to plan its cost.</p> : (
          <ul className="space-y-2">
            {furniture.map((f) => (
              <li key={f.id} className="grid grid-cols-[1fr_auto_5.5rem] items-center gap-2 rounded-md border border-line bg-paper p-2">
                <span className="truncate text-sm">{f.name}</span>
                <Select aria-label={`Status of ${f.name}`} className="!h-8 !w-32 !text-xs" value={f.status} onChange={(e) => onItemChange(f.id, { status: e.target.value })}>
                  <option value="owned">Owned</option>
                  <option value="buy">Might buy</option>
                </Select>
                <Input aria-label={`Estimated price of ${f.name}`} className="!h-8 !text-xs" inputMode="decimal" placeholder="Estimate" defaultValue={f.price || ''} key={`${f.id}-${f.price}`} onBlur={(e) => { const n = parseNumber(e.target.value); const v = Number.isFinite(n) && n >= 0 ? n : 0; if (v !== f.price) onItemChange(f.id, { price: v }) }} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="cmp">
        <h3 id="cmp" className="mb-1 text-lg">Compare approaches</h3>
        <p className="mb-2 text-xs text-ink-soft">Reusing what you own against the full plan, and each saved layout.</p>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-ink-soft"><th className="py-1 font-normal">Plan</th><th className="font-normal">Items</th><th className="font-normal">New cost</th><th className="font-normal">Left</th></tr></thead>
          <tbody className="tabular-nums">
            <tr className="border-t border-line"><td className="py-1.5">Existing furniture only</td><td>{reuse.items}</td><td>{formatMoney(reuse.newCost)}</td><td>{budget > 0 ? formatMoney(budget) : '—'}</td></tr>
            <tr className="border-t border-line"><td className="py-1.5">Current plan</td><td>{furniture.length}</td><td>{formatMoney(cur.newCost)}</td><td className={over ? 'text-brick' : ''}>{budget > 0 ? formatMoney(cur.remaining) : '—'}</td></tr>
            {layouts.map((l) => {
              const n = budgetNumbers(l.furniture, budget)
              return <tr key={l.id} className="border-t border-line"><td className="py-1.5">{l.name}</td><td>{l.furniture.length}</td><td>{formatMoney(n.newCost)}</td><td className={budget > 0 && n.remaining < 0 ? 'text-brick' : ''}>{budget > 0 ? formatMoney(n.remaining) : '—'}</td></tr>
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
