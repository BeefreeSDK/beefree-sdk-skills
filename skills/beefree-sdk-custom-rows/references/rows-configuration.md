# Rows configuration

Source: <https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/pre-build#rows-configuration> (read on 2026-09-03),
with <https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/pre-build/implement-custom-rows>,
<https://docs.beefree.io/beefree-sdk/rows/reusable-content/manage>,
<https://docs.beefree.io/beefree-sdk/data-structures/row-metadata>
and <https://docs.beefree.io/beefree-sdk/rows/reusable-content> (playground snippet).

## Availability

Core plan and above.
A development application can be upgraded "at no extra charge" to try it; usage on it still counts toward usage-based fees and limits.

## The object

```javascript
const beeConfig = {
  container: 'beefree-sdk-container',
  rowsConfiguration: {
    emptyRows: true,
    defaultRows: true,
    selectedRowType: 'Headers',   // 'emptyRows', 'defaultRows' or the handle of a list below
    maxRowsDisplayed: 30,         // per custom list, default 30
    externalContentURLs: [
      { name: 'Headers', value: 'https://yourdomain.com/rows/headers.json' },
      { name: 'Footers', value: 'https://yourdomain.com/rows/footers.json' },
    ],
  },
}
```

| Key                   | Type    | Default | Meaning                                                                                                         |
| --------------------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `emptyRows`           | boolean | `true`  | The built-in empty structures, the same rows shown when `rowsConfiguration` is absent. Appended last when omitted. |
| `defaultRows`         | boolean | `false` | Built-in rows filled with sample text, images and buttons.                                                       |
| `selectedRowType`     | string  | first list | Which list the Rows tab opens on. `'emptyRows'`, `'defaultRows'`, or the handle of an `externalContentURLs` entry. |
| `externalContentURLs` | array   | `[]`    | One entry per custom list. `name` is the drop-down label, `value` the URL the builder fetches.                  |
| `maxRowsDisplayed`    | number  | `30`    | Cards shown per custom list before the user searches. Does not affect Empty and Default.                       |

The docs call the `externalContentURLs` entry's identifier its **handle** and say it is "typically the `name`".
Entries fed by the `getRows` hook carry an explicit `handle` field plus `isLocal: true`; that path is covered by the `beefree-sdk-self-hosted-saved-rows` skill.
`rowsConfiguration` is listed on the configuration parameters page with no plan; the plan comes from the pricing page and the rows pages.

## What the URL must return

A JSON array of row objects.

```json
[
  {
    "metadata": { "name": "Logo and tagline", "category": "headers", "id": "header-01" },
    "columns": [ { "grid-columns": 6, "modules": [ /* ... */ ], "style": { /* ... */ } } ],
    "container": { "style": { /* ... */ } },
    "content": { /* ... */ },
    "type": "two-columns-empty"
  }
]
```

Observed on 2026-09-03 from the endpoint the docs use in the playground snippet, `https://bee-playground-backend.getbee.io/api/customrows?ids=1,2,3,4`:

- The body is a flat array of rows. The nested-array snippet on the Implement Custom Rows page is not what the live endpoint returns.
- Each row has `metadata`, `columns`, `container`, `content`, `type`, `locked`, `uuid`.
- The response carries `Access-Control-Allow-Origin: *` for every `Origin`.
  The docs do not mention CORS. The builder fetches the URL from its iframe, so the header is required and the URL is public. See the next section.

Row shape is the row node of a template JSON: `template.page.rows[i]`.
The docs say the schema is complex and recommend not building rows by hand.
Two safe sources:

- **Cut from a template.** Take a row from `page.rows` of a design exported by `onSave`, add a `metadata` block, store it. The demo lists are built this way from the sample template.
- **Saved by users.** Rows returned by `onSaveRow` already carry `metadata`. Serve them back per category.

For rows generated from data (products, articles) the docs point to the Simple Schema: <https://docs.beefree.io/beefree-sdk/data-structures/simple-schema/row-schema> and <https://github.com/BeefreeSDK/beefree-sdk-simple-schema>.

## Who fetches the rows URL, and why `localhost` fails

Observed on 2026-09-03, not stated in the Beefree docs.

The builder runs in an iframe whose origin is `https://app.getbee.io`.
That iframe requests every `externalContentURLs` value, not the host page.
Two consequences:

- The response needs `Access-Control-Allow-Origin` (`*`, or the builder origin), because it is a cross-origin `fetch`. Beefree's own rows endpoint sends `*`.
- Chrome 142 ships Local Network Access: a page on a public origin needs a permission before it can reach a loopback (`localhost`, `127.0.0.1`) or local-network address.
  The permission is a policy-controlled feature, `local-network-access`, whose default allowlist is `self`.
  A cross-origin iframe gets it only if the host page sets `allow="local-network-access"` on the `<iframe>` element, and the Beefree loader creates that element.

With the demo on `localhost` in Chrome 142 or newer, the list names show in the drop-down, the list stays empty, and the console reads:

```text
Access to fetch at 'http://localhost:3000/rows/headers.json' from origin 'https://app.getbee.io' has been blocked by CORS policy: Permission was denied for this request to access the `loopback` address space.
```

The CORS header does not help here: the message names CORS, but the block is the loopback permission.

What works:

- Lists on a public HTTPS origin, which is what production needs.
- The `getRows` hook with `isLocal: true` on the list entry: the handler runs in the host page, so the page fetches the rows from its own origin. This is the path of the `beefree-sdk-self-hosted-saved-rows` skill, not the URL path this skill teaches.
- Firefox and Safari, which do not implement Local Network Access at the time of writing (inferred from MDN marking the policy experimental and the explainer naming only Chrome; not tested).
- Last resort: Chrome with `chrome://flags/#local-network-access-check` set to Disabled, for testing only. It lowers a browser protection for every site, so turn it back on after the test. The flag name is from the Chrome blog; its presence in a given Chrome build is not guaranteed.

Sources, read on 2026-09-03:
<https://developer.chrome.com/blog/local-network-access>,
<https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/local-network-access>,
<https://github.com/WICG/local-network-access/blob/main/explainer.md>.

## Row metadata

| Field          | Required | Meaning                                                              |
| -------------- | -------- | -------------------------------------------------------------------- |
| `name`         | yes      | Card title in the Rows panel, also matched by the search box         |
| `category`     | no       | Grouping key for the host app                                        |
| `id`           | no       | Host-side identifier                                                 |
| `idParent`     | no       | Row this one was derived from                                        |
| `dateCreated`, `dateModified` | no | ISO 8601 timestamps                                       |
| `userId`       | no       | Owner                                                                |
| `tags`         | no       | Comma-separated keywords                                             |

Metadata is not rendered. Extra fields are allowed.

## Order, limits, search

- The drop-down lists row types in the order the keys appear in `rowsConfiguration`: write `defaultRows` before `emptyRows` to show Default first.
  Custom lists follow in their array order.
- The first item is selected when the Rows tab opens for the first time, unless `selectedRowType` says otherwise.
- `emptyRows` and `defaultRows` are optional. Custom lists alone are allowed, which limits end users to host-approved rows.
- No limit on rows per array, but the panel shows the first 30. The search box matches every row in the array, including hidden ones and image file names, and shows the first 30 matches. `maxRowsDisplayed` raises the 30.

## Dynamic lists through the content dialog

For a catalog too large for fixed lists, add an `externalContentURLs` handler under `contentDialog`.
It adds one item with your label at the bottom of the Rows drop-down.

```javascript
contentDialog: {
  externalContentURLs: {
    label: 'Search products',
    handler: function (resolve, reject) {
      // show your own search UI, then:
      resolve({ name: 'Your search results', value: 'https://yourdomain.com/rows?q=shoes' })
    },
  },
},
```

- Resolving with a `name` already in the drop-down replaces that list. A new `name` adds a list and keeps the earlier ones.
- Results appear highlighted in the Rows panel.
- `instance.loadRows()` opens the same dialog from the host app's own UI, for example a "Load footers" button in the toolbar. The handler can resolve at once without showing anything.

Source: <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/content-dialog>.

## Changing lists at run time

`instance.loadConfig({ rowsConfiguration })` is documented as a generic config update and is debounced when called in quick succession.
Adding a list this way is not verified in this skill.
The content dialog above is the documented way to add lists after start.
