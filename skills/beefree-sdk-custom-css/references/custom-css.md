# Custom CSS

Source: <https://docs.beefree.io/beefree-sdk/other-customizations/appearance/custom-css> (read on 2026-09-02).
Also mentioned in <https://docs.beefree.io/beefree-sdk/other-customizations/appearance/right-to-left-support>, which loads the RTL stylesheet through the same key.

## Availability

Superpowers plan and above.
The docs page says a development application can be upgraded "at no extra charge" to try features from higher tiers, and that usage on it still counts toward usage-based fees and limits.

## The config key

```javascript
customCss: 'https://yourdomain.com/stylesheet.css'
```

A URL string.
The builder fetches it when it starts.
`customCss` is not listed on the configuration parameters page; the custom CSS page is the only documentation of it.

Per-user stylesheet, from the docs:

```javascript
customCss: 'https://yourdomain.com/' + users[config.user].id + '.css'
```

## Who fetches the stylesheet, and why `localhost` fails

Observed on 2026-09-03, not stated in the Beefree docs.

The builder runs in an iframe whose origin is `https://app.getbee.io`.
That iframe requests the `customCss` URL, not the host page.
Chrome 142 ships Local Network Access: a page on a public origin needs a permission before it can reach a loopback (`localhost`, `127.0.0.1`) or local-network address.
The permission is a policy-controlled feature, `local-network-access`, whose default allowlist is `self`.
A cross-origin iframe gets it only if the host page sets `allow="local-network-access"` on the `<iframe>` element, and the Beefree loader creates that element.
The request fails with:

```text
Access to CSS stylesheet at 'http://localhost:3000/custom.css' from origin 'https://app.getbee.io' has been blocked by CORS policy: Permission was denied for this request to access the `loopback` address space.
```

What works:

- A stylesheet on a public HTTPS origin, which is what production needs.
- Firefox and Safari, which do not implement Local Network Access at the time of writing (inferred from MDN marking the policy experimental and the explainer naming only Chrome; not tested).
- Last resort: Chrome with `chrome://flags/#local-network-access-check` set to Disabled, for testing only. It lowers a browser protection for every site, so turn it back on after the test. The flag name is from the Chrome blog; its presence in a given Chrome build is not guaranteed.

The official `custom-css-example` builds the theme URL from `location.origin` and has the same problem in Chrome 142 or newer.

Sources, read on 2026-09-03:
<https://developer.chrome.com/blog/local-network-access>,
<https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/local-network-access>,
<https://github.com/WICG/local-network-access/blob/main/explainer.md>.

## Rules from the docs, verbatim in substance

Best practices:

- Avoid global styles (`*`, `p`, `input`) that could affect the editing stage.
- Use specific selectors, for example `body.bee--cs h3`.
- Do not inject scripts via CSS.
- Host the CSS over HTTPS.
- Do not link to CSS hosted on GitHub or other third-party sources.
- Do not style elements on the stage: those styles will not appear in the final HTML.

Reliable selectors:

- Only class names with the `--cs` suffix are reliable.
- Avoid nested tag structures (`div > div > div`), sibling selectors (`input + label`), class names without `--cs` (`.icons__item`), prefixed class selectors (`div[class^="StageModuleIcons_itemRow"]`).
- Class names without `--cs` may change without notice.
  Changes to the HTML structure and to `--cs` classes are announced in advance.

When the goal is to hide UI elements, the docs recommend checking Advanced Permissions first:
<https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/advanced-permissions>.

## Official snippets

Replace the sidebar tile icon of the Title block:

```css
/* Hide default icon for title block */
.sidebar-draggable-heading--cs .image-drag svg {
  visibility: hidden;
}

/* Replace them with yours */
.sidebar-draggable-heading--cs .image-drag {
  background: url() no-repeat center;
  background-size: contain;
}
```

Style smart merge tags in the content:

```css
.content-labels--cs code[data-bee-code] {
  border: none !important;
  border-radius: 5px;
  background-color: #effcff;
  color: #34778f;
  padding-left: 24px !important;
}

.content-labels--cs code[data-bee-code]::after {
  display: inline-block;
  position: absolute;
  top: 50%;
  left: 4px;
  transform: translateY(-50%);
  content: '';
  background-image: url("./cube.svg") !important;
  background-size: contain;
  width: 16px;
  height: 16px;
}
```

Relative `url()` values resolve against the stylesheet URL, so `./cube.svg` must sit next to the CSS file.

## Official example

<https://github.com/BeefreeSDK/beefree-sdk-examples/tree/main/custom-css-example>: React, TypeScript, Vite, four theme files under `public/themes/`.
It switches themes by calling the SDK initialisation again with a new `customCss` URL, and it decodes the token to warn when the plan is below Superpowers.
