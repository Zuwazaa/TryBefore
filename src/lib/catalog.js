import { uid } from './units'

export const CATEGORIES = ['Bedroom', 'Living', 'Work', 'Dining', 'Storage', 'Decor']

// Glyphs are drawn in normalised coordinates (0..1 of width × depth).
// "back" of an item is its top edge at rotation 0; its front faces +y.
const r = (x, y, w, h, f = 'body', rad = 0.04) => ({ k: 'r', x, y, w, h, f, rad })
const c = (x, y, d, f = 'body') => ({ k: 'c', x, y, d, f })

export const CATALOG = [
  {
    type: 'single-bed', name: 'Single bed', category: 'Bedroom', w: 90, d: 200, color: '#dccfb6',
    glyph: [r(0, 0, 1, 1, 'body'), r(0.1, 0.03, 0.8, 0.14, 'light', 0.2), r(0, 0.3, 1, 0.7, 'mid')],
  },
  {
    type: 'double-bed', name: 'Double bed', category: 'Bedroom', w: 160, d: 200, color: '#dccfb6',
    glyph: [r(0, 0, 1, 1, 'body'), r(0.06, 0.03, 0.41, 0.14, 'light', 0.2), r(0.53, 0.03, 0.41, 0.14, 'light', 0.2), r(0, 0.3, 1, 0.7, 'mid')],
  },
  {
    type: 'nightstand', name: 'Nightstand', category: 'Bedroom', w: 45, d: 40, color: '#cdbb9d',
    glyph: [r(0, 0, 1, 1, 'body'), r(0.2, 0.25, 0.6, 0.5, 'mid', 0.1)],
  },
  {
    type: 'sofa', name: 'Sofa', category: 'Living', w: 200, d: 90, color: '#a9b79c',
    glyph: [r(0, 0, 1, 1, 'body', 0.08), r(0.08, 0.1, 0.84, 0.3, 'light', 0.1), r(0.08, 0.4, 0.84, 0.5, 'mid', 0.08), r(0, 0.1, 0.07, 0.9, 'dark', 0.2), r(0.93, 0.1, 0.07, 0.9, 'dark', 0.2)],
  },
  {
    type: 'armchair', name: 'Armchair', category: 'Living', w: 80, d: 80, color: '#a9b79c',
    glyph: [r(0, 0, 1, 1, 'body', 0.1), r(0.18, 0.12, 0.64, 0.25, 'light', 0.1), r(0.18, 0.37, 0.64, 0.5, 'mid', 0.1), r(0, 0.1, 0.15, 0.9, 'dark', 0.2), r(0.85, 0.1, 0.15, 0.9, 'dark', 0.2)],
  },
  {
    type: 'coffee-table', name: 'Coffee table', category: 'Living', w: 100, d: 55, color: '#c7ad8a',
    glyph: [r(0, 0, 1, 1, 'body', 0.06), r(0.08, 0.14, 0.84, 0.72, 'mid', 0.05)],
  },
  {
    type: 'tv-stand', name: 'TV stand', category: 'Living', w: 140, d: 40, color: '#b7a07e',
    glyph: [r(0, 0, 1, 1, 'body', 0.03), r(0.25, 0.1, 0.5, 0.12, 'dark', 0.4), r(0.04, 0.4, 0.44, 0.5, 'mid', 0.05), r(0.52, 0.4, 0.44, 0.5, 'mid', 0.05)],
  },
  {
    type: 'rug', name: 'Rug', category: 'Decor', w: 200, d: 140, color: '#e4d9c4', flat: true,
    glyph: [r(0, 0, 1, 1, 'body', 0.03), r(0.06, 0.08, 0.88, 0.84, 'light', 0.02)],
  },
  {
    type: 'desk', name: 'Desk', category: 'Work', w: 120, d: 60, color: '#c7ad8a',
    glyph: [r(0, 0, 1, 1, 'body', 0.03), r(0.35, 0.12, 0.3, 0.2, 'dark', 0.1), r(0.06, 0.5, 0.88, 0.4, 'mid', 0.04)],
  },
  {
    type: 'chair', name: 'Chair', category: 'Work', w: 45, d: 45, color: '#8e9b82',
    glyph: [r(0, 0, 1, 1, 'body', 0.2), r(0.1, 0.05, 0.8, 0.2, 'dark', 0.4)],
  },
  {
    type: 'bookshelf', name: 'Bookshelf', category: 'Work', w: 80, d: 30, tall: true, color: '#a98e68',
    glyph: [r(0, 0, 1, 1, 'body', 0.03), r(0.04, 0.15, 0.2, 0.7, 'mid', 0.05), r(0.28, 0.15, 0.2, 0.7, 'mid', 0.05), r(0.52, 0.15, 0.2, 0.7, 'mid', 0.05), r(0.76, 0.15, 0.2, 0.7, 'mid', 0.05)],
  },
  {
    type: 'dining-table', name: 'Dining table', category: 'Dining', w: 160, d: 90, color: '#c1a57e',
    glyph: [r(0, 0, 1, 1, 'body', 0.04), r(0.05, 0.08, 0.9, 0.84, 'light', 0.03)],
  },
  {
    type: 'wardrobe', name: 'Wardrobe', category: 'Storage', w: 100, d: 55, tall: true, color: '#9d8a6a',
    glyph: [r(0, 0, 1, 1, 'body', 0.02), r(0.03, 0.1, 0.46, 0.8, 'mid', 0.02), r(0.51, 0.1, 0.46, 0.8, 'mid', 0.02), r(0.44, 0.35, 0.04, 0.3, 'dark', 0.5), r(0.52, 0.35, 0.04, 0.3, 'dark', 0.5)],
  },
  {
    type: 'storage-cabinet', name: 'Storage cabinet', category: 'Storage', w: 80, d: 40, tall: true, color: '#b3a07f',
    glyph: [r(0, 0, 1, 1, 'body', 0.03), r(0.05, 0.12, 0.9, 0.76, 'mid', 0.03), r(0.48, 0.3, 0.04, 0.4, 'dark', 0.5)],
  },
  {
    type: 'floor-lamp', name: 'Floor lamp', category: 'Decor', w: 35, d: 35, round: true, color: '#d9c58b',
    glyph: [c(0.5, 0.5, 1, 'body'), c(0.5, 0.5, 0.45, 'light'), c(0.5, 0.5, 0.12, 'dark')],
  },
  {
    type: 'plant', name: 'Plant', category: 'Decor', w: 40, d: 40, round: true, color: '#7f9a6a',
    glyph: [c(0.5, 0.5, 1, 'body'), c(0.38, 0.4, 0.5, 'mid'), c(0.62, 0.58, 0.5, 'light')],
  },
]

export const catalogByType = Object.fromEntries(CATALOG.map((i) => [i.type, i]))

export function makeItem(type, overrides = {}) {
  const spec = catalogByType[type]
  return {
    id: uid('f'),
    type,
    name: spec.name,
    x: 100,
    y: 100,
    w: spec.w,
    d: spec.d,
    rotation: 0,
    status: 'buy',
    price: 0,
    ...overrides,
  }
}

export const isFlat = (item) => !!catalogByType[item.type]?.flat
export const isTall = (item) => !!catalogByType[item.type]?.tall

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v + amt * (amt < 0 ? v : 255 - v))))
  const rr = ch((n >> 16) & 255)
  const gg = ch((n >> 8) & 255)
  const bb = ch(n & 255)
  return `#${((1 << 24) + (rr << 16) + (gg << 8) + bb).toString(16).slice(1)}`
}

export function glyphFills(item) {
  const base = catalogByType[item.type]?.color || '#cbbda3'
  return { body: base, light: shade(base, 0.35), mid: shade(base, -0.12), dark: shade(base, -0.4) }
}
