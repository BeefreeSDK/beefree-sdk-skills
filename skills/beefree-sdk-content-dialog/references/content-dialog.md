# Content dialog

Source: <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/content-dialog> (read on 2026-09-03),
with <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/special-links-and-merge-tags>,
<https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/custom-file-picker>
and <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/display-conditions>.
Examples: <https://github.com/BeefreeSDK/beefree-sdk-examples/tree/main/conditional-rows-example> and <https://github.com/BeefreeSDK/beefree-sdk-demos> (read on 2026-09-03).

## Availability

The docs page says "paid plans only".
The pricing page row is "Dialogs For Content Search", Essentials and above.
Some handlers extend a feature with its own plan or console switch; the table below says which.

## The contract

```javascript
contentDialog: {
  <handlerName>: {
    label: 'Text shown in the builder UI',           // not for saveRow and filePicker, which use existing icons
    handler: function (resolve, reject, args) {      // args only for some handlers
      // open your UI, then exactly one of:
      resolve(value)                                 // value shape depends on the handler
      reject()                                       // cancel, the builder resumes
    },
  },
}
```

- The handler runs in the host page, so it can open any UI the app already has: a modal, a drawer, a search box.
- When the user clicks the label, the builder enters **waiting mode**, the same state as during a save. Editing is blocked until `resolve` or `reject` is called.
- **One of the two calls is mandatory.** A handler that throws or forgets leaves the builder in waiting mode. Wrap the logic and call `reject()` on any error.
- `resolve` at once, without UI, is allowed: the waiting mode is not perceived.
- The resolved value is validated against the shape of the matching `beeConfig` array. A wrong shape logs `Error getting content <handler>, the item is malformed.` in the console, with no visible notification, and nothing is inserted.
- There is no server-side setting. The dialogs can differ per user and per builder start.
- Any subset of handlers is allowed.
- `loadingSpinnerDisableOnDialog: true` in `beeConfig` removes the builder spinner while a dialog is open. Both official demos set it (observed, the docs list the key without detail).

## Handlers

| Handler                | Where the label shows                                       | `args`                                     | Resolve with                                                   | Needs                                                         |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------- |
| `mergeTags`            | Text toolbar, its own button next to **Merge tags** (under **More** when narrow) | none                  | `{ name, value }`                                              | Essentials                                                    |
| `specialLinks`         | A link next to **Special links** under the Url field of buttons, images and text links | none            | `{ type, label, link }`                                        | Essentials                                                    |
| `mergeContents`        | Dynamic content properties, as a button                     | none                                       | `{ name, value }`                                              | Essentials; at least one item in `mergeContents` so the tile exists |
| `rowDisplayConditions` | Display condition widget of a row, as a button              | current condition object, or none          | `{ type, label, description, before, after }`                  | Core, plus Developer Console **Services → Display Conditions** on |
| `externalContentURLs`  | Rows tab drop-down, last item                               | none                                       | `{ name, value }` where `value` is a rows URL                  | Core; covered by `beefree-sdk-custom-rows`                     |
| `saveRow`              | Save icon on a selected row, no label                       | metadata already on the row                | row metadata, `name` required                                  | Core plus console toggle; covered by `beefree-sdk-self-hosted-saved-rows` |
| `onEditRow`, `onDeleteRow` | Row card menu in the Rows tab, no label                 | `{ value, handle, row }`                   | `true` to refresh the list                                     | Same as `saveRow`                                             |
| `editSyncedRow`        | Sidebar button on a synced row; also `description`, `notPermittedDescription` | row data                 | `true` keeps it synced, `false` turns it into a regular row    | Core, synced rows                                             |
| `manageForm`           | Form block properties                                       | the form already applied                   | a form structure                                               | Essentials, Page and Popup builders                           |
| `customAttribute`      | Link and image attribute editors                            | none                                       | `{ key, name, value, target }`                                 | Core, Custom Attributes                                       |
| `addVideo`             | Video block, custom source                                  | none                                       | `{ videoSrc, thumbSrc, thumbAlt? }`                            | Essentials, Video block                                       |
| `filePicker`           | Browse button of image and file fields, no label            | `{ 'X-BEE-UserName', 'X-BEE-Uid', 'X-BEE-Mimetypes' }` plus the module name | `{ url }`                    | Superpowers, Custom File Picker                               |

Plans in the last column come from `references/plans.md` of the setup skill and the hints on each docs page.
The Display Conditions console switch is from the official example's README, not from the docs page.

## Value shapes

Merge tag, same shape as one entry of `mergeTags`:

```javascript
{ name: 'First name', value: '{{ first_name }}' }   // name is kept for later display, value is the inserted text
```

Special link, same shape as one entry of `specialLinks`:

```javascript
{ type: 'Account', label: 'Unsubscribe', link: '{{ unsubscribe_url }}' }
// type groups links in the UI, label is the default link text, link may contain placeholders
```

Dynamic content, same shape as one entry of `mergeContents`:

```javascript
{ name: 'Headline news', value: '{{ headlines }}' }   // name is shown in the UI and in the message
```

Display condition, same shape as one entry of `rowDisplayConditions`:

```javascript
{
  type: 'BEE_CUSTOM_DISPLAY_CONDITION',   // the value the builder passes back as the current condition's type
  label: 'Premium customers',
  description: 'Shown to premium tier only',
  before: '{% if customer.tier == "premium" %}',
  after: '{% endif %}',
}
```

The third handler argument is the row's current condition, in the same shape, when one is set.
The official example passes it to its builder UI so the user edits instead of starting over.

Custom attribute:

```javascript
{ key: '2783f0ea-f6af-44f3-856e-d7a01cd87714', name: '100% Custom', value: 'My custom value', target: 'link' }
```

Custom video:

```javascript
{ videoSrc: 'https://link.to.your.custom.video', thumbSrc: 'https://images.example.com/thumb.jpg', thumbAlt: 'Title' }
```

File picker:

```javascript
{ url: 'https://images.example.com/photo.jpg' }
```

## Lists in the config and the dialog together

The docs recommend both at once: frequently used items in the `mergeTags`, `specialLinks` or `mergeContents` arrays, the long tail through the dialog.
The special links page says the Merge tags button "is not shown if no merge tags were submitted in the configuration file".
Whether a `contentDialog.mergeTags` entry alone makes the button appear is not stated and was not tested; the demo passes two items in each array so the buttons exist either way.

Observed on 2026-09-03 in a Superpowers application: the builder renders the dialog label as a separate control, a toolbar button for `mergeTags` and a link under the Url field for `specialLinks`. The **Merge tags** and **Special links** menus themselves list only the config arrays. The docs screenshots from 2018 show the label inside the menu; the current builder does not.

Merge tag syntax is up to the host app: the builder inserts the `value` string as is.
HTML in a merge tag value is encoded and does not work; replace the tag at send time instead.

## Observed in the official examples

- **React** (`conditional-rows-example`): the handler stores `resolve` and `reject` in component state, opens a modal, and the modal's confirm and cancel buttons call them. The config is assembled inside the component so the handler can reach state.
- **Plain closures** (`beefree-sdk-demos`): handlers are plain functions defined next to the config, one per dialog, with `saveRow`, `onEditRow`, `onDeleteRow` and `editSyncedRow` side by side.
- Neither example ships `mergeTags` or `specialLinks` dialogs; the demo in this skill is the first one on those two handlers.

## Discrepancies in the docs, noted on 2026-09-03

- The configuration parameters page shows `specialLinks` entries as `{ name, value, target }` and a `contentDialog` sample with `contentDialogUrl` and `triggers`. Neither matches the content dialog page or the special links page, which agree on `{ type, label, link }` and on named handlers. This skill follows the two pages that agree, and the builder validates against that shape.
- The content dialog page calls the third `rowDisplayConditions` argument `currentCondition` and adds that the name is free; it is an ordinary positional argument.
