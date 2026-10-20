# Configuration and callbacks

Source: <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation/configuration-parameters?from=skill>
and <https://docs.beefree.io/beefree-sdk/getting-started/readme/installation/methods-and-events?from=skill>.

## Minimal config

```javascript
const beeConfig = {
  container: 'beefree-sdk-container', // required: element id or the HTMLElement itself
  language: 'en-US',
  onSave: function (jsonFile, htmlFile, ampHtml, templateVersion, language) {
    // jsonFile: template JSON as a string. htmlFile: rendered HTML.
  },
  onError: function (error) {
    console.error('Beefree SDK error', error)
  }
}
```

`container` is the only required key.
The element needs an explicit height: the builder fills its container.

## Callbacks worth wiring on day one

| Callback           | Arguments                                              | When                                                    |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------- |
| `onSave`           | `(jsonFile, htmlFile, ampHtml, templateVersion, lang)` | User clicks Save or code calls `instance.save()`        |
| `onSaveAsTemplate` | `(jsonFile)`                                           | Save as template, JSON only                             |
| `onAutoSave`       | `(jsonFile)`                                           | Every `autosave` seconds, when `autosave` is a number   |
| `onChange`         | `(jsonFile, response)`                                 | Every change, when `trackChanges: true`                 |
| `onSend`           | `(htmlFile)`                                           | Send test, Email Builder only                           |
| `onLoad`           | `(jsonFile)`                                           | Template loaded                                         |
| `onError`          | `(error)`                                              | Errors, including token codes 5101 and 5102             |
| `onWarning`        | `(warning)`                                            | Non-blocking warnings                                   |

`jsonFile` is a string.
Call `JSON.parse` before inspecting it.

## Other common config keys

| Key              | Type               | Default   | Purpose                                                        |
| ---------------- | ------------------ | --------- | -------------------------------------------------------------- |
| `language`       | string             | `en-US`   | UI language, for example `it-IT`, `de-DE`, `es-ES`, `fr-FR`    |
| `autosave`       | number or false    | `false`   | Autosave interval in seconds                                   |
| `trackChanges`   | boolean            | `false`   | Enables `onChange`                                             |
| `preventClose`   | boolean            | `false`   | Warn before leaving with unsaved changes                       |
| `sidebarPosition`| `left` or `right`  | `left`    | Sidebar side                                                   |
| `mergeTags`      | array              | `[]`      | `{ name, value }` personalization tags                         |
| `specialLinks`   | array              | `[]`      | `{ type, label, link }` links such as unsubscribe              |
| `username`, `userColor`, `userHandle` | string | none | Used by co-editing and comments                             |

The full list is in the configuration parameters page linked above.

## Starting the builder

Loader script:

```javascript
BeePlugin.create(tokenObject, beeConfig, function (instance) {
  instance.start(templateJson)
})
```

npm package:

```javascript
import BeefreeSDK from '@beefree.io/sdk'

const bee = new BeefreeSDK(tokenObject)
await bee.start(beeConfig, templateJson)
```

`create` and `start` can be separated.
Create early, start when the template is available.
A File Manager application calls `start()` with no template, see [file-manager.md](file-manager.md).

## Instance methods used in the setup phase

| Method                     | Effect                                                     |
| -------------------------- | ---------------------------------------------------------- |
| `start(template)`          | Loads the builder with the template (loader script form)   |
| `load(template)`           | Replaces the template without a loading dialog             |
| `reload(template)`         | Replaces the template with a loading dialog                |
| `save()`                   | Triggers `onSave`                                          |
| `saveAsTemplate()`         | Triggers `onSaveAsTemplate`                                |
| `send()`                   | Triggers `onSend`                                          |
| `preview()`                | Opens the preview modal                                    |
| `toggleStructure()`        | Shows or hides structure outlines                          |
| `updateToken(tokenObject)` | Injects a fresh token                                      |
| `getConfig()`              | Returns the current client config (npm wrapper)            |

The npm wrapper signature for start is `start(beeConfig, template, bucketDir?, options?)`.

## Sample templates

- Live email samples: `https://rsrc.getbee.io/api/templates/<name>` (GET, returns the template JSON).
  `m-bee` is the one used by the official examples and by the demo.
  An unknown name does not fail: the endpoint returns an email template for any name (observed on 2026-10-16), so a typo goes unnoticed.
  Names observed to resolve on 2026-09-03, not enumerated in the docs:

  | name                                                             | content                                                |
  |------------------------------------------------------------------|--------------------------------------------------------|
  | `m-bee`, `newsletter`                                            | e-commerce newsletter, the richest samples             |
  | `promo`                                                          | shorter promotional email                              |
  | `one-column`                                                     | smallest, closest to a blank start                     |
  | `base-m-bee`, `base-newsletter`, `base-promo`, `base-one-column` | same layouts with placeholder images and fewer modules |

- Repository: <https://github.com/BeefreeSDK/beefree-sdk-assets-templates>.
  The v3 email JSON files there contain a `repository_path` placeholder for image URLs.
  Replace it before loading them.
- Page and Popup samples: see [page-and-popup.md](page-and-popup.md#sample-templates).
