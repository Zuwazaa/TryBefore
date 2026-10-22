// Integration point for optional backend services.
// The browser never holds API keys: it talks to /api/* and the server (see server/server.js)
// forwards to the provider configured in its environment.

let cached = null

export async function getServiceStatus(force = false) {
  if (cached && !force) return cached
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch('/api/status', { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) throw new Error('status')
    const data = await res.json()
    cached = { ai: !!data.ai, image: !!data.image }
  } catch {
    cached = { ai: false, image: false }
  }
  return cached
}

async function postJSON(url, body, timeoutMs = 60000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `The service answered with status ${res.status}.`)
    return data
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('The request took too long. Try again.')
    throw e
  } finally {
    clearTimeout(t)
  }
}

export const requestDesign = (payload) => postJSON('/api/design', payload)
export const requestVisualization = (payload) => postJSON('/api/visualize', payload, 120000)
