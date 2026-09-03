---
name: beefree-sdk-content-dialog
license: MIT
description: Add a Content Dialog to a Beefree SDK integration (Essentials plan and above) so end users pick merge tags, special links, dynamic content, display conditions, custom rows, attributes, videos or files through the host app's own UI instead of a fixed list. Covers the handler contract, the value shape of every handler and a search dialog for the setup demo. Use when the user mentions contentDialog, content dialog, a merge tag search, a product link picker, too many merge tags or special links for a list, a custom file picker, or wants their own modal inside the Beefree SDK builder. Saving rows, pre-built rows and display conditions have their own skills.
metadata:
  author: Beefree SDK
  version: "0.1.1"
  last-verified: "2026-09-03"
  docs: https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/content-dialog
---

# Beefree SDK content dialog

Let the host app supply content to the builder through its own UI.
The builder shows a label the app chooses, the user clicks it, the app opens whatever it wants, and hands one value back.
One contract for merge tags, links, dynamic content, display conditions, rows, attributes, videos and files.

Requires a working Beefree SDK integration.
If the builder does not run yet, use the `beefree-sdk-setup` skill first.

## Step 1: check the plan

The Content Dialog is available on **Essentials** (tier 20) and above.
Some handlers extend a feature with a higher plan or a Developer Console switch; Step 3 says which.

1. Run `check-credentials.sh path/to/.env` from the `beefree-sdk-setup` skill.
   Skills are installed as sibling folders, so from this skill's folder the path is `../beefree-sdk-setup/scripts/check-credentials.sh`.
   It prints the plan read from the token.
   If that skill is not installed, ask the user which plan the application is on.
2. Report what the token says.
   Ask the user to confirm only when the plan could not be read, is unknown, or is below the tier this feature needs.
3. Tier 20 or above: continue.
   Free: say the feature is outside the plan. There is no development application on Free, so the only path is an upgrade.

## Step 2: confirm a dialog is the right tool

Ask how many items the user has and where they come from, unless the request already says.

- **A short, fixed list** of merge tags or special links, say under twenty.
  No dialog. Put them in the `mergeTags` and `specialLinks` arrays of `beeConfig` and stop.
  See [content-dialog.md](references/content-dialog.md) for the shapes.
- **Many items, a search, categories, or data that depends on context** (the selected campaign, the user's account).
  The dialog. The docs recommend both together: frequent items in the arrays, the long tail behind the dialog.
- **The app already has a picker** users know, and the builder should reuse it.
  The dialog.
- **Hiding or locking builder features.** Not this. Advanced Permissions covers it.
- **Beefree calling the app's file storage server to server.** Not this. That is Custom File Storage, a console setting and a backend API.
  The `filePicker` handler here is the opposite direction: host UI that returns a URL.

## Step 3: pick the handlers

| Handler                | End user sees                                        | Resolve with                                  | Needs beyond Essentials                                    |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `mergeTags`            | A button with your label in the text toolbar, next to **Merge tags** | `{ name, value }`             |                                                            |
| `specialLinks`         | A link with your label next to **Special links** under the Url field of buttons, images and text links | `{ type, label, link }` |                                              |
| `mergeContents`        | A button in the dynamic content properties           | `{ name, value }`                             | One item in `mergeContents` so the tile exists             |
| `rowDisplayConditions` | A button in the row's display condition widget       | `{ type, label, description, before, after }` | Core, console **Services → Display Conditions** on         |
| `externalContentURLs`  | A last item in the Rows drop-down                    | `{ name, value }`, a rows URL                 | Core. Use `beefree-sdk-custom-rows`                        |
| `saveRow`, `onEditRow`, `onDeleteRow`, `editSyncedRow` | Save icon and row card menu | metadata, `true`                    | Core. Use `beefree-sdk-self-hosted-saved-rows`             |
| `manageForm`           | A button in the form block properties                | a form structure                              | Page or Popup builder                                      |
| `customAttribute`      | A button in link and image attribute editors         | `{ key, name, value, target }`                | Core, Custom Attributes                                    |
| `addVideo`             | A custom source in the video block                   | `{ videoSrc, thumbSrc, thumbAlt }`            |                                                            |
| `filePicker`           | The Browse button of image and file fields           | `{ url }`                                     | Superpowers, Custom File Picker                            |

Every handler, its `args` and the exact value shape are in [content-dialog.md](references/content-dialog.md).
Start with one or two. Adding a handler later is one more key in the same object.

## Step 4: the contract

```javascript
contentDialog: {
  mergeTags: {
    label: 'Search all merge tags',
    handler: function (resolve, reject) {
      openYourPicker()
        .then(item => resolve(item))   // { name, value }
        .catch(() => reject())         // cancel, the builder resumes
    },
  },
},
```

Rules that matter in practice:

- **Always end with `resolve` or `reject`.** The builder blocks editing while it waits. A handler that throws, or a modal closed without calling either, leaves it blocked.
  Wrap the logic and call `reject()` on any error and on cancel.
- The value must have the shape of one entry of the matching `beeConfig` array. A wrong shape logs `Error getting content <handler>, the item is malformed.` in the console, shows nothing in the UI, and inserts nothing.
- The handler runs in the host page. Any UI works, and a fetch to the app's backend carries the app's session. No CORS or `localhost` trouble, unlike a rows URL.
- `label` is the text the user clicks. Use the words of the app, not "content dialog".
- Set `loadingSpinnerDisableOnDialog: true` in `beeConfig` if the builder's spinner gets in the way of the app's modal.

## Step 5A: add it to the setup demo

Ready-made file in `assets/demo/`, written for the `beefree-sdk-setup` demo.
A native `<dialog>` with a filter box over a static catalog of ten merge tags and six special links.
Nothing changes in `server.js`.

1. Copy `assets/demo/public/content-dialog.js` into `public/`.
2. Load it in `public/index.html`, before `app.js`:

   ```html
   <script src="content-dialog.js"></script>
   ```

3. In `public/app.js`, wrap the config where the builder is created:

   ```javascript
   BeePlugin.create(token, withContentDialog(beeConfig), function (instance) {
   ```

   With other feature skills installed, chain the wrappers: `withContentDialog(withSavedRows(beeConfig))`.
   Each one merges into `contentDialog` and keeps what is already there.
4. `npm start`, open <http://localhost:3000>.

The file also puts the first two catalog items into `mergeTags` and `specialLinks`, so the toolbar buttons exist and the frequent items are one click away.
To use the app's own data, replace the two catalog arrays with a fetch inside the handler; the dialog code stays.

## Step 5B: existing app

Stay framework-neutral and port the demo file.

- **Where the UI hooks in.** The handler is the bridge: it opens the app's modal, and the modal's confirm and cancel call `resolve` and `reject`.
  In React, keep the two functions in state or a ref and build `contentDialog` inside the component, as the official display conditions example does.
- **Backend search.** Fetch from the handler with the text the user typed. The request runs in the page, so cookies and app auth apply.
- **Frequent items** stay in the arrays. Keep the arrays and the dialog fed from the same source so a picked item can be shown by name when the design is reloaded.
- **Display conditions.** Turn the feature on in the Developer Console first (**Services → Display Conditions**), then add `rowDisplayConditions`. The third handler argument is the row's current condition, pass it to the builder UI so the user edits instead of starting over.

## Step 6: verify

Verified on 2026-09-03 with a Superpowers application, Chrome, Node 20.

1. The builder loads. Click into a text block or a button label.
   The text toolbar shows **Merge tags** and, next to it, **Search all merge tags**.
   In a narrow toolbar the second one sits under **More**.
2. Click **Search all merge tags**. The dialog opens, type `order`, press Enter. `{{ last_order.date }}` appears at the cursor.
3. Select a button. Under the Url field the panel shows **Special links | Link file | Find a link**.
   Click **Find a link**, type `rocket`, press Enter. The Url field fills with the product link.
4. Click **Search all merge tags** again and press Escape. The dialog closes and the builder is editable at once.
5. Click Save. The placeholder and the link are in the JSON and the HTML output.

The builder's own **Merge tags** menu and **Special links** menu list only the items from the config arrays.
The dialog label is a separate control, never an entry inside those menus.

| Symptom                                              | Likely cause and fix                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| No **Merge tags** button at all                      | No items in `mergeTags`. Keep at least one in the array; the dialog entry alone is not confirmed to show the button. |
| Looking for the label inside the Merge tags menu     | It is not there. The label is its own toolbar button, or under **More** when the toolbar is narrow.                 |
| No label button anywhere                             | Plan below Essentials (Step 1), or `contentDialog` not in the config passed at creation.                           |
| Builder stays blocked after the dialog               | The handler never called `resolve` or `reject`. Check every path, including errors and closing the modal.          |
| Console says `the item is malformed`                 | Wrong value shape. Compare with the table in Step 3, key names matter.                                             |
| Dialog picked, nothing inserted, no error            | Text cursor was not in a text block, or the link editor was closed before the resolve. Retry with the field open.  |
| Own modal hidden behind the builder                  | Give it a `z-index` above the builder container. The demo's native `<dialog>` is in the top layer already.         |

## References

- [content-dialog.md](references/content-dialog.md): contract, waiting mode, validation, every handler with `args` and value shape, observations from the official examples, docs discrepancies.
- Official docs: <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/content-dialog>.
- Special links and merge tags: <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/special-links-and-merge-tags>.
- Custom file picker: <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/custom-file-picker>.
- Official example with a display conditions dialog, React: <https://github.com/BeefreeSDK/beefree-sdk-examples/tree/main/conditional-rows-example>.
- Official demos with saved and synced rows dialogs, React: <https://github.com/BeefreeSDK/beefree-sdk-demos>.
