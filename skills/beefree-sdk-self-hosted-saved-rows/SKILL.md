---
name: beefree-sdk-self-hosted-saved-rows
license: Apache-2.0
description: Add self-hosted Saved Rows to a Beefree SDK integration (Core plan and above). End users click Save on a row, the host app stores the row JSON in its own backend and feeds it back through the Rows tab, with rename and delete. Use when the user mentions saved rows, reusable rows, save a row for later, saveRows, onSaveRow, getRows or the saveRow content dialog for Beefree SDK. Hosted Saved Rows is a console toggle, not this skill. Ready-made rows served by the host app are beefree-sdk-custom-rows.
metadata:
  author: Beefree SDK
  version: "0.1.5"
  last-verified: "2026-09-03"
  docs: https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/save/implement-self-hosted-saved-rows?from=skill
---

# Beefree SDK self-hosted saved rows

Let end users save a row, store it in the host app's own storage, and drag it back into any design from the Rows tab.

Requires a working Beefree SDK integration.
If the builder does not run yet, use the `beefree-sdk-setup` skill first.

## Step 1: check the plan

Saved Rows are available on **Core** (tier 30), **Superpowers** and **Enterprise**.

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
   "Self-Hosted Saved Rows is available on Core and above, so it isn't included in the Free plan, but we'd love for you to try it. You can request a no-charge proof of concept (PoC) trial to get access while you build: <https://developers.beefree.io/talk-to-sales?from=skill>
   If you'd rather move to a paid plan now, you can upgrade the application in the Developer Console."

## Step 2: hosted or self-hosted

Ask before building, unless the request already rules one path out.
Two storage paths exist and only one is this skill.

- **Hosted Saved Rows.** Beefree stores the rows and ships the whole UI: save, categories, rename, delete.
  Enabled with one toggle in the Developer Console, **Application configuration → Saved Rows → Hosted on the Beefree SDK Infrastructure**.
  Per-row allotment and extra fees apply, see <https://docs.beefree.io/beefree-sdk/rows/storage/hosted-saved-rows?from=skill>.
  No code beyond `saveRows: true`.
  If the user wants the fastest path and has no compliance reason to own the data, recommend this and stop here.
- **Self-hosted Saved Rows.** The host app stores the rows, builds the save and rename dialogs, and serves the rows back.
  Pick it when the user needs the data in their own database, wants to filter rows per customer or per user, or already has a rows backend.
  The rest of this skill is this path.

## Step 3: turn the feature on in the Developer Console

Manual step, the user does it.
Without it the Save icon never appears and none of the hooks fire.

1. <https://developers.beefree.io/apps/?from=skill>, pick the application, click **Details**.
2. **Application configuration → View more → Saved Rows**.
3. Toggle on **Self-hosted on your own infrastructure**, click **Save**.

Use the same application whose credentials are in `.env`.

## Step 4: the pieces to wire

Everything goes into `beeConfig`.
Details and the official snippets are in [self-hosted-saved-rows.md](references/self-hosted-saved-rows.md).

| Piece                                  | Purpose                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `saveRows: true`                       | Shows the Save icon on the selected row. Set `false` per user to hide it.                          |
| `contentDialog.saveRow.handler`        | Mandatory. Asks the user for a name, resolves `{ name, guid }`. The builder writes it into the row's `metadata`. |
| `onSaveRow(rowJSON, rowHTML, pageJSON)`| Fires after the dialog. Store `rowJSON`, it already carries the metadata.                          |
| `rowsConfiguration.externalContentURLs`| One entry per list shown in the Rows tab. With `isLocal: true` and a `handle`, the builder asks the `getRows` hook instead of fetching a URL. |
| `hooks.getRows.handler`                | Resolves an array of saved rows for `args.handle`.                                                 |
| `contentDialog.onEditRow.handler`      | Rename. Update storage, `resolve(true)` to refresh the list.                                       |
| `contentDialog.onDeleteRow.handler`    | Delete. Remove from storage, `resolve(true)` to refresh the list.                                  |
| `behaviors: { canEdit, canDelete }`    | Per list, shows or hides the row menu actions.                                                     |

Storage contract, the minimum that works:

- Save the whole row JSON as returned by `onSaveRow`. Do not build rows by hand, the schema is not published.
- Key it by `metadata.guid`. Saving a row that already has a `guid` overwrites the earlier version.
- `metadata.name` is the only required field. Add `category`, `userId`, `dateModified` when the app needs them.
- Return rows to `getRows` as an array of those JSON objects.

## Step 5A: add it to the setup demo

Ready-made files live in `assets/demo/`, written for the `beefree-sdk-setup` demo.

1. Copy `assets/demo/rows-api.js` next to `server.js`, and `assets/demo/public/saved-rows.js` into `public/`.
2. Mount the API in `server.js`: add the require at the top and one route before the static handler.

   ```javascript
   const { handleRows } = require('./rows-api')
   // inside http.createServer, before the GET/HEAD static branch:
   if (req.url === '/api/rows' || req.url.startsWith('/api/rows/')) return handleRows(req, res)
   ```

3. Load the script in `public/index.html`, before `app.js`:

   ```html
   <script src="saved-rows.js"></script>
   ```

4. In `public/app.js`, wrap the config where the builder is created:

   ```javascript
   BeePlugin.create(token, withSavedRows(beeConfig), function (instance) {
   ```

5. Add `rows.json` to the demo `.gitignore`. It is the storage file and is created on the first save.
6. `npm start`, open <http://localhost:3000>.

Storage is a JSON file next to `server.js`, shared by every `uid`.
Good for one developer on one machine, not for production.

## Step 5B: existing app

Stay framework-neutral and port the two demo files.

- **Backend.** Three routes: `GET /api/rows` returns the array, `POST /api/rows` upserts one row by `metadata.guid`, `DELETE /api/rows/:guid` removes it.
  `rows-api.js` is the reference implementation, 60 lines, one function per route.
  Scope rows by the authenticated user or account when the app has more than one.
- **Frontend.** `saved-rows.js` is framework-free: a native `<dialog>` for the name prompt and the config keys from Step 4.
  In React, keep the handlers outside component state or pass fresh arrays to `resolve`, the docs warn about stale rows.
- **Categories.** One `externalContentURLs` entry per category, each with its own `handle`, and filter by `args.handle` in `getRows`.
  Rebuild the list with `instance.loadConfig({ rowsConfiguration })` when a category is added.

## Step 6: verify

1. The builder loads. Select a row: a **Save** icon appears in the row toolbar and in the row properties panel.
2. Click it, type a name, confirm. The dialog closes and no error shows in the console.
   The server logs the `POST /api/rows`.
3. Open the **Rows** tab, pick **Saved rows** in the dropdown. The row is listed with its name. Drag it into the design.
4. Use the row card menu to rename and delete. The list refreshes each time.
5. Restart the server. The rows are still there.

| Symptom                                       | Likely cause and fix                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| No Save icon on rows                          | Console toggle off (Step 3), `saveRows` missing or `false`, or plan below Core.                 |
| Save icon present, click does nothing         | `contentDialog.saveRow` missing. It is mandatory.                                              |
| Dialog closes, row not stored                 | `onSaveRow` missing, or the POST failed. Check the server log.                                 |
| Enter in the name dialog cancels              | Cancel is a submit button, so Enter presses it first. Give it `type="button"`, as `saved-rows.js` does. |
| List is empty after saving                    | `getRows` rejected or resolved something that is not an array. `isLocal: true` and `handle` must both be set. |
| Rename or delete menu missing                 | `behaviors.canEdit` / `canDelete` not `true` on that list entry.                               |
| Rows appear only after a search               | The panel shows 30 rows per list by default. Raise `maxRowsDisplayed`.                          |
| Save icon visible but locked                  | `advancedPermissions.rows.toolbar.save.locked` is `true`.                                      |

## References

- [self-hosted-saved-rows.md](references/self-hosted-saved-rows.md): console toggle, workflow, config keys, metadata, hooks, chunking, management actions, permissions, hosted comparison.
- Official docs: <https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/save/implement-self-hosted-saved-rows?from=skill>.
- Official tutorial: <https://docs.beefree.io/beefree-sdk/rows/reusable-content/create/save/implement-self-hosted-saved-rows/self-hosted-saved-rows-concepts-and-tutorial?from=skill>.
- Official webinar sample, React: <https://github.com/BEE-Plugin/bee-plugin-webinars-demo-code/tree/master/saved-rows>.
