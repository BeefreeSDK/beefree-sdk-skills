// Self-hosted saved rows API for the Beefree SDK demo server. Node.js 20.6+, no dependencies.
// Mount in server.js:
//   const { handleRows } = require('./rows-api')
//   if (req.url === '/api/rows' || req.url.startsWith('/api/rows/')) return handleRows(req, res)   // before the static handler
//
// Routes:
//   GET    /api/rows          -> JSON array of saved rows, what the getRows hook resolves
//   POST   /api/rows          -> upsert one row (body: the row JSON, keyed by metadata.guid)
//   DELETE /api/rows/:guid    -> remove one row
//
// Demo shortcut: JSON file store shared by every uid. Swap for a database keyed by account when more than one developer or one server uses it.

const fs = require('node:fs')
const path = require('node:path')

const STORE = process.env.ROWS_FILE || path.join(__dirname, 'rows.json')
const MAX_BODY = 1_000_000

function load() {
  try {
    const rows = JSON.parse(fs.readFileSync(STORE, 'utf8'))
    // Rows without metadata can only come from a hand-edited file; the API never stores them.
    return Array.isArray(rows) ? rows.filter(r => r && r.metadata) : []
  } catch {
    return []
  }
}

function save(rows) {
  fs.writeFileSync(STORE, JSON.stringify(rows, null, 2))
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
      if (data.length > MAX_BODY) reject(new Error('body too large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

async function handleRows(req, res) {
  try {
    await route(req, res)
  } catch (err) {
    // An unhandled rejection would terminate the server; report it instead.
    console.error(`rows API error: ${err.message}`)
    if (!res.headersSent) sendJson(res, 500, { error: 'rows API failed, see the server log' })
    else res.end()
  }
}

async function route(req, res) {
  const url = new URL(req.url, 'http://localhost')
  let guid
  try {
    guid = decodeURIComponent(url.pathname.slice('/api/rows'.length).replace(/^\//, ''))
  } catch {
    return sendJson(res, 400, { error: 'malformed percent-encoding in the URL' })
  }

  if (req.method === 'GET' && !guid) return sendJson(res, 200, load())

  if (req.method === 'POST' && !guid) {
    let row
    try {
      row = JSON.parse(await readBody(req))
    } catch {
      return sendJson(res, 400, { error: 'invalid JSON body' })
    }
    const meta = row && row.metadata
    if (!meta || typeof meta.name !== 'string' || typeof meta.guid !== 'string') {
      return sendJson(res, 400, { error: 'row.metadata.name and row.metadata.guid are required strings' })
    }
    const rows = load()
    const index = rows.findIndex(r => r.metadata.guid === meta.guid)
    if (index === -1) rows.push(row)
    else rows[index] = row // keep the list order when a row is re-saved or renamed
    save(rows)
    console.log(`saved row guid=${meta.guid} name=${JSON.stringify(meta.name)} -> ${rows.length} rows`)
    return sendJson(res, 200, { ok: true, count: rows.length })
  }

  if (req.method === 'DELETE' && guid) {
    const before = load()
    const rows = before.filter(r => r.metadata.guid !== guid)
    save(rows)
    console.log(`deleted row guid=${guid} -> ${rows.length} rows`)
    res.writeHead(rows.length === before.length ? 404 : 204)
    return res.end()
  }

  sendJson(res, 404, { error: 'not found' })
}

module.exports = { handleRows }
