// Authorization, recommended mode: the browser asks the local backend for a token.
// The backend (server.js) holds the Client ID and Client Secret and calls
// https://auth.getbee.io/loginV2 on the browser's behalf.
// Copy this file to public/auth.js.

async function getBeefreeToken(uid) {
  const res = await fetch('/api/beefree/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = body.code ? ' (code ' + body.code + ': ' + body.message + ')' : body.error ? ' (' + body.error + ')' : ''
    throw new Error('Token request failed with HTTP ' + res.status + detail)
  }
  // Return the whole object { access_token, v2 }: the builder needs both fields.
  return body
}
