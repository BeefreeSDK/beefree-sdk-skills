# Page Builder and Popup Builder

Source: <https://docs.beefree.io/beefree-sdk/visual-builders/page-builder/integrating-page-builder?from=skill>,
<https://docs.beefree.io/beefree-sdk/visual-builders/popup-builder/popup-builder-getting-started?from=skill>,
<https://docs.beefree.io/beefree-sdk/visual-builders/popup-builder/testing-and-integrating?from=skill>
and <https://github.com/BeefreeSDK/beefree-sdk-assets-templates> (read on 2026-10-16).

## What is the same as Email Builder

Authorization, loading, `beeConfig`, callbacks and instance methods are the same for the three builders.
An integration written for Email Builder works for Page and Popup with the credentials of a Page or Popup application.
The token payload carries `product_handle: "page"` or `"pub"`, see [auth.md](auth.md).
Each type is its own application in the Developer Console; a development (child) application keeps its parent's type.

## Page Builder

Differences are in the editor, not in the integration:

- Page width up to 1440px, and the stage scrolls horizontally.
- A 6-column row layout for wide pages, and a collapsible sidebar.
- Preview with viewport resize to test responsiveness.
- The HTML block accepts scripts; they are not executed inside the builder.
- Paid plans add the Form block and the Video block (YouTube, Vimeo or a hosted MP4).

`onSave` returns the template JSON and a full HTML page.

## Popup Builder

Two differences that change the integration:

- **Width is not saved in the template.**
  The same popup can appear in several places with different sizes, so the host app sets the width when it starts the builder (`workspace.popup.contentWidth`).
  Each preset layout has a default width.
  Fluid 100% width is not supported.
- **The HTML is a snippet, not a page.**
  `onSave` returns an HTML partial with the CSS it needs, wrapped in a container that resets the host page's styles.
  Embed it in the host app's popup or modal; do not serve it as a page.

With no extra config the builder shows a centred popup with a fixed width.
Optional settings go under `beeConfig.workspace.popup`, each with a mobile variant:

| Key                                             | Values                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `layout`                                        | `classic-center` (default), `classic-top-right`, `classic-top-left`, `classic-bottom-right`, `classic-bottom-left`, `drawer-left`, `drawer-right`, `bar-top`, `bar-bottom` |
| `theme`                                         | `custom` (default), `bootstrap`, `jQuery`, `material`                                                                |
| `contentWidth`, `contentWidthMobile`            | width in pixels                                                                                                      |
| `backgroundImage`, `backgroundImageMobile`      | URL of a screenshot of the destination page, to see the popup in context                                             |

```javascript
const beeConfig = {
  container: 'beefree-sdk-container',
  workspace: {
    popup: { layout: 'classic-center', contentWidth: 500 },
  },
  onSave: function (jsonFile, htmlSnippet) { /* embed htmlSnippet in your popup */ },
}
```

Custom styles and fully custom layouts are in the docs' advanced settings page: <https://docs.beefree.io/beefree-sdk/visual-builders/popup-builder/setting-layout-and-size/advanced-settings?from=skill>.

## Sample templates

From `BeefreeSDK/beefree-sdk-assets-templates`, pinned to commit `05bc0b87fc2df0e74e6e8d1c93c46ceee9fb2d71`.
Images in these files point to Beefree's CDN; unlike the v3 email files, they have no `repository_path` placeholder.
`raw.githubusercontent.com` answers with `Access-Control-Allow-Origin: *`, so a browser can fetch them directly.

| Type  | Sample used by the demo | URL                                                                                                                                                                   |
| ----- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page  | `shopping-app`, 1440px  | `https://raw.githubusercontent.com/BeefreeSDK/beefree-sdk-assets-templates/05bc0b87fc2df0e74e6e8d1c93c46ceee9fb2d71/v3%20Page%20Templates/shopping-app.json`           |
| Popup | `Welcome-Back`, 500px   | `https://raw.githubusercontent.com/BeefreeSDK/beefree-sdk-assets-templates/05bc0b87fc2df0e74e6e8d1c93c46ceee9fb2d71/v3%20Popup%20Templates/Welcome-Back/Welcome-Back.json` |

- The repository has five more Page samples and eight more Popup samples.
  Some Popup folders also carry a `*.config.json` with the `workspace.popup` settings the design was made for.
  Three Popup JSON files start with a UTF-8 byte order mark; `response.json()` in the browser accepts it, some JSON parsers do not.
- The repository has no license file: fetch the samples at run time, do not copy them into the user's project as their own content.
- The hosted endpoint `https://rsrc.getbee.io/api/templates/<name>` has no Page or Popup samples: it returns an email template for any name, made-up names included (observed on 2026-10-16).
