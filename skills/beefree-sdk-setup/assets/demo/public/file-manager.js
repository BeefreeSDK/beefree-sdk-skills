// Starts a File Manager application as a standalone asset library: upload, browse and organize files.
// Requires: the BeePlugin loader script, auth.js (getBeefreeToken) and token-claims.js loaded before this file.
// Files belong to the uid: the same uid sees the same files after a reload.

const UID = 'demo-user' // one uid per customer account of your app, never personal data

const statusEl = document.getElementById('status')

let bee = null

function setStatus(text, isError) {
  statusEl.textContent = text
  statusEl.className = isError ? 'error' : ''
}

// A File Manager takes no template and no onSave.
// onFilePickerInsert and onFilePickerCancel are left out on purpose: defining them adds the Insert and X buttons,
// which only make sense when the host app opens the File Manager to pick a file.
const beeConfig = {
  container: 'beefree-sdk-container',
  language: 'en-US',
  onWarning: function (warning) {
    console.warn('Beefree SDK warning', warning)
  },
  onError: function (error) {
    console.error('Beefree SDK error', error)
    if (error && error.code === 5101 && bee) {
      // Token expired and cannot be refreshed by the SDK: fetch a new one and inject it.
      getBeefreeToken(UID).then(token => bee.updateToken(token)).catch(err => setStatus(err.message, true))
      return
    }
    if (error && error.code === 5102) {
      setStatus('Beefree SDK asked for a restart (code 5102). Reload the page.', true)
      return
    }
    setStatus('Beefree SDK error: ' + (error && error.message ? error.message : JSON.stringify(error)), true)
  },
}

async function start() {
  try {
    setStatus('Requesting token…')
    const token = await getBeefreeToken(UID)

    const handle = getApplicationHandle(token)
    if (handle !== 'fm') {
      // No redirect back to index.html, so a wrong type can never loop between the two pages.
      setStatus('These credentials are for this application type: ' + getApplicationTypeName(handle) + ', not File Manager. Open index.html instead.', true)
      return
    }

    setStatus('Starting the File Manager…')
    BeePlugin.create(token, beeConfig, function (instance) {
      bee = instance
      bee.start()
      setStatus('Ready. Upload a file, then reload the page: it is still there.')
    })
  } catch (err) {
    setStatus(err.message, true)
  }
}

if (typeof BeePlugin === 'undefined') {
  setStatus('BeePlugin loader did not load. Check network access to app-rsrc.getbee.io.', true)
} else if (typeof getBeefreeToken !== 'function') {
  setStatus('auth.js is missing. Copy auth/proxy.js or auth/client-side.js to public/auth.js.', true)
} else {
  start()
}
