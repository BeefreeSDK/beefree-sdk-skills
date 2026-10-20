// Beefree SDK demo server. Node.js 20.6+ and no dependencies.
// Serves ./public and exposes POST /api/beefree/token, which calls the
// Beefree authorization endpoint with credentials taken from the environment.
// Start with: node --env-file=.env server.js   (or: npm start)
// Listens on 127.0.0.1 only: the token endpoint has no origin check, so it must not be
// reachable from other machines. Set HOST=0.0.0.0 to test from another device on your network.

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '127.0.0.1'
const DEFAULT_AUTH_URL = 'https://auth.getbee.io/loginV2'
const AUTH_URL = process.env.BEEFREE_AUTH_URL || DEFAULT_AUTH_URL
const PUBLIC_DIR = path.join(__dirname, 'public')
const UID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
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
      if (data.length > 10_000) reject(new Error('body too large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// Exchanges the server-side credentials for a Beefree SDK token.
// The Beefree response body is forwarded unchanged: { access_token, v2 }.
// The Client Secret never leaves this function and is never logged.
// Demo only: no login and the uid comes from the request body. A real app puts this endpoint behind its
// own login and takes the uid from the server-side session; see "Not for production" in README.md.
async function handleToken(req, res) {
  const clientId = process.env.BEEFREE_CLIENT_ID
  const clientSecret = process.env.BEEFREE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('missing BEEFREE_CLIENT_ID or BEEFREE_CLIENT_SECRET in the environment')
    return sendJson(res, 500, { error: 'server is missing Beefree SDK credentials, check .env' })
  }

  let uid = 'demo-user'
  try {
    const raw = await readBody(req)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.uid !== undefined) uid = String(parsed.uid)
    }
  } catch {
    return sendJson(res, 400, { error: 'invalid JSON body' })
  }
  if (!UID_PATTERN.test(uid)) {
    return sendJson(res, 400, { error: 'uid must contain only letters, digits, _ and -' })
  }

  let upstream
  try {
    upstream = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, uid }),
    })
  } catch (err) {
    console.error(`loginV2 unreachable: ${err.message}`)
    return sendJson(res, 502, { error: 'could not reach the Beefree authorization endpoint' })
  }

  const text = await upstream.text()
  console.log(`token request uid=${uid} -> ${upstream.status}`)
  res.writeHead(upstream.status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(text)
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost')
  let pathname
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    // Malformed percent-encoding, for example /%. decodeURIComponent throws and must not kill the server.
    res.writeHead(400)
    return res.end()
  }
  let filePath = path.normalize(path.join(PUBLIC_DIR, pathname))
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403)
    return res.end()
  }
  if (pathname.endsWith('/')) filePath = path.join(filePath, 'index.html')
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      return res.end('not found')
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' })
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/beefree/token') return handleToken(req, res)
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res)
  res.writeHead(405)
  res.end()
})

server.listen(PORT, HOST, () => {
  console.log(`Beefree SDK demo running at http://localhost:${PORT} (bound to ${HOST})`)
  if (AUTH_URL !== DEFAULT_AUTH_URL) {
    console.warn(`note: BEEFREE_AUTH_URL is set, credentials will be sent to ${AUTH_URL}`)
  }
  if (!process.env.BEEFREE_CLIENT_ID || !process.env.BEEFREE_CLIENT_SECRET) {
    console.warn('warning: BEEFREE_CLIENT_ID or BEEFREE_CLIENT_SECRET is not set. Copy .env.example to .env and start with `npm start`.')
  }
})
