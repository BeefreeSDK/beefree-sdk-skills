// Authorization, QUICK TEST MODE ONLY.
//
// This file puts your Beefree SDK Client ID and Client Secret in the browser.
// Anyone who can open this page or read its source can copy the secret and
// use your Beefree SDK quota. While the demo server runs, any website open in
// the same browser can load http://localhost:3000/auth.js with a script tag
// and read the two constants too. Beefree's documentation says: do not put
// your Beefree SDK credentials in client-side code.
//
// Keep this file on your machine. Do not commit it, deploy it or share it.
// Add public/auth.js to .gitignore when you use this variant.
// For anything beyond a local test use auth/proxy.js and server.js instead.
//
// Copy this file to public/auth.js and replace the two placeholders.

const BEEFREE_CLIENT_ID = 'YOUR_CLIENT_ID'
const BEEFREE_CLIENT_SECRET = 'YOUR_CLIENT_SECRET'

async function getBeefreeToken(uid) {
  if (BEEFREE_CLIENT_ID === 'YOUR_CLIENT_ID' || BEEFREE_CLIENT_SECRET === 'YOUR_CLIENT_SECRET') {
    throw new Error('Replace YOUR_CLIENT_ID and YOUR_CLIENT_SECRET in public/auth.js')
  }
  const res = await fetch('https://auth.getbee.io/loginV2', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: BEEFREE_CLIENT_ID, client_secret: BEEFREE_CLIENT_SECRET, uid }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = body.code ? ' (code ' + body.code + ': ' + body.message + ')' : ''
    throw new Error('Token request failed with HTTP ' + res.status + detail)
  }
  // Return the whole object { access_token, v2 }: the builder needs both fields.
  return body
}
