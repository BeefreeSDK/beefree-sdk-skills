// Pre-built rows (Custom Rows) for the Beefree SDK demo page.
// Adds two lists to the Rows tab drop-down, "Headers" and "Footers", served as static JSON from public/rows/.
// Requires: server.js sends Access-Control-Allow-Origin on the files resolved under public/rows/ (see SKILL.md, Step 6A).
// Load this file before app.js, then:
//   BeePlugin.create(token, withCustomRows(beeConfig), ...)

// One entry per list. `name` is the label in the drop-down and the handle used by selectedRowType.
// `value` is the URL the builder fetches. It must return a JSON array of rows, each with metadata.name.
const CUSTOM_ROW_LISTS = [
  { name: 'Headers', value: location.origin + '/rows/headers.json' },
  { name: 'Footers', value: location.origin + '/rows/footers.json' },
]

// Merges the lists into an existing beeConfig and returns it.
// Keeps a rowsConfiguration already present (for example the saved rows list) and appends after it.
function withCustomRows(beeConfig) {
  const current = beeConfig.rowsConfiguration || {}
  beeConfig.rowsConfiguration = Object.assign({ emptyRows: true, defaultRows: true }, current, {
    selectedRowType: current.selectedRowType || CUSTOM_ROW_LISTS[0].name,
    externalContentURLs: (current.externalContentURLs || []).concat(CUSTOM_ROW_LISTS),
  })
  return beeConfig
}
