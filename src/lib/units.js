export const UNITS = {
  m: { label: 'm', name: 'Meters', factor: 100, dp: 2 },
  cm: { label: 'cm', name: 'Centimeters', factor: 1, dp: 0 },
  ft: { label: 'ft', name: 'Feet', factor: 30.48, dp: 1 },
}

const round = (v, dp) => {
  const p = 10 ** dp
  return Math.round(v * p) / p
}

export const toCm = (value, unit = 'm') => value * UNITS[unit].factor
export const fromCm = (cm, unit = 'm') => round(cm / UNITS[unit].factor, UNITS[unit].dp)
export const fmtLen = (cm, unit = 'm') => `${fromCm(cm, unit)} ${UNITS[unit].label}`
export const fmtArea = (cm2, unit = 'm') =>
  unit === 'ft' ? `${(cm2 / 929.0304).toFixed(1)} ft²` : `${(cm2 / 10000).toFixed(2)} m²`

export function parseNumber(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN
  const s = String(input ?? '').trim().replace(',', '.')
  if (s === '') return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
export const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`

export const formatMoney = (n) =>
  Number.isFinite(n) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n) : '0'
