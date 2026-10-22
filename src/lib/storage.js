import { CATALOG, catalogByType } from './catalog'
import { DEFAULT_RULES, WALLS } from './geometry'
import { uid, clamp } from './units'

const PROJECTS_KEY = 'trybefore.projects.v1'
const SETTINGS_KEY = 'trybefore.settings.v1'

export const DEFAULT_SETTINGS = { unit: 'm', ...DEFAULT_RULES, autosave: true }

const num = (v, fallback) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : fallback)

function sanitizeOpening(o, room) {
  if (!o || !['door', 'window'].includes(o.kind) || !WALLS.includes(o.wall)) return null
  const len = o.wall === 'top' || o.wall === 'bottom' ? room.length : room.width
  const width = clamp(num(o.width, o.kind === 'door' ? 90 : 120), 40, len)
  return { id: o.id || uid('o'), kind: o.kind, wall: o.wall, width, offset: clamp(num(o.offset, 0), 0, Math.max(0, len - width)) }
}

function sanitizeItem(f) {
  if (!f || !catalogByType[f.type]) return null
  const spec = catalogByType[f.type]
  return {
    id: f.id || uid('f'),
    type: f.type,
    name: String(f.name || spec.name).slice(0, 60),
    x: num(f.x, 100),
    y: num(f.y, 100),
    w: clamp(num(f.w, spec.w), 10, 1000),
    d: clamp(num(f.d, spec.d), 10, 1000),
    rotation: num(f.rotation, 0),
    status: f.status === 'owned' ? 'owned' : 'buy',
    price: Math.max(0, num(f.price, 0)),
  }
}

export function sanitizeProject(raw) {
  if (!raw || typeof raw !== 'object' || !raw.room) return null
  const length = clamp(num(raw.room.length, NaN), 100, 3000)
  const width = clamp(num(raw.room.width, NaN), 100, 3000)
  if (!Number.isFinite(length) || !Number.isFinite(width)) return null
  const room = {
    type: String(raw.room.type || 'Bedroom'),
    length,
    width,
    height: clamp(num(raw.room.height, 250), 150, 600),
    wallColor: /^#[0-9a-f]{6}$/i.test(raw.room.wallColor) ? raw.room.wallColor : '#ece6d8',
    openings: [],
  }
  room.openings = (Array.isArray(raw.room.openings) ? raw.room.openings : []).map((o) => sanitizeOpening(o, room)).filter(Boolean)
  const furniture = (Array.isArray(raw.furniture) ? raw.furniture : []).map(sanitizeItem).filter(Boolean)
  const layouts = (Array.isArray(raw.layouts) ? raw.layouts : [])
    .map((l) => l && Array.isArray(l.furniture)
      ? { id: l.id || uid('l'), name: String(l.name || 'Layout').slice(0, 60), source: l.source || 'manual', createdAt: num(l.createdAt, Date.now()), furniture: l.furniture.map(sanitizeItem).filter(Boolean) }
      : null)
    .filter(Boolean)
  const visualizations = (Array.isArray(raw.visualizations) ? raw.visualizations : [])
    .filter((v) => v && typeof v === 'object' && v.id)
    .map((v) => ({ id: v.id, kind: v.kind === 'generated' ? 'generated' : 'sample', prompt: String(v.prompt || ''), label: String(v.label || ''), sampleId: v.sampleId || null, image: typeof v.image === 'string' ? v.image : null, createdAt: num(v.createdAt, Date.now()) }))
  return {
    id: raw.id || uid('p'),
    name: String(raw.name || 'Untitled room').slice(0, 80),
    createdAt: num(raw.createdAt, Date.now()),
    updatedAt: num(raw.updatedAt, Date.now()),
    unit: ['m', 'cm', 'ft'].includes(raw.unit) ? raw.unit : 'm',
    room,
    furniture,
    layouts,
    rules: {
      minPassage: clamp(num(raw.rules?.minPassage, DEFAULT_RULES.minPassage), 10, 200),
      doorClearance: clamp(num(raw.rules?.doorClearance, DEFAULT_RULES.doorClearance), 30, 200),
      grid: clamp(num(raw.rules?.grid, DEFAULT_RULES.grid), 1, 50),
    },
    budget: { total: Math.max(0, num(raw.budget?.total, 0)) },
    photo: typeof raw.photo === 'string' && raw.photo.startsWith('data:image/') ? raw.photo : null,
    visualizations,
    example: raw.example || null,
  }
}

export function loadProjects() {
  try {
    const text = localStorage.getItem(PROJECTS_KEY)
    if (!text) return { projects: [], warning: null }
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    const projects = parsed.map(sanitizeProject).filter(Boolean)
    const dropped = parsed.length - projects.length
    return { projects, warning: dropped ? `${dropped} saved project${dropped > 1 ? 's' : ''} could not be read and ${dropped > 1 ? 'were' : 'was'} skipped.` : null }
  } catch {
    return { projects: [], warning: 'Saved projects were corrupted and could not be loaded. Importing a JSON backup will restore them.' }
  }
}

export function persistProjects(projects) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
    return { ok: true }
  } catch (e) {
    const quota = e && (e.name === 'QuotaExceededError' || e.code === 22)
    return { ok: false, error: quota ? 'Browser storage is full. Delete a project or remove photos to free up space.' : 'Could not save to browser storage.' }
  }
}

export function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return {
      unit: ['m', 'cm', 'ft'].includes(s.unit) ? s.unit : DEFAULT_SETTINGS.unit,
      minPassage: clamp(num(s.minPassage, DEFAULT_SETTINGS.minPassage), 10, 200),
      doorClearance: clamp(num(s.doorClearance, DEFAULT_SETTINGS.doorClearance), 30, 200),
      grid: clamp(num(s.grid, DEFAULT_SETTINGS.grid), 1, 50),
      autosave: s.autosave !== false,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function persistSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* ignore */ }
}

export function exportProjectJSON(project) {
  return JSON.stringify({ app: 'TryBefore', version: 1, exportedAt: new Date().toISOString(), project }, null, 2)
}

export function parseImportedProject(text) {
  let data
  try { data = JSON.parse(text) } catch { return { error: 'This file is not valid JSON.' } }
  const raw = data?.app === 'TryBefore' ? data.project : data
  const project = sanitizeProject(raw)
  if (!project) return { error: 'This file does not look like a TryBefore project (room size is missing).' }
  return { project: { ...project, id: uid('p'), name: `${project.name} (imported)`, updatedAt: Date.now() } }
}

export const knownTypes = CATALOG.map((c) => c.type)
