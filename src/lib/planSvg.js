import { glyphFills, catalogByType } from './catalog'
import { fmtLen, fmtArea } from './units'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const f1 = (n) => Math.round(n * 10) / 10

const FRAMES = (room) => ({
  top: { o: [0, 0], t: [1, 0], n: [0, 1] },
  bottom: { o: [0, room.width], t: [1, 0], n: [0, -1] },
  left: { o: [0, 0], t: [0, 1], n: [1, 0] },
  right: { o: [room.length, 0], t: [0, 1], n: [-1, 0] },
})

function openingSvg(room, op, floor) {
  const fr = FRAMES(room)[op.wall]
  const P = (s, u) => [fr.o[0] + fr.t[0] * s + fr.n[0] * u, fr.o[1] + fr.t[1] * s + fr.n[1] * u]
  const [a, b] = [P(op.offset, -7), P(op.offset + op.width, 7)]
  const x = Math.min(a[0], b[0])
  const y = Math.min(a[1], b[1])
  const w = Math.abs(a[0] - b[0])
  const h = Math.abs(a[1] - b[1])
  if (op.kind === 'window') {
    const l = (u) => {
      const p = P(op.offset, u)
      const q = P(op.offset + op.width, u)
      return `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}" stroke="#4d6a74" stroke-width="2"/>`
    }
    return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="#d5e3e6"/>${l(-4)}${l(0)}${l(4)}`
  }
  const H = P(op.offset, 0)
  const A = P(op.offset, op.width)
  const B = P(op.offset + op.width, 0)
  const sweep = fr.n[0] * fr.t[1] - fr.n[1] * fr.t[0] > 0 ? 1 : 0
  return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${floor}"/>
<line x1="${f1(H[0])}" y1="${f1(H[1])}" x2="${f1(A[0])}" y2="${f1(A[1])}" stroke="#26282a" stroke-width="3"/>
<path d="M${f1(A[0])} ${f1(A[1])} A${op.width} ${op.width} 0 0 ${sweep} ${f1(B[0])} ${f1(B[1])}" fill="none" stroke="#7a7d75" stroke-width="1.5" stroke-dasharray="6 5"/>`
}

export function glyphSvg(item, { stroke = 'rgba(38,40,42,0.55)', sw = 1.5 } = {}) {
  const spec = catalogByType[item.type]
  const fills = glyphFills(item)
  const m = Math.min(item.w, item.d)
  const parts = (spec?.glyph || []).map((s) => {
    if (s.k === 'c') {
      return `<ellipse cx="${f1(s.x * item.w)}" cy="${f1(s.y * item.d)}" rx="${f1((s.d * item.w) / 2)}" ry="${f1((s.d * item.d) / 2)}" fill="${fills[s.f]}"/>`
    }
    return `<rect x="${f1(s.x * item.w)}" y="${f1(s.y * item.d)}" width="${f1(s.w * item.w)}" height="${f1(s.h * item.d)}" rx="${f1(s.rad * m)}" fill="${fills[s.f]}"/>`
  })
  const outline = spec?.round
    ? `<ellipse cx="${item.w / 2}" cy="${item.d / 2}" rx="${item.w / 2}" ry="${item.d / 2}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`
    : `<rect width="${item.w}" height="${item.d}" rx="${f1(m * 0.04)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`
  return parts.join('') + outline
}

export function planSvg({ room, furniture, unit = 'm', title = '', subtitle = '', issues, labels = true, dims = true, grid = false, legend = false, pad = 80 }) {
  const L = room.length
  const W = room.width
  const top = title ? 110 : 0
  const bottom = legend ? 60 : 0
  const vb = [-pad, -pad - top, L + pad * 2, W + pad * 2 + top + bottom]
  const floor = '#f3efe4'
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" font-family="Instrument Sans, system-ui, sans-serif">`
  out += `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#f7f4ec"/>`
  if (title) {
    out += `<text x="0" y="${-pad - top + 50}" font-family="Georgia, serif" font-size="34" fill="#26282a">${esc(title)}</text>`
    if (subtitle) out += `<text x="0" y="${-pad - top + 82}" font-size="18" fill="#5b5f58">${esc(subtitle)}</text>`
  }
  out += `<rect x="0" y="0" width="${L}" height="${W}" fill="${room.wallColor ? floor : floor}"/>`
  if (grid) {
    for (let x = 50; x < L; x += 50) out += `<line x1="${x}" y1="0" x2="${x}" y2="${W}" stroke="#ddd6c4" stroke-width="${x % 100 === 0 ? 1.2 : 0.6}"/>`
    for (let y = 50; y < W; y += 50) out += `<line x1="0" y1="${y}" x2="${L}" y2="${y}" stroke="#ddd6c4" stroke-width="${y % 100 === 0 ? 1.2 : 0.6}"/>`
  }
  const sorted = [...furniture].sort((a, b) => Number(!!catalogByType[b.type]?.flat) - Number(!!catalogByType[a.type]?.flat))
  for (const it of sorted) {
    const bad = issues?.get(it.id)?.size
    out += `<g transform="translate(${f1(it.x)} ${f1(it.y)}) rotate(${f1(it.rotation)}) translate(${-it.w / 2} ${-it.d / 2})">${glyphSvg(it, bad ? { stroke: '#b5503c', sw: 3 } : undefined)}</g>`
  }
  if (labels) {
    const fs = Math.max(11, Math.min(L, W) / 26)
    for (const it of furniture) {
      if (catalogByType[it.type]?.flat) continue
      const size = Math.min(fs, (Math.max(it.w, it.d) * 0.9) / (Math.max(it.name.length, 3) * 0.56))
      if (size < fs * 0.55) continue
      out += `<text x="${f1(it.x)}" y="${f1(it.y + size * 0.35)}" font-size="${f1(size)}" text-anchor="middle" fill="#26282a" paint-order="stroke" stroke="rgba(247,244,236,0.85)" stroke-width="${f1(size * 0.35)}">${esc(it.name)}</text>`
    }
  }
  out += `<rect x="-6" y="-6" width="${L + 12}" height="${W + 12}" fill="none" stroke="#26282a" stroke-width="12"/>`
  for (const op of room.openings) out += openingSvg(room, op, floor)
  if (dims) {
    const d = (x1, y1, x2, y2, text, vertical) => {
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6f7f62" stroke-width="2"/>
<line x1="${vertical ? x1 - 8 : x1}" y1="${vertical ? y1 : y1 - 8}" x2="${vertical ? x1 + 8 : x1}" y2="${vertical ? y1 : y1 + 8}" stroke="#6f7f62" stroke-width="2"/>
<line x1="${vertical ? x2 - 8 : x2}" y1="${vertical ? y2 : y2 - 8}" x2="${vertical ? x2 + 8 : x2}" y2="${vertical ? y2 : y2 + 8}" stroke="#6f7f62" stroke-width="2"/>
<text x="${mx}" y="${my}" font-size="20" fill="#3f4a38" text-anchor="middle" ${vertical ? `transform="rotate(-90 ${mx - 12} ${my})" dx="-12" dy="0"` : 'dy="-10"'}>${esc(text)}</text>`
    }
    out += d(0, -38, L, -38, fmtLen(L, unit), false)
    out += d(-38, 0, -38, W, fmtLen(W, unit), true)
  }
  if (legend) {
    const y = W + 52
    out += `<text x="0" y="${y}" font-size="18" fill="#5b5f58">Floor area ${fmtArea(L * W, unit)} · ${furniture.length} items · grid lines every 50 cm</text>`
    out += `<text x="0" y="${y + 28}" font-size="15" fill="#5b5f58">Made with TryBefore · dimensions as entered by the user</text>`
  }
  return out + '</svg>'
}

export function svgToPngDataUrl(svg, widthPx = 1600) {
  return new Promise((resolve, reject) => {
    const m = svg.match(/viewBox="([-\d.\s]+)"/)
    const [, , vw, vh] = m[1].split(/\s+/).map(Number)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = widthPx
      canvas.height = Math.round((widthPx * vh) / vw)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      try { resolve(canvas.toDataURL('image/png')) } catch (e) { reject(e) }
    }
    img.onerror = () => reject(new Error('Could not render the plan image.'))
    const sized = svg.replace('<svg ', `<svg width="${widthPx}" height="${Math.round((widthPx * vh) / vw)}" `)
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`
  })
}
