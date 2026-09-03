// Content dialog for the Beefree SDK demo page: merge tags and special links picked from a search dialog.
// Nothing server-side. Load this file before app.js, then:
//   BeePlugin.create(token, withContentDialog(beeConfig), ...)

// Demo shortcut: static catalogs. A real app fetches them from its backend inside the handler, with the text typed in the dialog as the query.
const MERGE_TAG_CATALOG = [
  { name: 'First name', value: '{{ first_name }}' },
  { name: 'Last name', value: '{{ last_name }}' },
  { name: 'Email', value: '{{ email }}' },
  { name: 'Company', value: '{{ company }}' },
  { name: 'City', value: '{{ city }}' },
  { name: 'Last order date', value: '{{ last_order.date }}' },
  { name: 'Last order total', value: '{{ last_order.total }}' },
  { name: 'Loyalty points', value: '{{ loyalty.points }}' },
  { name: 'Account manager', value: '{{ account_manager.name }}' },
  { name: 'Renewal date', value: '{{ subscription.renewal_date }}' },
]

// `type` groups links in the builder UI. `label` is the default link text when nothing is selected.
const SPECIAL_LINK_CATALOG = [
  { type: 'Account', label: 'Unsubscribe', link: '{{ unsubscribe_url }}' },
  { type: 'Account', label: 'Manage preferences', link: '{{ preferences_url }}' },
  { type: 'Email', label: 'View in browser', link: '{{ web_version_url }}' },
  { type: 'Email', label: 'Forward to a friend', link: '{{ forward_url }}' },
  { type: 'Products', label: 'Rocket starter kit', link: 'https://example.com/products/rocket?utm_campaign={{ campaign.id }}' },
  { type: 'Products', label: 'Globe travel bundle', link: 'https://example.com/products/globe?utm_campaign={{ campaign.id }}' },
]

// Native <dialog> with a filter box over a list. Resolves the picked item, or null when cancelled.
// Enter picks the first visible item, Escape cancels.
function pickFromCatalog(title, items, describe) {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog')
    dialog.innerHTML =
      '<form method="dialog" style="display:grid;gap:10px;min-width:360px;font-family:system-ui,sans-serif">' +
      '<strong></strong>' +
      '<input type="search" placeholder="Type to filter" style="padding:6px">' +
      '<ul style="list-style:none;margin:0;padding:0;max-height:240px;overflow:auto"></ul>' +
      '<div style="text-align:right"><button value="cancel">Cancel</button></div></form>'
    dialog.querySelector('strong').textContent = title
    const input = dialog.querySelector('input')
    const list = dialog.querySelector('ul')
    let picked = null

    function render() {
      const q = input.value.trim().toLowerCase()
      list.innerHTML = ''
      items
        .filter(item => !q || describe(item).toLowerCase().includes(q))
        .forEach(item => {
          const button = document.createElement('button')
          button.type = 'button'
          button.textContent = describe(item)
          button.style.cssText = 'display:block;width:100%;text-align:left;padding:6px;border:0;background:none;cursor:pointer'
          button.addEventListener('click', () => { picked = item; dialog.close('ok') })
          list.appendChild(document.createElement('li')).appendChild(button)
        })
    }
    input.addEventListener('input', render)
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      const first = list.querySelector('button')
      if (first) first.click()
    })
    render()

    dialog.addEventListener('close', () => {
      dialog.remove()
      resolve(dialog.returnValue === 'ok' ? picked : null)
    })
    document.body.appendChild(dialog)
    dialog.showModal()
    input.focus()
  })
}

// Merges the content dialog keys into an existing beeConfig and returns it.
// Keeps a contentDialog already present (for example saveRow from the saved rows skill).
function withContentDialog(beeConfig) {
  // The first entries of each catalog go into the plain config arrays, so the toolbar buttons exist
  // and the most used items are one click away. The dialog covers the whole catalog.
  beeConfig.mergeTags = (beeConfig.mergeTags || []).concat(MERGE_TAG_CATALOG.slice(0, 2))
  beeConfig.specialLinks = (beeConfig.specialLinks || []).concat(SPECIAL_LINK_CATALOG.slice(0, 2))

  beeConfig.contentDialog = Object.assign({}, beeConfig.contentDialog, {
    mergeTags: {
      label: 'Search all merge tags',
      handler: function (resolve, reject) {
        // Every path ends in resolve or reject, otherwise the builder stays in waiting mode.
        pickFromCatalog('Merge tags', MERGE_TAG_CATALOG, tag => tag.name + '  ' + tag.value)
          .then(tag => (tag ? resolve(tag) : reject()))
          .catch(() => reject())
      },
    },
    specialLinks: {
      label: 'Find a link',
      handler: function (resolve, reject) {
        pickFromCatalog('Special links', SPECIAL_LINK_CATALOG, link => link.type + ': ' + link.label)
          .then(link => (link ? resolve(link) : reject()))
          .catch(() => reject())
      },
    },
  })
  return beeConfig
}
