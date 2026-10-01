// Loads a sample template, creates the Beefree SDK builder and wires the save round trip.
// Requires: the BeePlugin loader script, auth.js (getBeefreeToken) and token-claims.js loaded before this file.
// File Manager credentials are sent to file-manager.html; Page and Popup credentials are not covered yet.

// Sample template name, overridable from the page URL: index.html?template=promo
// Known names: m-bee, newsletter, one-column, promo, plus base-* variants with placeholder images.
const TEMPLATE_NAME = new URLSearchParams(location.search).get('template') || 'm-bee'
const TEMPLATE_URL = 'https://rsrc.getbee.io/api/templates/' + encodeURIComponent(TEMPLATE_NAME)
const UID = 'demo-user' // one uid per customer account of your app, never personal data

const statusEl = document.getElementById('status')
const saveBtn = document.getElementById('save')
const previewBtn = document.getElementById('preview')
const jsonOut = document.getElementById('json-output')
const htmlOut = document.getElementById('html-output')
const htmlPreview = document.getElementById('html-preview')

let bee = null

function setStatus(text, isError) {
  statusEl.textContent = text
  statusEl.className = isError ? 'error' : ''
}

const beeConfig = {
  container: 'beefree-sdk-container',
  language: 'en-US',
  onSave: function (jsonFile, htmlFile) {
    // jsonFile is a string: parse it before storing or inspecting it.
    const parsed = typeof jsonFile === 'string' ? JSON.parse(jsonFile) : jsonFile
    jsonOut.textContent = JSON.stringify(parsed, null, 2)
    jsonOut.className = ''
    htmlOut.textContent = htmlFile
    htmlOut.className = ''
    htmlPreview.srcdoc = htmlFile
    setStatus('Saved at ' + new Date().toLocaleTimeString())
  },
  onSaveAsTemplate: function (jsonFile) {
    jsonOut.textContent = JSON.stringify(typeof jsonFile === 'string' ? JSON.parse(jsonFile) : jsonFile, null, 2)
    jsonOut.className = ''
    setStatus('Template JSON saved at ' + new Date().toLocaleTimeString())
  },
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
      // A full restart is required. error.template holds the current work.
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
    if (handle === 'fm') {
      // file-manager.html requests its own token, so this redirect costs one extra loginV2 call.
      // replace() keeps this page out of the history: Back does not bounce through the redirect.
      location.replace('file-manager.html')
      return
    }
    if (handle !== 'nl') {
      setStatus('These credentials are for this application type: ' + getApplicationTypeName(handle) + '. This demo covers Email Builder and File Manager only.', true)
      return
    }

    setStatus('Loading sample template ' + TEMPLATE_NAME + '…')
    const templateRes = await fetch(TEMPLATE_URL)
    if (!templateRes.ok) throw new Error('could not load the sample template ' + TEMPLATE_NAME + ' (' + templateRes.status + ')')
    const template = await templateRes.json()

    setStatus('Starting the builder…')
    BeePlugin.create(token, beeConfig, function (instance) {
      bee = instance
      bee.start(template)
      saveBtn.disabled = false
      previewBtn.disabled = false
      setStatus('Ready. Edit the email, then click Save.')
    })
  } catch (err) {
    setStatus(err.message, true)
  }
}

saveBtn.addEventListener('click', () => bee && bee.save())
previewBtn.addEventListener('click', () => bee && bee.preview())

if (typeof BeePlugin === 'undefined') {
  setStatus('BeePlugin loader did not load. Check network access to app-rsrc.getbee.io.', true)
} else if (typeof getBeefreeToken !== 'function') {
  setStatus('auth.js is missing. Copy auth/proxy.js or auth/client-side.js to public/auth.js.', true)
} else {
  start()
}
