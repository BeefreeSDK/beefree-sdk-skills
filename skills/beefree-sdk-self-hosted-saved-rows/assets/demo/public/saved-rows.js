// Self-hosted saved rows for the Beefree SDK demo page.
// Adds the Save icon on rows, a "Saved rows" list in the Rows tab, and rename and delete on each card.
// Requires: rows-api.js mounted at /api/rows in server.js. Load this file before app.js, then:
//   BeePlugin.create(token, withSavedRows(beeConfig), ...)

const ROWS_API = '/api/rows'

async function rowsApi(method, suffix, body) {
  const res = await fetch(ROWS_API + suffix, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error('rows API ' + res.status)
  return res.status === 204 ? null : res.json()
}

// Native <dialog> asking for a row name. Resolves the trimmed name, or null when cancelled.
// Cancel is not a submit button: Enter in the field presses the first submit button, which must be Save.
function askRowName(current) {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog')
    dialog.innerHTML =
      '<form method="dialog" style="display:grid;gap:12px;min-width:280px;font-family:system-ui,sans-serif">' +
      '<label>Row name<br><input name="name" required style="width:100%;padding:6px"></label>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button type="button" data-cancel>Cancel</button>' +
      '<button value="ok">Save</button></div></form>'
    const input = dialog.querySelector('input')
    input.value = current || ''
    dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close('cancel'))
    dialog.addEventListener('close', () => {
      const name = dialog.returnValue === 'ok' ? input.value.trim() : ''
      dialog.remove()
      resolve(name || null)
    })
    document.body.appendChild(dialog)
    dialog.showModal()
  })
}

// Merges the saved rows keys into an existing beeConfig and returns it.
// Keeps what is already in rowsConfiguration, hooks and contentDialog (for example the lists of the
// custom rows skill or the handlers of the content dialog skill), so the wrappers compose in any order.
function withSavedRows(beeConfig) {
  beeConfig.saveRows = true

  const rows = beeConfig.rowsConfiguration || {}
  beeConfig.rowsConfiguration = Object.assign({ emptyRows: true, defaultRows: true }, rows, {
    // Demo shortcut: one list. For categories, add one entry per category with its own handle and filter by args.handle in getRows.
    externalContentURLs: (rows.externalContentURLs || []).concat([
      { name: 'Saved rows', value: 'saved-rows', handle: 'saved-rows', isLocal: true, behaviors: { canEdit: true, canDelete: true } },
    ]),
  })

  beeConfig.hooks = Object.assign({}, beeConfig.hooks, {
    getRows: {
      handler: async function (resolve, reject) {
        try {
          resolve(await rowsApi('GET', ''))
        } catch (err) {
          reject(err.message)
        }
      },
    },
  })

  // Every handler ends in resolve or reject, otherwise the builder stays in waiting mode.
  beeConfig.contentDialog = Object.assign({}, beeConfig.contentDialog, {
    // Mandatory. Collects the metadata the builder writes into the row before onSaveRow fires.
    saveRow: {
      handler: async function (resolve, reject, args) {
        const current = (args && args.metadata) || {}
        const name = await askRowName(current.name)
        if (!name) return reject()
        // Keeping an existing guid overwrites that saved row; a new guid creates a new one.
        resolve({ name: name, guid: current.guid || crypto.randomUUID() })
      },
    },
    onEditRow: {
      handler: async function (resolve, reject, args) {
        try {
          const row = args.row
          const name = await askRowName(row.metadata.name)
          if (!name) return reject()
          await rowsApi('POST', '', Object.assign({}, row, { metadata: Object.assign({}, row.metadata, { name: name }) }))
          resolve(true) // true refreshes the list
        } catch (err) {
          reject({ error: { message: 'Rename failed', detail: err.message } })
        }
      },
    },
    onDeleteRow: {
      handler: async function (resolve, reject, args) {
        try {
          await rowsApi('DELETE', '/' + encodeURIComponent(args.row.metadata.guid))
          resolve(true)
        } catch (err) {
          reject({ error: { message: 'Delete failed', detail: err.message } })
        }
      },
    },
  })

  // rowJSON already carries the metadata resolved by the saveRow dialog. It arrives as a string.
  beeConfig.onSaveRow = async function (rowJSON) {
    const row = typeof rowJSON === 'string' ? JSON.parse(rowJSON) : rowJSON
    await rowsApi('POST', '', row)
  }

  return beeConfig
}
