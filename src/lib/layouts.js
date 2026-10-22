import {
  corners, bounds, overlapDepth, polyDistance, wallGap, outsideRoom, openingZone,
  openingCenter, doorPathPoly, wallLength, evaluate, WALLS, WALL_ROT, TOUCH_TOL,
} from './geometry'
import { isFlat, isTall, catalogByType } from './catalog'

export const STRATEGIES = [
  { id: 'free-space', name: 'Maximize free floor space', summary: 'Pushes furniture to walls and corners so the middle of the room stays open.' },
  { id: 'study', name: 'Study or work area', summary: 'Puts the desk next to a window with a chair, and tucks the rest away.' },
  { id: 'sleep', name: 'Comfortable sleeping area', summary: 'Places the bed head-first against a wall away from the door, with nightstands beside it.' },
  { id: 'preserve', name: 'Preserve existing furniture', summary: 'Keeps every item that already works and moves only the ones with problems.' },
  { id: 'movement', name: 'Improve movement', summary: 'Keeps a clear walking line from each door and stays away from entrances.' },
]

const PRIORITY = [
  'double-bed', 'single-bed', 'sofa', 'desk', 'dining-table', 'wardrobe', 'bookshelf',
  'tv-stand', 'storage-cabinet', 'armchair', 'coffee-table', 'nightstand', 'chair',
  'floor-lamp', 'plant', 'rug',
]
const WALL_OF_ROT = { 0: 'top', 90: 'right', 180: 'bottom', 270: 'left' }
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const rad = (deg) => (deg * Math.PI) / 180
const norm = (deg) => ((Math.round(deg) % 360) + 360) % 360
const area = (f) => f.w * f.d

function wallPlacement(item, room, wall, along) {
  if (wall === 'top') return { x: along, y: item.d / 2, rotation: 0 }
  if (wall === 'bottom') return { x: along, y: room.width - item.d / 2, rotation: 180 }
  if (wall === 'left') return { x: item.d / 2, y: along, rotation: 270 }
  return { x: room.length - item.d / 2, y: along, rotation: 90 }
}

function wallCandidates(item, room, step = 10) {
  const out = []
  for (const wall of WALLS) {
    const len = wallLength(room, wall)
    const half = item.w / 2
    if (len < item.w) continue
    const positions = []
    for (let a = half; a <= len - half + 0.01; a += step) positions.push(a)
    positions.push(len - half)
    for (const along of positions) out.push({ wall, along, ...wallPlacement(item, room, wall, along) })
  }
  return out
}

function interiorCandidates(item, room, step = 20) {
  const out = []
  for (const rotation of [0, 90]) {
    for (let x = step; x < room.length; x += step) {
      for (let y = step; y < room.width; y += step) out.push({ x, y, rotation, wall: null, along: 0 })
    }
  }
  return out
}

function isValid(item, ctx, level) {
  const poly = corners(item)
  if (outsideRoom(poly, ctx.room)) return false
  if (isFlat(item)) return true
  if (level < 2) {
    for (const zone of ctx.doorZones) if (overlapDepth(poly, zone) > 1) return false
    for (const path of ctx.avoid) if (overlapDepth(poly, path) > 0) return false
  }
  const round = catalogByType[item.type]?.round
  for (const o of ctx.placed) {
    if (isFlat(o) || o.id === item.id) continue
    const op = corners(o)
    if (overlapDepth(poly, op) > 0.5) return false
    if (level < 1 && !round && !catalogByType[o.type]?.round) {
      const gap = polyDistance(poly, op)
      if (gap > TOUCH_TOL && gap < ctx.rules.minPassage - 0.5 && !(item.type === 'chair' && o.type === 'chair')) return false
    }
  }
  if (level < 1 && !round) {
    const g = wallGap(poly, ctx.room)
    if (g > TOUCH_TOL && g < ctx.rules.minPassage - 0.5) return false
  }
  return true
}

function makeScorer(strategy, ctx) {
  const { room } = ctx
  const windows = room.openings.filter((o) => o.kind === 'window')
  const winCenters = windows.map((w) => openingCenter(room, w))
  const winZones = windows.map((w) => openingZone(room, w, 30))
  const doors = room.openings.filter((o) => o.kind === 'door')
  const doorCenters = doors.map((d) => openingCenter(room, d))
  const longest = room.length >= room.width ? ['top', 'bottom'] : ['left', 'right']

  return (item, cand) => {
    const b = bounds(corners(item))
    const dx = Math.min(b.minX, room.length - b.maxX)
    const dy = Math.min(b.minY, room.width - b.maxY)
    let s = dx + dy
    if (!cand.wall) s += 50
    if (isTall(item) && winZones.some((z) => overlapDepth(corners(item), z) > 1)) s += 800
    if (strategy === 'movement') {
      for (const [cx, cy] of doorCenters) {
        const dd = Math.hypot(item.x - cx, item.y - cy)
        if (dd < 160) s += (160 - dd) * 2
      }
    }
    if (strategy === 'study' && item.type === 'desk' && winCenters.length) {
      s = Math.min(...winCenters.map(([cx, cy]) => Math.hypot(item.x - cx, item.y - cy))) + (dx + dy) * 0.1 + (cand.wall ? 0 : 10000)
    }
    if (strategy === 'sleep' && (item.type === 'double-bed' || item.type === 'single-bed')) {
      if (!cand.wall) return 10000
      s = Math.abs(cand.along - wallLength(room, cand.wall) / 2) * 0.6
      if (!longest.includes(cand.wall)) s += 120
      if (doors.some((d) => d.wall === cand.wall)) s += 300
      if (doorCenters.some(([cx, cy]) => Math.hypot(item.x - cx, item.y - cy) < 150)) s += 300
    }
    return s
  }
}

function reservedFor(placed, remaining) {
  if (placed.type === 'desk' && remaining.some((r) => r.type === 'chair')) {
    const t = rad(placed.rotation)
    const v = placed.d / 2 + 22.5 + 6
    return [{ id: '__chair', type: 'chair', w: 45, d: 45, x: placed.x - Math.sin(t) * v, y: placed.y + Math.cos(t) * v, rotation: placed.rotation + 180 }]
  }
  return []
}

function packOne(item, ctx, score, remaining = []) {
  if (isFlat(item)) {
    const cx = Math.min(Math.max(ctx.room.length / 2, item.w / 2), ctx.room.length - item.w / 2)
    const cy = Math.min(Math.max(ctx.room.width / 2, item.d / 2), ctx.room.width - item.d / 2)
    return { ...item, x: cx, y: cy, rotation: 0 }
  }
  const cands = [...wallCandidates(item, ctx.room), ...interiorCandidates(item, ctx.room)]
  for (let level = 0; level <= 2; level++) {
    let best = null
    let bestScore = Infinity
    for (const c of cands) {
      const placed = { ...item, x: c.x, y: c.y, rotation: c.rotation }
      if (!isValid(placed, ctx, level)) continue
      if (level < 2 && reservedFor(placed, remaining).some((r) => !isValid(r, { ...ctx, placed: [...ctx.placed, placed] }, level))) continue
      const s = score(placed, c)
      if (s < bestScore) { bestScore = s; best = placed }
    }
    if (best) return best
  }
  return null
}

function tryPositions(item, positions, ctx, maxLevel = 1) {
  for (let level = 0; level <= maxLevel; level++) {
    for (const p of positions) {
      const placed = { ...item, ...p, rotation: norm(p.rotation) }
      if (isValid(placed, ctx, level)) return placed
    }
  }
  return null
}

const dirs = (a) => {
  const t = rad(a.rotation)
  return { xh: [Math.cos(t), Math.sin(t)], yh: [-Math.sin(t), Math.cos(t)] }
}

function companionsFor(anchor, remaining, ctx, commit) {
  const take = (type, max = 1) => {
    const found = []
    for (let i = remaining.length - 1; i >= 0 && found.length < max; i--) {
      if (remaining[i].type === type) found.push(remaining.splice(i, 1)[0])
    }
    return found
  }
  const { xh, yh } = dirs(anchor)
  const at = (u, v) => ({ x: anchor.x + xh[0] * u + yh[0] * v, y: anchor.y + xh[1] * u + yh[1] * v })

  if (anchor.type === 'desk') {
    for (const chair of take('chair', 1)) {
      const v = anchor.d / 2 + chair.d / 2 + 6
      const spots = [0, 20, -20, 40, -40].map((u) => ({ ...at(u, v), rotation: anchor.rotation + 180 }))
      const placed = tryPositions(chair, spots, ctx)
      if (placed) commit(placed); else remaining.push(chair)
    }
  }
  if (anchor.type === 'double-bed' || anchor.type === 'single-bed') {
    for (const ns of take('nightstand', 2)) {
      let placed = null
      for (const side of [1, -1]) {
        const u = side * (anchor.w / 2 + ns.w / 2 + 3)
        const v = -anchor.d / 2 + ns.d / 2
        placed = tryPositions(ns, [{ ...at(u, v), rotation: anchor.rotation }], ctx)
        if (placed) break
      }
      if (placed) commit(placed); else remaining.push(ns)
    }
  }
  if (anchor.type === 'sofa') {
    const tv = take('tv-stand', 1)[0]
    if (tv) {
      const wall = OPPOSITE[WALL_OF_ROT[norm(anchor.rotation)]]
      const along = wall === 'top' || wall === 'bottom' ? anchor.x : anchor.y
      const len = wallLength(ctx.room, wall)
      const a = Math.min(Math.max(along, tv.w / 2), len - tv.w / 2)
      const placed = tryPositions(tv, [{ ...wallPlacement(tv, ctx.room, wall, a) }], ctx)
      if (placed) commit(placed); else remaining.push(tv)
    }
    const table = take('coffee-table', 1)[0]
    let tableAt = null
    if (table) {
      const gap = Math.max(45, ctx.rules.minPassage)
      const v = anchor.d / 2 + table.d / 2 + gap
      tableAt = tryPositions(table, [{ ...at(0, v), rotation: anchor.rotation }, { ...at(0, v + 15), rotation: anchor.rotation }], ctx)
      if (tableAt) commit(tableAt); else remaining.push(table)
    }
    const rug = take('rug', 1)[0]
    if (rug) {
      const base = tableAt || { ...at(0, anchor.d / 2 + rug.d / 2), rotation: anchor.rotation }
      const placed = tryPositions(rug, [{ x: base.x, y: base.y, rotation: anchor.rotation }], ctx, 0)
      if (placed) commit(placed); else remaining.push(rug)
    }
  }
  if (anchor.type === 'dining-table') {
    const chairs = take('chair', 6)
    const perSide = Math.ceil(chairs.length / 2)
    chairs.forEach((chair, i) => {
      const side = i % 2 === 0 ? 1 : -1
      const k = Math.floor(i / 2)
      const m = Math.max(1, perSide)
      const u = (k + 0.5) * (anchor.w / m) - anchor.w / 2
      const v = side * (anchor.d / 2 + chair.d / 2 + 5)
      const placed = tryPositions(chair, [{ ...at(u, v), rotation: anchor.rotation + (side > 0 ? 180 : 0) }], ctx)
      if (placed) commit(placed); else remaining.push(chair)
    })
  }
}

function buildContext(room, rules, strategy) {
  const doors = room.openings.filter((o) => o.kind === 'door')
  return {
    room,
    rules,
    placed: [],
    doorZones: doors.map((d) => openingZone(room, d, rules.doorClearance)),
    avoid: strategy === 'movement' ? doors.map((d) => doorPathPoly(room, d, rules)) : [],
  }
}

function preserveLayout(room, furniture, rules, locked) {
  const ctx = buildContext(room, rules, 'preserve')
  const ev = evaluate(room, furniture, rules)
  const keep = furniture.filter((f) => locked.has(f.id) || ev.issues.get(f.id).size === 0)
  const keepIds = new Set(keep.map((f) => f.id))
  ctx.placed = keep.slice()
  const result = new Map(keep.map((f) => [f.id, f]))
  const unplaced = []
  const todo = furniture.filter((f) => !keepIds.has(f.id)).sort((a, b) => area(b) - area(a))
  const maxR = Math.max(room.length, room.width)
  for (const item of todo) {
    let best = null
    for (let level = 0; level <= 2 && !best; level++) {
      let bestCost = Infinity
      for (let r = 0; r <= maxR; r += 10) {
        const n = r === 0 ? 1 : 16
        for (let k = 0; k < n; k++) {
          const ang = (k / n) * Math.PI * 2
          for (const rot of [item.rotation, norm(item.rotation + 90)]) {
            const cand = { ...item, x: item.x + Math.cos(ang) * r, y: item.y + Math.sin(ang) * r, rotation: rot }
            const cost = r + (rot === item.rotation ? 0 : 30)
            if (cost >= bestCost) continue
            if (isValid(cand, ctx, level)) { bestCost = cost; best = cand }
          }
        }
        if (best && r > bestCost) break
      }
    }
    if (best) { ctx.placed.push(best); result.set(item.id, best) } else { unplaced.push(item); result.set(item.id, item) }
  }
  return { result, unplaced }
}

export function generateLayout(strategy, room, furniture, rules, lockedIds = []) {
  const locked = new Set(lockedIds)
  let result
  let unplaced = []

  if (strategy === 'preserve') {
    const out = preserveLayout(room, furniture, rules, locked)
    result = out.result
    unplaced = out.unplaced
  } else {
    const ctx = buildContext(room, rules, strategy)
    const score = makeScorer(strategy, ctx)
    result = new Map()
    const commit = (item) => { ctx.placed.push(item); result.set(item.id, item) }
    const fixed = furniture.filter((f) => locked.has(f.id))
    fixed.forEach(commit)
    const remaining = furniture
      .filter((f) => !locked.has(f.id))
      .sort((a, b) => PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type) || area(b) - area(a))
    fixed.forEach((f) => companionsFor(f, remaining, ctx, commit))
    while (remaining.length) {
      const item = remaining.shift()
      const placed = packOne(item, ctx, score, remaining)
      if (placed) { commit(placed); companionsFor(placed, remaining, ctx, commit) } else { unplaced.push(item); commit(item) }
    }
  }

  const next = furniture.map((f) => {
    const p = result.get(f.id) || f
    return { ...f, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, rotation: norm(p.rotation) }
  })
  const moved = next.filter((n, i) => {
    const o = furniture[i]
    return Math.abs(n.x - o.x) > 1 || Math.abs(n.y - o.y) > 1 || norm(n.rotation) !== norm(o.rotation)
  })
  return { furniture: next, moved: moved.length, unplaced: unplaced.map((u) => u.name) }
}

export function summarise(room, furniture, rules) {
  const ev = evaluate(room, furniture, rules)
  return {
    problems: ev.problemCount,
    overlaps: ev.overlaps.length,
    bounds: ev.outOfBounds.length,
    doors: ev.doorBlocks.length,
    narrow: ev.narrow.length,
    freeArea: ev.freeArea,
    roomArea: ev.roomArea,
  }
}
