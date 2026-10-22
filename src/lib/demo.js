import { makeItem } from './catalog'
import { DEFAULT_RULES } from './geometry'
import { generateLayout } from './layouts'
import { uid } from './units'

const opening = (kind, wall, offset, width) => ({ id: uid('o'), kind, wall, offset, width })

function baseProject({ name, type, length, width, height = 250, wallColor, openings, furniture, example, budget = 0 }) {
  const now = Date.now()
  return {
    id: example ? `example-${example}` : uid('p'),
    name,
    createdAt: now,
    updatedAt: now,
    unit: 'm',
    room: { type, length, width, height, wallColor, openings },
    furniture,
    layouts: [{ id: uid('l'), name: 'Original', source: 'original', createdAt: now, furniture }],
    rules: { ...DEFAULT_RULES },
    budget: { total: budget },
    photo: null,
    visualizations: [],
    example: example || null,
  }
}

export function blankProject({ name, type, length, width, height, wallColor, openings, unit = 'm', photo = null, rules = DEFAULT_RULES }) {
  const p = baseProject({ name, type, length, width, height, wallColor, openings, furniture: [] })
  return { ...p, id: uid('p'), unit, photo, rules: { ...rules }, layouts: [] }
}

function demoBedroom() {
  const f = (type, x, y, rotation, extra = {}) => makeItem(type, { x, y, rotation, ...extra })
  const furniture = [
    f('double-bed', 130, 100, 0, { name: 'Double bed', status: 'owned', price: 0 }),
    f('nightstand', 215, 60, 0, { name: 'Nightstand', status: 'buy', price: 40 }),
    f('wardrobe', 70, 330, 180, { name: 'Wardrobe', status: 'buy', price: 220 }),
    f('bookshelf', 395, 15, 0, { name: 'Bookshelf', status: 'buy', price: 90 }),
    f('desk', 390, 210, 90, { name: 'Desk', status: 'owned' }),
    f('chair', 332, 210, 270, { name: 'Desk chair', status: 'owned' }),
    f('armchair', 230, 315, 0, { name: 'Armchair', status: 'buy', price: 180 }),
    f('floor-lamp', 25, 25, 0, { name: 'Floor lamp', status: 'buy', price: 45 }),
    f('plant', 395, 335, 0, { name: 'Plant', status: 'buy', price: 25 }),
    f('rug', 250, 255, 0, { name: 'Rug', status: 'buy', price: 80 }),
  ]
  return baseProject({
    name: 'Sample bedroom — 4.2 × 3.6 m',
    type: 'Bedroom',
    length: 420,
    width: 360,
    wallColor: '#e9e4d6',
    openings: [opening('window', 'top', 130, 160), opening('door', 'bottom', 40, 90), opening('window', 'right', 60, 90)],
    furniture,
    example: 'bedroom',
    budget: 600,
  })
}

function arranged(spec, strategy, lockedIds = []) {
  const { room } = spec
  const furniture = spec.furniture
  const res = generateLayout(strategy, room, furniture, spec.rules, lockedIds)
  const layouts = [{ ...spec.layouts[0], furniture: res.furniture }]
  return { ...spec, furniture: res.furniture, layouts }
}

export const EXAMPLES = [
  {
    key: 'bedroom',
    title: 'Sample bedroom',
    style: 'Practical',
    blurb: 'A bedroom with deliberate mistakes: a wardrobe in front of the door, an overlap and a shelf outside the wall. Fix them live.',
    scene: 'scandi',
    build: demoBedroom,
  },
  {
    key: 'minimalist-studio',
    title: 'Minimalist studio',
    style: 'Minimalist',
    blurb: 'One room for sleeping and working, with a clear floor and a desk under the window.',
    scene: 'minimal',
    build: () => arranged(baseProject({
      name: 'Minimalist studio', type: 'Studio', length: 500, width: 380, wallColor: '#efece4',
      openings: [opening('window', 'top', 170, 170), opening('door', 'left', 250, 90)],
      furniture: [
        makeItem('double-bed'), makeItem('desk'), makeItem('chair'), makeItem('wardrobe'),
        makeItem('plant'), makeItem('rug'),
      ],
      example: 'minimalist-studio',
    }), 'study'),
  },
  {
    key: 'scandinavian-bedroom',
    title: 'Scandinavian bedroom',
    style: 'Scandinavian',
    blurb: 'Light wood, soft textiles and a symmetrical bed wall with two nightstands.',
    scene: 'scandi',
    build: () => arranged(baseProject({
      name: 'Scandinavian bedroom', type: 'Bedroom', length: 400, width: 350, wallColor: '#f1eee6',
      openings: [opening('window', 'top', 120, 160), opening('door', 'bottom', 250, 90)],
      furniture: [
        makeItem('double-bed'), makeItem('nightstand'), makeItem('nightstand'), makeItem('wardrobe'),
        makeItem('armchair'), makeItem('floor-lamp'), makeItem('plant'), makeItem('rug'),
      ],
      example: 'scandinavian-bedroom',
    }), 'sleep'),
  },
  {
    key: 'japandi-living',
    title: 'Japandi living room',
    style: 'Japandi',
    blurb: 'Low furniture, natural textures and a calm sofa group facing the TV wall.',
    scene: 'japandi',
    build: () => arranged(baseProject({
      name: 'Japandi living room', type: 'Living room', length: 520, width: 420, wallColor: '#e8e2d3',
      openings: [opening('window', 'top', 150, 220), opening('door', 'right', 280, 90)],
      furniture: [
        makeItem('sofa'), makeItem('coffee-table'), makeItem('tv-stand'), makeItem('armchair'),
        makeItem('bookshelf'), makeItem('floor-lamp'), makeItem('plant'), makeItem('rug'),
      ],
      example: 'japandi-living',
    }), 'free-space'),
  },
  {
    key: 'modern-classic-dining',
    title: 'Modern classic dining room',
    style: 'Modern classic',
    blurb: 'A six-seat table with storage along the walls and room to walk around it.',
    scene: 'classic',
    build: () => arranged(baseProject({
      name: 'Modern classic dining room', type: 'Dining room', length: 480, width: 400, wallColor: '#dfe2d3',
      openings: [opening('window', 'top', 150, 180), opening('door', 'bottom', 60, 90)],
      furniture: [
        makeItem('dining-table', { w: 180 }), makeItem('chair'), makeItem('chair'), makeItem('chair'),
        makeItem('chair'), makeItem('chair'), makeItem('chair'), makeItem('storage-cabinet'),
        makeItem('storage-cabinet'), makeItem('floor-lamp'), makeItem('plant'),
      ],
      example: 'modern-classic-dining',
    }), 'free-space'),
  },
]

export const exampleByKey = Object.fromEntries(EXAMPLES.map((e) => [e.key, e]))
