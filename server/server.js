// Optional backend for TryBefore. No dependencies: run with `npm run server`.
// It keeps provider keys on the server and exposes three endpoints:
//   GET  /api/status     -> { ai: boolean, image: boolean }
//   POST /api/design     -> forwards the room description to AI_DESIGN_URL
//   POST /api/visualize  -> forwards photo + prompt to IMAGE_EDIT_URL
// Configure with environment variables (never commit keys):
//   AI_DESIGN_URL, AI_DESIGN_KEY, IMAGE_EDIT_URL, IMAGE_EDIT_KEY
// The upstream services must accept/return the JSON shapes documented in README.md.
import http from 'node:http'

const { AI_DESIGN_URL, AI_DESIGN_KEY, IMAGE_EDIT_URL, IMAGE_EDIT_KEY, PORT = 8787 } = process.env

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > 15 * 1024 * 1024) { reject(new Error('Request too large')); req.destroy() }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })

const send = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function forward(url, key, body) {
  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body,
  })
  const text = await upstream.text()
  if (!upstream.ok) throw new Error(`Upstream service answered ${upstream.status}`)
  return JSON.parse(text)
}

http
  .createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/api/status') {
        return send(res, 200, { ai: !!(AI_DESIGN_URL && AI_DESIGN_KEY), image: !!(IMAGE_EDIT_URL && IMAGE_EDIT_KEY) })
      }
      if (req.method === 'POST' && req.url === '/api/design') {
        if (!AI_DESIGN_URL || !AI_DESIGN_KEY) return send(res, 501, { error: 'AI design is not configured on the server.' })
        return send(res, 200, await forward(AI_DESIGN_URL, AI_DESIGN_KEY, await readBody(req)))
      }
      if (req.method === 'POST' && req.url === '/api/visualize') {
        if (!IMAGE_EDIT_URL || !IMAGE_EDIT_KEY) return send(res, 501, { error: 'Image generation is not configured on the server.' })
        return send(res, 200, await forward(IMAGE_EDIT_URL, IMAGE_EDIT_KEY, await readBody(req)))
      }
      send(res, 404, { error: 'Not found' })
    } catch (e) {
      send(res, 502, { error: e.message || 'Server error' })
    }
  })
  .listen(PORT, () => console.log(`TryBefore API listening on http://localhost:${PORT}`))
