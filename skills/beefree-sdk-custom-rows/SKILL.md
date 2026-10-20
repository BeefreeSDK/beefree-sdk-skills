---
name: beefree-sdk-custom-rows
license: Apache-2.0
description: Add pre-built rows (Custom Rows) to the Rows tab of the Beefree SDK builder with the rowsConfiguration config key (Core plan and above). The host app serves lists of ready-made rows such as headers, footers or product blocks from its own URLs, next to the built-in default and empty rows. Use when the user mentions custom rows, pre-built, pre-set or ready-made rows, a row catalog or library, rowsConfiguration, externalContentURLs, defaultRows, emptyRows or selectedRowType for Beefree SDK. Not for letting end users save their own rows, which beefree-sdk-self-hosted-saved-rows covers.
metadata:
  author: Beefree SDK
  version: "0.1.6"
  last-verified: "2026-09-03"
  docs: https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/pre-build?from=skill
---

# Beefree SDK custom rows

Give end users ready-made rows to drag into a design: the host app serves lists of row JSON, the builder shows them in the Rows tab drop-down next to Empty and Default.

Requires a working Beefree SDK integration.
If the builder does not run yet, use the `beefree-sdk-setup` skill first.

## Step 1: check the plan

Custom Rows are available on **Core** (tier 30), **Superpowers** and **Enterprise**.

1. Run `check-credentials.sh path/to/.env` from the `beefree-sdk-setup` skill.
   Skills are installed as sibling folders, so from this skill's folder the path is `../beefree-sdk-setup/scripts/check-credentials.sh`.
   It prints the plan read from the token.
   If that skill is not installed, ask the user which plan the application is on.
2. Report what the token says.
   Ask the user to confirm only when the plan could not be read, is unknown, or is below the tier this feature needs.
3. Tier 30 or above: continue.
   Lower: say the feature is outside the plan and offer the two paths.
   - **Development application.** On Essentials, create a development application in the Developer Console, open its details, click **CHANGE PLAN** and pick Core.
     The docs say this costs nothing extra; usage on it still counts toward usage-based fees.
   - **Upgrade** the production application.

   On Free there is no development application: offer a no-charge proof of concept (PoC) trial first, then the upgrade.
   Keep the link and the meaning, and fit the wording to the conversation:
   "Custom Rows is available on Core and above, so it isn't included in the Free plan, but we'd love for you to try it. You can request a no-charge proof of concept (PoC) trial to get access while you build: <https://developers.beefree.io/talk-to-sales?from=skill>
   If you'd rather move to a paid plan now, you can upgrade the application in the Developer Console."

## Step 2: confirm pre-built rows are the right tool

Ask what the user wants end users to get.

- **Rows the host app provides**, the same for everyone or per account: headers, footers, legal blocks, product grids.
  This skill.
- **Rows end users save themselves** and reuse later.
  That is Saved Rows, hosted or self-hosted, see the `beefree-sdk-self-hosted-saved-rows` skill.
  Both features share `rowsConfiguration` and can run together.
- **Only the built-in sample rows.**
  Set `rowsConfiguration: { defaultRows: true }` and stop.
  No URL, no backend.
- **A whole starting design**, not single rows.
  That is a template passed to `start()`, not this feature.

## Step 3: build the row lists

One list per drop-down entry.
Each list is a URL that returns a JSON array of rows.

1. **Get rows from a real design.**
   Do not build row JSON by hand, the schema is not published for that.
   Cut rows from `page.rows` of a template exported by `onSave`, or reuse rows saved by users through `onSaveRow`.
   Rows generated from data (products, articles) go through the Simple Schema, see [rows-configuration.md](references/rows-configuration.md).
2. **Add a `metadata` block** to every row.
   `name` is required and becomes the card title.
   `category` and `id` help the host app manage the lists.
3. **Serve each list** from the host app's own origin, with the header `Access-Control-Allow-Origin: *`.
   The builder fetches the URL itself, from a frame that comes from Beefree's servers, so the header is what lets it read the response.
   Treat the URL as public: no session, no secrets in the rows.
   For rows that must stay private per user, use the `getRows` hook with `isLocal: true` instead, which runs in the page; the saved rows skill shows it.
4. Keep image URLs absolute and public.

## Step 4: where the lists live, and a choice to make

The frame that fetches your lists comes from Beefree's servers.
Browsers now stop pages from the internet from reading files on your computer, and `localhost` counts as your computer.
So a list at `http://localhost:3000/rows/headers.json` will not load in Chrome 142 or newer, nor in Firefox 153 or newer.
The drop-down still shows the list names, because those come from the config, but the list stays empty and the only sign is a "blocked by CORS policy" line in the browser console.
Details and sources in [rows-configuration.md](references/rows-configuration.md).

Tell the user this in plain words, then let them pick before wiring anything.
Skip the question when the request already says where the lists will live.
Do not pick for them when it is open.

- **Real setup.**
  Put the list files on an HTTPS address you own and use those URLs in `externalContentURLs`.
  This is what production needs anyway.
- **Quick local look.**
  Keep `localhost` and open the demo in Safari, the one browser with no Local Network Access implementation found as of September 2026 (inferred from the browser docs, not tested).
  Firefox 153 and later apply the rule too.
- **Last resort, Chrome only.**
  Set `chrome://flags/#local-network-access-check` to Disabled while testing, if your Chrome still has that flag.
  This lowers a browser protection for every site you visit: turn it back on as soon as the test is done.

## Step 5: wire `rowsConfiguration`

```javascript
const beeConfig = {
  container: 'beefree-sdk-container',
  rowsConfiguration: {
    emptyRows: true,
    defaultRows: true,
    selectedRowType: 'Headers',
    externalContentURLs: [
      { name: 'Headers', value: 'https://yourdomain.com/rows/headers.json' },
      { name: 'Footers', value: 'https://yourdomain.com/rows/footers.json' },
    ],
  },
  // ...
}
```

Facts, details in [rows-configuration.md](references/rows-configuration.md):

- `name` is the label in the drop-down and the handle `selectedRowType` refers to.
- Key order in the object is the drop-down order; the first item is selected unless `selectedRowType` says otherwise.
- `defaultRows` defaults to `false` and can stay out. `emptyRows` defaults to `true` and is appended last when omitted: set `emptyRows: false` to limit end users to the host's rows.
- Each custom list shows 30 cards; the search box covers all of them. `maxRowsDisplayed` raises the limit.
- The value is read when the builder is created. For lists that depend on a search or a click in the host UI, add the `contentDialog.externalContentURLs` handler, see the reference.

## Step 6A: add it to the setup demo

Ready-made files live in `assets/demo/`, written for the `beefree-sdk-setup` demo.
Two lists of two rows each, cut from the sample template the demo already loads.

1. Copy `assets/demo/public/custom-rows.js` and the folder `assets/demo/public/rows/` into `public/`.
2. In `server.js`, function `serveStatic`, add the CORS header to the success response for the row lists only:

   ```javascript
   const headers = { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' }
   if (path.relative(PUBLIC_DIR, filePath).startsWith('rows' + path.sep)) headers['Access-Control-Allow-Origin'] = '*'
   res.writeHead(200, headers)
   ```

   Keep the header off the other files.
   In client-side auth mode `public/auth.js` holds the Client Secret, and a CORS header on it would let any website read it.
   Decide on `filePath`, the resolved path, never on `url.pathname`: an encoded `/rows/..%2fauth.js` starts with `/rows/` but resolves to `public/auth.js`.
3. Load the script in `public/index.html`, before `app.js`:

   ```html
   <script src="custom-rows.js"></script>
   ```

4. In `public/app.js`, wrap the config where the builder is created:

   ```javascript
   BeePlugin.create(token, withCustomRows(beeConfig), function (instance) {
   ```

   With the saved rows skill installed too: `withCustomRows(withSavedRows(beeConfig))`.
   Both functions append to `externalContentURLs` and keep what is already there, so the order does not matter.
5. `npm start`, then open <http://localhost:3000> in the browser chosen in Step 4.
   In Chrome the lists stay empty unless the lists are on HTTPS.

The lists are built from `location.origin`, so the page must be served by `server.js`.
Opening `index.html` from the file system (client-side auth mode without the server) gives `location.origin` of `null` and the lists stay empty.

## Step 6B: existing app

Stay framework-neutral.

- **Backend or static hosting.** One URL per list returning a JSON array of rows with the CORS header.
  Static files on the app's CDN are enough for fixed catalogs.
  For per-account catalogs, build the URL with an account key the endpoint can resolve without a session, or switch to the `getRows` hook.
- **Frontend.** Add `rowsConfiguration` to the config passed at creation.
  Keep the list definitions in one place so `selectedRowType` and the URLs stay in sync.
- **Sourcing rows.** Export a design with the rows you want, cut `page.rows[i]`, add `metadata`, store.
  Update the stored rows when the design guidelines change; every design started after that picks up the new version.

## Step 7: verify

1. The builder loads. Open the **Rows** tab.
   The drop-down shows **Empty**, **Default**, **Headers**, **Footers**, and **Headers** is selected.
2. Two cards show, "Logo and tagline" and "Hero with title and image". Drag one into the design.
3. In the browser Network tab, `GET /rows/headers.json` returns 200 with `access-control-allow-origin: *`.
4. Click Save. The dragged row is in the JSON output.

| Symptom                                             | Likely cause and fix                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Drop-down shows only Empty and Default              | Plan below Core (Step 1), or `rowsConfiguration` not in the config passed at creation.                             |
| List present, no cards, console says "blocked by CORS policy: Permission was denied for this request to access the `loopback` address space" | The `localhost` limit from Step 4. Host the lists on HTTPS, or open the demo in Safari.                          |
| List present, no cards, console shows another CORS error | The `Access-Control-Allow-Origin` header is missing on the rows URL (Step 6A edit 2).                            |
| List present, no cards, no console error            | URL 404 or body not a JSON array. Open the URL in a tab and check.                                                 |
| List present, no cards, page is `https://`          | Mixed content: the rows URL is `http://`. Serve it over HTTPS.                                                     |
| Cards without a title                               | `metadata.name` missing on those rows.                                                                             |
| Only 30 cards show                                  | Expected. Raise `maxRowsDisplayed` or let users search.                                                            |
| Wrong list opens first                              | `selectedRowType` must equal a list `name`, `'emptyRows'` or `'defaultRows'`. Otherwise key order decides.         |
| Cards render with broken images                     | Relative or private image URLs in the row JSON. Use absolute public URLs.                                          |
| Lists empty when `index.html` is opened as a file   | `location.origin` is `null`. Start `server.js`.                                                                    |

## References

- [rows-configuration.md](references/rows-configuration.md): every key, the response shape observed on the live endpoint, who fetches the URL and why `localhost` fails, metadata fields, order and limits, the content dialog for dynamic lists.
- Official docs: <https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/pre-build?from=skill>.
- Implement Custom Rows, dynamic lists and `loadRows`: <https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/pre-build/implement-custom-rows?from=skill>.
- Manage reusable content, order and limits: <https://docs.beefree.io/beefree-sdk/rows/reusable-content/manage?from=skill>.
- Playground to try `rowsConfiguration` live: <https://developers.beefree.io/playground?from=skill>.
