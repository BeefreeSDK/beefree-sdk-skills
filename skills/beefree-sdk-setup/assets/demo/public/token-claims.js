// Reads the application type from a Beefree SDK token, shared by index.html and file-manager.html.
// access_token is a JWT; its payload is not secret and carries product_handle in clear text.

const APP_TYPES = {
  nl: 'Email Builder',
  page: 'Page Builder',
  pub: 'Popup Builder',
  fm: 'File Manager',
}

// Returns the product_handle claim (nl, page, pub, fm), or 'nl' when the token has none.
function getApplicationHandle(token) {
  try {
    const segment = String(token.access_token).split('.')[1]
    // base64url to base64: swap the two URL-safe characters and restore the padding atob expects.
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(segment.length / 4) * 4, '=')
    const payload = JSON.parse(atob(base64))
    return payload.product_handle || 'nl'
  } catch {
    return 'nl'
  }
}

function getApplicationTypeName(handle) {
  return APP_TYPES[handle] || 'unknown type (' + handle + ')'
}
