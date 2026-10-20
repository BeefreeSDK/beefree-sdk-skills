// Loads a sample template, creates the Beefree SDK builder and wires the save round trip.
// Requires: the BeePlugin loader script, auth.js (getBeefreeToken) and token-claims.js loaded before this file.
// Email, Page and Popup credentials load here with a sample of their type; File Manager credentials are sent to file-manager.html.

// Email sample name, overridable from the page URL: index.html?template=promo
// Known names: m-bee, newsletter, one-column, promo, plus base-* variants with placeholder images.
const TEMPLATE_NAME = new URLSearchParams(location.search).get('template') || 'm-bee'

// Page and Popup samples from BeefreeSDK/beefree-sdk-assets-templates, pinned to one commit so later changes there cannot break the demo.
const SAMPLES_BASE = 'https://raw.githubusercontent.com/BeefreeSDK/beefree-sdk-assets-templates/05bc0b87fc2df0e74e6e8d1c93c46ceee9fb2d71/'

// One entry per application type covered on this page: sample template, what the user edits, extra config.
const BUILDERS = {
  nl: {
    templateName: TEMPLATE_NAME,
    templateUrl: 'https://rsrc.getbee.io/api/templates/' + encodeURIComponent(TEMPLATE_NAME),
    noun: 'email',
  },
  page: {
    templateName: 'shopping-app',
    templateUrl: SAMPLES_BASE + 'v3%20Page%20Templates/shopping-app.json',
    noun: 'page',
  },
  pub: {
    templateName: 'Welcome-Back',
    templateUrl: SAMPLES_BASE + 'v3%20Popup%20Templates/Welcome-Back/Welcome-Back.json',
    noun: 'popup',
    // The popup width is not saved in the template: the host app sets it. This sample was designed at 500px.
    config: { workspace: { popup: { contentWidth: 500 } } },
    // Popup Builder returns an HTML snippet to embed in the host app's popup, not a full page.
    htmlHeading: 'HTML snippet to embed (onSave)',
  },
}

const UID = 'demo-user' // one uid per customer account of your app, never personal data

const statusEl = document.getElementById('status')
const saveBtn = document.getElementById('save')
const previewBtn = document.getElementById('preview')
const jsonOut = document.getElementById('json-output')
const htmlOut = document.getElementById('html-output')
const htmlPreview = document.getElementById('html-preview')
const htmlHeading = htmlOut.previousElementSibling

let bee = null

function setStatus(text, isError) {
  statusEl.textContent = text
  statusEl.className = isError ? 'error' : ''
}

const beeConfig = {
  container: 'beefree-sdk-container',
  language: 'en-US',
  // Tells Beefree this builder was started from the skill's demo, the way @beefree.io/sdk sends "[npm] @beefree.io/sdk".
  // Remove both lines when you copy this config into your own app. Keep the version equal to metadata.version in SKILL.md.
  startOrigin: '[skill] beefree-sdk-setup',
  startOriginVersion: '0.4.0',
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
    const builder = BUILDERS[handle]
    if (!builder) {
      setStatus('These credentials are for this application type: ' + getApplicationTypeName(handle) + '. This demo covers Email Builder, Page Builder, Popup Builder and File Manager.', true)
      return
    }
    if (builder.htmlHeading) htmlHeading.textContent = builder.htmlHeading

    setStatus('Loading sample template ' + builder.templateName + '…')
    const templateRes = await fetch(builder.templateUrl)
    if (!templateRes.ok) throw new Error('could not load the sample template ' + builder.templateName + ' (' + templateRes.status + ')')
    const template = await templateRes.json()

    // Type-specific keys go into beeConfig before create, so the create line stays the one the feature skills edit.
    Object.assign(beeConfig, builder.config)

    setStatus('Starting the ' + getApplicationTypeName(handle) + '…')
    BeePlugin.create(token, beeConfig, function (instance) {
      bee = instance
      bee.start(template)
      saveBtn.disabled = false
      previewBtn.disabled = false
      setStatus('Ready. Edit the ' + builder.noun + ', then click Save.')
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
