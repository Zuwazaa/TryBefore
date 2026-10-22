import { isFlat, isTall, catalogByType } from './catalog'

export const DEFAULT_RULES = { minPassage: 50, doorClearance: 90, grid: 10 }
export const TOUCH_TOL = 8 // gaps at or below this count as "adjacent", not as a passage
const EPS = 0.5

export const WALLS = ['top', 'right', 'bottom', 'left']
export const WALL_ROT = { top: 0, right: 90, bottom: 180, left: 270 }

export function corners(item) {
  const a = (item.rotation * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const hw = item.w / 2
  const hd = item.d / 2
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, ly]) => [
    item.x + lx * cos - ly * sin,
    item.y + lx * sin + ly * cos,
  ])
}

export function bounds(points) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
}

export function pointInPoly(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// Penetration depth (cm) of two convex polygons; 0 when they do not overlap.
export function overlapDepth(a, b) {
  let min = Infinity
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i]
      const [x2, y2] = poly[(i + 1) % poly.length]
      const nx = y1 - y2
      const ny = x2 - x1
      const len = Math.hypot(nx, ny) || 1
      const ax = nx / len
      const ay = ny / len
      let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity
      for (const [x, y] of a) { const p = x * ax + y * ay; minA = Math.min(minA, p); maxA = Math.max(maxA, p) }
      for (const [x, y] of b) { const p = x * ax + y * ay; minB = Math.min(minB, p); maxB = Math.max(maxB, p) }
      const o = Math.min(maxA, maxB) - Math.max(minA, minB)
      if (o <= 0) return 0
      min = Math.min(min, o)
    }
  }
  return min
}

function pointSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const l2 = dx * dx + dy * dy
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

export function polyDistance(a, b) {
  let min = Infinity
  for (const [p, q] of [[a, b], [b, a]]) {
    for (const [px, py] of p) {
      for (let i = 0; i < q.length; i++) {
        const [x1, y1] = q[i]
        const [x2, y2] = q[(i + 1) % q.length]
        min = Math.min(min, pointSegDist(px, py, x1, y1, x2, y2))
      }
    }
  }
  return min
}

export function wallGap(poly, room) {
  let min = Infinity
  for (const [x, y] of poly) min = Math.min(min, x, y, room.length - x, room.width - y)
  return min
}

export function outsideRoom(poly, room) {
  return poly.some(([x, y]) => x < -EPS || y < -EPS || x > room.length + EPS || y > room.width + EPS)
}

export function rectPoly(x1, y1, x2, y2) {
  return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
}

// Zone inside the room in front of a door or window, `depth` cm deep.
export function openingZone(room, op, depth) {
  const { wall, offset, width } = op
  const L = room.length
  const W = room.width
  const d = Math.min(depth, wall === 'top' || wall === 'bottom' ? W : L)
  if (wall === 'top') return rectPoly(offset, 0, offset + width, d)
  if (wall === 'bottom') return rectPoly(offset, W - d, offset + width, W)
  if (wall === 'left') return rectPoly(0, offset, d, offset + width)
  return rectPoly(L - d, offset, L, offset + width)
}

export function openingCenter(room, op) {
  const m = op.offset + op.width / 2
  if (op.wall === 'top') return [m, 0]
  if (op.wall === 'bottom') return [m, room.width]
  if (op.wall === 'left') return [0, m]
  return [room.length, m]
}

export function wallLength(room, wall) {
  return wall === 'top' || wall === 'bottom' ? room.length : room.width
}

function segmentPoly(x1, y1, x2, y2, half) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * half
  const ny = (dx / len) * half
  return [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]
}

export function doorPathPoly(room, door, rules) {
  const [cx, cy] = openingCenter(room, door)
  const inward = { top: [0, 12], bottom: [0, -12], left: [12, 0], right: [-12, 0] }[door.wall]
  return segmentPoly(cx + inward[0], cy + inward[1], room.length / 2, room.width / 2, rules.minPassage / 2)
}

export function evaluate(room, furniture, rules = DEFAULT_RULES) {
  const polys = new Map(furniture.map((f) => [f.id, corners(f)]))
  const solid = furniture.filter((f) => !isFlat(f))
  const issues = new Map(furniture.map((f) => [f.id, new Set()]))
  const add = (id, kind) => issues.get(id)?.add(kind)

  const outOfBounds = []
  furniture.forEach((f) => {
    if (outsideRoom(polys.get(f.id), room)) {
      outOfBounds.push({ id: f.id, name: f.name })
      add(f.id, 'bounds')
    }
  })

  const overlaps = []
  const narrow = []
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
      const a = solid[i]
      const b = solid[j]
      const pa = polys.get(a.id)
      const pb = polys.get(b.id)
      const depth = overlapDepth(pa, pb)
      if (depth > 1) {
        overlaps.push({ a: a.id, b: b.id, aName: a.name, bName: b.name, depth })
        add(a.id, 'overlap')
        add(b.id, 'overlap')
      } else if (!catalogByType[a.type]?.round && !catalogByType[b.type]?.round && !(a.type === 'chair' && b.type === 'chair')) {
        const gap = polyDistance(pa, pb)
        if (gap > TOUCH_TOL && gap < rules.minPassage - 0.5) {
          narrow.push({ a: a.id, b: b.id, aName: a.name, bName: b.name, gap })
          add(a.id, 'narrow')
          add(b.id, 'narrow')
        }
      }
    }
  }
  solid.forEach((f) => {
    if (catalogByType[f.type]?.round) return
    const poly = polys.get(f.id)
    if (outsideRoom(poly, room)) return
    const gap = wallGap(poly, room)
    if (gap > TOUCH_TOL && gap < rules.minPassage - 0.5) {
      narrow.push({ a: f.id, b: 'wall', aName: f.name, bName: 'the wall', gap })
      add(f.id, 'narrow')
    }
  })

  const doors = room.openings.filter((o) => o.kind === 'door')
  const doorBlocks = []
  doors.forEach((door) => {
    const zone = openingZone(room, door, rules.doorClearance)
    solid.forEach((f) => {
      if (overlapDepth(polys.get(f.id), zone) > 1) {
        doorBlocks.push({ id: f.id, name: f.name, openingId: door.id })
        add(f.id, 'door')
      }
    })
  })

  const step = 5
  let covered = 0
  const solidPolys = solid.map((f) => polys.get(f.id)).map((p) => ({ p, b: bounds(p) }))
  for (let x = step / 2; x < room.length; x += step) {
    for (let y = step / 2; y < room.width; y += step) {
      for (const { p, b } of solidPolys) {
        if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) continue
        if (pointInPoly(x, y, p)) { covered++; break }
      }
    }
  }
  const roomArea = room.length * room.width
  const footprint = Math.min(roomArea, covered * step * step)
  const freeArea = Math.max(0, roomArea - footprint)

  const guidance = []
  if (roomArea > 0 && freeArea / roomArea < 0.4) {
    guidance.push({ id: 'crowded', text: `Only ${Math.round((freeArea / roomArea) * 100)}% of the floor is open. Many designers aim for about 40% or more.` })
  }
  doors.forEach((door) => {
    const path = doorPathPoly(room, door, rules)
    const blockers = solid.filter((f) => overlapDepth(polys.get(f.id), path) > 1).map((f) => f.name)
    if (blockers.length) {
      guidance.push({ id: `path-${door.id}`, text: `The walking line from the door to the middle of the room passes through: ${[...new Set(blockers)].join(', ')}.` })
    }
  })
  const windows = room.openings.filter((o) => o.kind === 'window')
  windows.forEach((win) => {
    const zone = openingZone(room, win, 30)
    const tall = furniture.filter((f) => isTall(f) && overlapDepth(polys.get(f.id), zone) > 1).map((f) => f.name)
    if (tall.length) guidance.push({ id: `window-${win.id}`, text: `${[...new Set(tall)].join(', ')} blocks a window and will cut daylight.` })
  })

  return {
    outOfBounds,
    overlaps,
    narrow,
    doorBlocks,
    guidance,
    issues,
    roomArea,
    freeArea,
    footprint,
    problemCount: outOfBounds.length + overlaps.length + doorBlocks.length + narrow.length,
  }
}
