# Self-hosted saved rows

Source: <https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/save/implement-self-hosted-saved-rows?from=skill> (read on 2026-09-02),
with <https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/save/implement-self-hosted-saved-rows/self-hosted-saved-rows-concepts-and-tutorial?from=skill>,
<https://docs.beefree.io/beefree-sdk/rows/reusable-content/manage?from=skill>,
<https://docs.beefree.io/beefree-sdk/rows/storage?from=skill>,
<https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/content-dialog?from=skill#save-rows>
and <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/advanced-permissions?from=skill#lock-or-hide-the-save-icon>.

## Availability

Core plan and above.
A development application can be upgraded "at no extra charge" to try it; usage on it still counts toward usage-based fees and limits.

## Hosted versus self-hosted

| Aspect            | Hosted                                                       | Self-hosted                                              |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| Storage           | Beefree                                                      | The host app                                             |
| UI for end users  | Ready-made: save, categories, rename, delete                 | Built by the host app with Content Dialog                |
| Activation        | Console toggle **Hosted on the Beefree SDK Infrastructure**  | Console toggle **Self-hosted on your own infrastructure** |
| Cost              | Allotment per plan (Core 100, Superpowers 250, Enterprise 1000 rows), per-row fee above it, development applications included | No Beefree fee, own infrastructure |
| Permissions       | `advancedPermissions` keys `canDeleteHostedRow`, `canEditHostedRow`, `canManageHostedRowCategory`, `canAddHostedRowCategory` | `behaviors` per list, `advancedPermissions.rows.toolbar.save` |

## Console toggle

Developer Console → application **Details** → **Application configuration** → **View more** → **Saved Rows** → **Self-hosted on your own infrastructure** → **Save**.
The tutorial states that without this toggle none of the hooks or endpoints work.

## Workflow when the user clicks Save on a row

1. The builder opens the **saveRow content dialog** and passes the row's current `metadata` as `args`.
2. The host app collects at least a name and resolves a metadata object.
   `resolve(metadata, { synced: true })` marks the row as synced; omit the options for a plain saved row.
3. The builder writes the metadata into the row and calls `onSaveRow(rowJSON, rowHTML, pageJSON)`.
   - `rowJSON`: the row, with metadata. The webinar sample receives it as a string and parses it (observed, the docs do not say).
   - `rowHTML`: HTML preview of the row.
   - `pageJSON`: the row wrapped in a page, for editing it alone with Edit Single Row mode.
4. The host app stores the row and the builder refreshes the Rows panel.

## Config keys

```javascript
const beeConfig = {
  container: 'beefree-sdk-container',
  saveRows: true, // false hides the Save icon for this user
  contentDialog: {
    saveRow: {
      handler: function (resolve, reject, args) {
        // args = metadata already on the row, may be empty
        resolve({ name: 'Footer 2026', guid: 'abc-123' })
      }
    },
    onEditRow: {
      handler: async function (resolve, reject, args) {
        // args = { value, handle, row } ; row.metadata.guid identifies it
        resolve(true) // true refreshes the list, false keeps it
      }
    },
    onDeleteRow: {
      handler: async function (resolve, reject, args) {
        resolve(true)
      }
    }
  },
  onSaveRow: function (rowJSON, rowHTML, pageJSON) {
    // store rowJSON
  },
  rowsConfiguration: {
    emptyRows: true,
    defaultRows: true,
    maxRowsDisplayed: 40, // default 30, per list
    externalContentURLs: [
      {
        name: 'Saved rows',        // label in the Rows dropdown
        value: 'saved-rows',       // URL, or any string when isLocal
        handle: 'saved-rows',      // passed to getRows, onEditRow, onDeleteRow as args.handle
        isLocal: true,             // ask the getRows hook instead of fetching value
        behaviors: { canEdit: true, canDelete: true, canEditSyncedRows: false, canDeleteSyncedRows: false }
      }
    ]
  },
  hooks: {
    getRows: {
      handler: async function (resolve, reject, args) {
        // args = { value, handle } plus chunk when isChunked
        resolve([ /* row JSON objects */ ])
      }
    }
  }
}
```

The saveRow dialog has no `label`: its trigger is the Save icon.
It is a mandatory step of the workflow.

`onEditRow` and `onDeleteRow` can reject with a message the builder shows:

```javascript
reject({ warn: { message: 'Not allowed', detail: 'You cannot manage rows.' } })
// or { error: { message, detail } }
```

## Two ways to feed rows back

- **URL.** `value` is an `https://` URL that returns a JSON array of rows. The builder fetches it. The endpoint must be reachable from the browser without extra authentication.
  The request comes from the builder frame on `https://app.getbee.io`, so a `localhost` URL is blocked by Chrome's Local Network Access; the demo uses the hook for this reason.
- **Hook.** `isLocal: true` plus `handle`; the builder calls `hooks.getRows` and the host app resolves the array. No public endpoint, cookies and app auth apply.

Chunking, hook only: set `isChunked: true` (and optionally `chunkPageInterval`, default 1000 ms) on the list entry, read `args.chunk` (starts at 0) in `getRows`, resolve `[]` to stop.

## Row JSON and metadata

```javascript
[
  {
    metadata: {
      name: 'My row name',   // required, shown as the card title, used by search
      guid: 'abc-123',       // the docs' management examples use guid as the key
      category: 'Footers',   // recommended
      // id, idParent, dateCreated, dateModified, userId, tags: recommended by the docs
    },
    columns: { /* ... */ }
    // rest of the row
  }
]
```

The docs say the row schema is complex and recommend not building rows programmatically: store what `onSaveRow` gives you.
The metadata page lists `id` as recommended while the management examples read `metadata.guid`; the webinar sample uses `guid`.

## Lists, order, limits

- The Rows dropdown shows lists in the order of `emptyRows`, `defaultRows`, `externalContentURLs` as written in `rowsConfiguration`; the first one is selected by default.
- `emptyRows` and `defaultRows` are optional.
- Each list shows the first 30 rows; search covers all of them. `maxRowsDisplayed` raises the limit for custom lists.
- `selectedRowType: 'Saved rows'` pre-selects a list.

## Save icon permissions

```javascript
advancedPermissions: {
  rows: {
    toolbar: {
      save: { show: true, locked: false }
    }
  }
}
```

`show: false` hides the icon, `locked: true` shows it disabled.

## Editing a saved row on its own

Edit Single Row mode loads `pageJSON` from `onSaveRow` into a builder that edits one row: <https://docs.beefree.io/beefree-sdk/rows/reusable-content/sync/initialize-edit-single-row-mode?from=skill>.
Out of scope for this skill.
