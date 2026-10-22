import { generateLayout, summarise } from './layouts'
import { catalogByType } from './catalog'

export const STYLES = {
  minimalist: {
    name: 'Minimalist',
    palette: [['Warm white', '#f1eee6'], ['Stone', '#cfc8b8'], ['Charcoal', '#33363a']],
    tips: ['Keep surfaces clear and store small items inside closed cabinets.', 'Choose one or two textures, such as linen and light wood, and repeat them.', 'Use a single floor lamp instead of several decorative lights.'],
  },
  scandinavian: {
    name: 'Scandinavian',
    palette: [['Snow', '#f5f3ee'], ['Birch', '#d9c7a4'], ['Fog green', '#b9c4ae']],
    tips: ['Light wood and soft wool textiles give warmth without clutter.', 'Keep curtains light so daylight reaches the middle of the room.', 'Group a few plants near the window.'],
  },
  japandi: {
    name: 'Japandi',
    palette: [['Rice paper', '#ece5d4'], ['Clay', '#b79f82'], ['Ink', '#2f3133']],
    tips: ['Choose low furniture and leave visible floor between pieces.', 'Natural materials such as oak, rattan and paper shades suit the style.', 'Limit accents to one dark tone.'],
  },
  classic: {
    name: 'Modern classic',
    palette: [['Ivory', '#f2eee3'], ['Sage', '#8c9a7e'], ['Walnut', '#7a5c40']],
    tips: ['Use symmetry: matching nightstands, lamps or chairs on both sides.', 'Add one statement piece, such as a framed mirror or a dark wood table.', 'Keep the palette calm and let the wood tones carry the room.'],
  },
  warm: {
    name: 'Warm minimalist',
    palette: [['Oat', '#e8dfcc'], ['Terracotta clay', '#b9876a'], ['Olive', '#7b8567']],
    tips: ['Pair a clear floor with warm, earthy textiles.', 'Choose matte finishes and rounded shapes.', 'Warm bulbs (about 2700 K) make neutral walls feel inviting.'],
  },
}

const PURPOSE_STRATEGY = { study: 'study', sleep: 'sleep', relax: 'free-space', hosting: 'free-space', general: 'free-space' }

const NEEDS = {
  study: [['desk', 'A dedicated desk keeps work separate from rest.'], ['chair', 'A supportive chair matters more than the desk surface.'], ['floor-lamp', 'Task lighting reduces eye strain.'], ['bookshelf', 'Open shelving keeps study materials within reach.']],
  sleep: [['nightstand', 'A surface next to the bed for a lamp and a phone.'], ['wardrobe', 'Closed storage keeps the room calm.'], ['rug', 'A rug under the bed edge softens the first step in the morning.']],
  relax: [['sofa', 'A main seat for the room.'], ['coffee-table', 'A surface within reach of the seating.'], ['floor-lamp', 'A second light source makes the room feel cosier.']],
  hosting: [['dining-table', 'A table for shared meals.'], ['chair', 'Extra seating for guests.'], ['storage-cabinet', 'Storage for tableware near the table.']],
  general: [['plant', 'Greenery adds life without using floor space.']],
}

export function detectStrategy(goal, purpose, keepExisting) {
  const g = (goal || '').toLowerCase()
  if (keepExisting || /existing|already have|my furniture|keep/.test(g)) return 'preserve'
  if (/study|work|desk|homework|exam/.test(g)) return 'study'
  if (/sleep|bed|rest|comfortable/.test(g)) return 'sleep'
  if (/movement|walk|passage|door|access|flow/.test(g)) return 'movement'
  if (/space|spacious|open|free|small/.test(g)) return 'free-space'
  return PURPOSE_STRATEGY[purpose] || 'free-space'
}

export function localRecommendation({ goal, style, purpose, budget, ownedIds = [], lockedIds = [], colors, keepExisting, room, furniture, rules, unitLabel }) {
  const strategy = detectStrategy(goal, purpose, keepExisting)
  const layout = generateLayout(strategy, room, furniture, rules, lockedIds)
  const before = summarise(room, furniture, rules)
  const after = summarise(room, layout.furniture, rules)

  const changes = layout.furniture
    .map((f, i) => ({ f, o: furniture[i] }))
    .filter(({ f, o }) => Math.abs(f.x - o.x) > 1 || Math.abs(f.y - o.y) > 1 || f.rotation !== o.rotation)
    .map(({ f, o }) => ({ id: f.id, name: f.name, from: { x: o.x, y: o.y, rotation: o.rotation }, to: { x: f.x, y: f.y, rotation: f.rotation } }))

  const present = new Set(furniture.map((f) => f.type))
  const wanted = NEEDS[purpose] || NEEDS.general
  const additions = wanted.filter(([type]) => !present.has(type)).map(([type, reason]) => ({ type, name: catalogByType[type].name, reason }))
  const lowBudget = budget === 'low'
  const trimmed = lowBudget || keepExisting ? additions.slice(0, 1) : budget === 'medium' ? additions.slice(0, 3) : additions

  const chosen = STYLES[style] || STYLES.minimalist
  const palette = chosen.palette.map(([name, hex]) => ({ name, hex }))
  if (colors) palette.push({ name: 'Your colour', hex: colors })

  const constraints = [
    `Walkways of at least ${rules.minPassage} cm and ${rules.doorClearance} cm of clear space in front of doors.`,
    ...(lockedIds.length ? [`${lockedIds.length} item${lockedIds.length > 1 ? 's' : ''} you asked to keep in place did not move.`] : []),
    ...(ownedIds.length ? [`${ownedIds.length} item${ownedIds.length > 1 ? 's' : ''} you already own were used as they are, with no replacements suggested.`] : []),
    ...(layout.unplaced.length ? [`Could not find a clean spot for: ${layout.unplaced.join(', ')}. Consider a smaller size.`] : []),
  ]

  const names = { 'free-space': 'maximise the open floor', study: 'create a study area by the window', sleep: 'build a restful sleeping area', preserve: 'keep what works and move only what does not', movement: 'keep a clear path through the room' }
  const summary = `Goal: ${names[strategy]}. ${changes.length ? `${changes.length} item${changes.length > 1 ? 's' : ''} move.` : 'Nothing needs to move.'} Geometry problems: ${before.problems} → ${after.problems}. Open floor: ${(before.freeArea / 10000).toFixed(1)} → ${(after.freeArea / 10000).toFixed(1)} m².`

  return {
    source: 'rule-based',
    strategy,
    summary,
    placement: { furniture: layout.furniture, changes },
    style: { name: chosen.name, palette, tips: chosen.tips },
    additions: trimmed,
    constraints,
    metrics: { before, after },
    unitLabel,
  }
}

// Validates a response from a backend AI endpoint. Returns a safe suggestion or throws.
export function validateRemoteSuggestion(raw, room, furniture) {
  if (!raw || typeof raw !== 'object') throw new Error('The AI service returned an unexpected response.')
  const ids = new Set(furniture.map((f) => f.id))
  const changes = (Array.isArray(raw.placement) ? raw.placement : [])
    .filter((c) => c && ids.has(c.id) && [c.x, c.y, c.rotation].every((v) => Number.isFinite(Number(v))))
    .map((c) => ({
      id: c.id,
      x: Math.min(room.length, Math.max(0, Number(c.x))),
      y: Math.min(room.width, Math.max(0, Number(c.y))),
      rotation: ((Math.round(Number(c.rotation)) % 360) + 360) % 360,
    }))
  const nextFurniture = furniture.map((f) => {
    const c = changes.find((x) => x.id === f.id)
    return c ? { ...f, x: c.x, y: c.y, rotation: c.rotation } : f
  })
  const str = (v, n = 400) => (typeof v === 'string' ? v.slice(0, n) : '')
  return {
    source: 'ai',
    strategy: 'ai',
    summary: str(raw.summary, 600) || 'The AI service did not include an explanation.',
    placement: {
      furniture: nextFurniture,
      changes: changes.map((c) => ({ id: c.id, name: furniture.find((f) => f.id === c.id)?.name || '', to: c })),
    },
    style: {
      name: str(raw.style?.name, 60) || 'Suggested style',
      palette: (Array.isArray(raw.style?.palette) ? raw.style.palette : [])
        .filter((p) => p && /^#[0-9a-f]{6}$/i.test(p.hex)).slice(0, 6).map((p) => ({ name: str(p.name, 30), hex: p.hex })),
      tips: (Array.isArray(raw.style?.tips) ? raw.style.tips : []).slice(0, 6).map((t) => str(t, 200)).filter(Boolean),
    },
    additions: (Array.isArray(raw.additions) ? raw.additions : [])
      .filter((a) => a && catalogByType[a.type]).slice(0, 8)
      .map((a) => ({ type: a.type, name: catalogByType[a.type].name, reason: str(a.reason, 200) })),
    constraints: (Array.isArray(raw.constraints) ? raw.constraints : []).slice(0, 8).map((c) => str(c, 200)).filter(Boolean),
  }
}
