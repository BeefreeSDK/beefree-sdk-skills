---
name: beefree-sdk-custom-css
license: MIT
description: Restyle the Beefree SDK builder UI with a custom stylesheet through the customCss config key (Superpowers plan and above), for what Themes in the Developer Console cannot do, such as rounded tabs, hover effects on the content tiles and your own tile icons, using only the stable --cs classes. Use when the user wants to theme, brand, restyle or change the look of the Beefree SDK builder, or mentions customCss or "custom CSS" for Beefree. Colors and fonts go to Themes first; hiding UI elements goes to Advanced Permissions.
metadata:
  author: Beefree SDK
  version: "0.2.5"
  last-verified: "2026-09-03"
  docs: https://docs.beefree.io/beefree-sdk/other-customizations/appearance/custom-css
---

# Beefree SDK custom CSS

Apply a stylesheet to the builder UI with the `customCss` config key.
The builder loads the stylesheet by URL when it starts.

Requires a working Beefree SDK integration.
If the builder does not run yet, use the `beefree-sdk-setup` skill first.

## Step 1: check the plan

Custom CSS is available on the **Superpowers** plan (tier 40) and **Enterprise**.
Below that, the key has no visible effect and no documented error.
Check before writing any CSS.

1. Run `check-credentials.sh path/to/.env` from the `beefree-sdk-setup` skill.
   Skills are installed as sibling folders, so from this skill's folder the path is `../beefree-sdk-setup/scripts/check-credentials.sh`.
   It prints the plan read from the token, for example `Plan: Superpowers (tier 40, token value 'beeplugin_gold')`.
   If that skill is not installed, ask the user which plan the application is on.
2. Report what the token says.
   Ask the user to confirm only when the plan could not be read, is unknown, or is below the tier this feature needs.
3. Tier 40 or 50: continue.
   Lower: say the feature is outside the plan and offer the two paths.
   - **Development application.** On paid plans, create a development application in the Developer Console, open its details, click **CHANGE PLAN** and pick Superpowers.
     The docs say this costs nothing extra; usage on it still counts toward usage-based fees.
     Features tested this way do not ship to production without the matching plan.
   - **Upgrade** the production application.
   On Free only the upgrade exists.

## Step 2: confirm CSS is the right tool

Ask what the user wants to change.

- **Hide a button, tab or option.** Point to [Advanced Permissions](https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/advanced-permissions) first.
  It is supported and does not break on UI updates.
- **Colors and fonts of the builder UI.** Point to [Themes](https://docs.beefree.io/beefree-sdk/other-customizations/appearance/themes) first: they are set in the Developer Console, need no code and no Superpowers plan (Core and above).
  A dark sidebar or a brand palette is a theme, not custom CSS.
- **Shapes, motion, icons, anything a theme has no setting for.** Custom CSS is the tool.
  The three examples in Step 3 cover exactly this ground.
- **Style the email content itself.** Not custom CSS.
  Styles applied to the editing stage do not reach the preview or the exported HTML.
  Use the template JSON, `defaultColors`, `editorFonts` or content defaults instead.

## Step 3: where the stylesheet lives, and a choice to make

The builder is loaded inside a frame that comes from Beefree's servers, and that frame is what fetches your stylesheet.
Browsers now stop pages from the internet from reading files on your computer, and `localhost` counts as your computer.
So a stylesheet at `http://localhost:3000/custom.css` will not load in Chrome 142 or newer, nor in Firefox 153 or newer.
Nothing breaks: the builder simply looks unchanged, and the only sign is a line in the browser console.
Details and sources in [custom-css.md](references/custom-css.md).

Tell the user this in plain words, then let them pick before writing any CSS.
Skip the question when the request already says where the stylesheet will live.
Do not pick for them when it is open.

- **Real setup.**
  Put the stylesheet on an HTTPS address you own and point `customCss` at it.
  This is what production needs anyway.
- **Quick local look.**
  Keep `localhost` and open the demo in Safari, the one browser with no Local Network Access implementation found as of September 2026 (inferred from the browser docs, not tested).
  Firefox 153 and later apply the rule too.
- **Last resort, Chrome only.**
  Set `chrome://flags/#local-network-access-check` to Disabled while testing, if your Chrome still has that flag.
  This lowers a browser protection for every site you visit: turn it back on as soon as the test is done.

### Pick an example

Three ready stylesheets live in `assets/themes/`.
Each shows one thing Themes cannot do and uses only `--cs` class hooks.
They share one illustrative violet; the file headers say which values to swap for the user's palette.
Describe all three in one message and let the user pick one, or ask for a mix.

| File                       | Shows                                                                                   | Where to look                                   |
| -------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `themes/rounded-tabs.css`  | The tab strip becomes a light violet pill, each tab a white pill with a violet border    | Sidebar top, at once                            |
| `themes/tile-hover.css`    | A hovered tile lifts and grows, gets a violet inset border, tint and shadow, label in violet | Hover a tile in the Content tab                 |
| `themes/tile-icons.css`    | Your own SVG artwork on the nine content tiles, violet on a light violet backdrop, one file per tile in `themes/icons/` | Sidebar Content tab, at once |

The icons example ships neutral line icons as placeholders.
Tell the user to drop their own SVG files over them, same names, and to edit the stroke color inside the files to match their palette.

### Host the file

1. Copy the chosen file from `assets/themes/` into the folder the host app serves as static files, renamed to `custom.css`.
   For `tile-icons.css`, copy the `icons/` folder next to it: the CSS references `./icons/<name>.svg` relative to its own URL.
   In the `beefree-sdk-setup` demo that is `public/custom.css` and `public/icons/`, served at `/custom.css` and `/icons/`.
   The demo server already sends `text/css` for `.css` files and `image/svg+xml` for `.svg`.
2. In production, serve it over HTTPS from an address you own.
   Do not link to GitHub, a gist or any third-party host.

## Step 4: wire `customCss`

Add the key to the config passed at creation:

```javascript
const beeConfig = {
  container: 'beefree-sdk-container',
  customCss: 'https://yourdomain.com/custom.css',
  // ...
}
```

In the demo, `location.origin + '/custom.css'` avoids hardcoding the port.

Facts:

- The value is a URL string, not inline CSS.
- It is read when the builder is created.
  To switch stylesheets at run time, create the builder again with the new URL, which is what the official example does.
- Per-user styling: build the URL from a user identifier, one stylesheet per user.
  See [custom-css.md](references/custom-css.md).

## Step 5: write the rules

The three example files already follow these rules.
Keep them when extending or mixing them.

- Target only class names ending in `--cs`, for example `.widget-bar--cs`.
  Beefree announces changes to these in advance.
  Every other class name can change without notice.
- Use only classes that exist in the builder the user runs.
  [selectors.md](references/selectors.md) lists the ones read from the live DOM of builder 3.55.1, and the ones from the official example that do not exist any more (`.btn--cs`, `.tab--cs`).
  When in doubt, inspect the builder frame and search for `--cs`.
- Scope every rule under `body.bee--cs` so nothing leaks outside the builder.
- No global selectors: no `*`, no bare `p`, `input`, `h3`.
- No nested tag chains (`div > div > div`), sibling selectors (`input + label`) or prefix matches (`div[class^="Stage"]`).
  A single plain tag under a `--cs` class, such as `.sidebar-draggable-heading--cs svg`, is what the docs' own snippet does and is fine.
  Pseudo-classes and pseudo-elements on a `--cs` class (`:hover`, `:focus-visible`, `::-webkit-scrollbar`) are fine too: the hook is still the class.
- Do not style the editing stage.
  The user would see a look that the exported email does not have.
- CSS only.
  No scripts, no `expression()`, no data URLs that carry code.
- Hooks are `--cs` classes, nothing else.
  `.active--cs` marks the selected radio option and can be combined: `.radiogroup-button--cs.active--cs`.
  The active tab has no `--cs` state class, so the examples leave the active marker to the builder.
  An attribute hook such as `.tabs__tablabel--cs[aria-selected="true"]` works today but is outside what the docs call reliable; offer it only if the user accepts that.
  Toggles have no state hook, leave them alone.
- `!important` only where the builder's own rule is more specific, for example `.button-primary--cs` and `.radiogroup-button--cs.active--cs`.
  The docs' own snippets use it the same way.
- Do not build the theme on the `:root` custom properties (`--tile-background-color` and similar).
  They exist and the official example overrides them, but they are not `--cs` classes and the docs do not mention them.
  See the last section of [selectors.md](references/selectors.md).

## Step 6: verify

1. Start the app and open the builder, then look where the table in Step 3 says.
   Rounded tabs and tile icons show at once; tile hover needs the pointer on a tile.
2. In the browser Network tab, the stylesheet URL returns 200 with `Content-Type: text/css`.
   For tile icons, each `icons/<name>.svg` returns 200 as well.
3. Click Save and open the preview.
   The exported HTML and the preview look the same as without the stylesheet.

If nothing changed:

| Symptom                                       | Likely cause and fix                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| No change, no error, 200 on the CSS           | Plan below Superpowers. Re-run the check from Step 1.                                          |
| CSS request missing from the Network tab      | `customCss` not in the config passed at creation, or a typo in the key.                        |
| CSS request blocked or 404                    | Wrong URL, or an `http://` stylesheet in an `https://` page (mixed content). Serve over HTTPS.  |
| Console says "Permission was denied for this request to access the `loopback` address space" | The stylesheet is on `localhost` and the browser blocks the builder frame from reading it. Go back to Step 3 and pick a path. |
| Some rules work, others do not                | A selector without `--cs` changed, or a `--cs` class from the official example that no longer exists (`.btn--cs`, `.tab--cs`). Replace it with one from `selectors.md` or drop it. |
| Change visible in the stage but not in Save   | Expected. Stage styles never reach the HTML. Remove those rules.                                |
| Tile icons: default drawing still visible under yours | The builder sets `fill` on the path itself in this version. Last resort: add `svg path { fill: transparent }` under the tile class and report it, that is a two-tag chain. |
| Tile icons: icon missing, CSS loaded           | `icons/` not copied next to `custom.css`, or a 404 on the SVG in the Network tab.               |
| A tile keeps its default icon                  | Its class is not in the file. Inspect the tile, read its `sidebar-draggable-<name>--cs` class, add a rule and an SVG. |

## References

- [custom-css.md](references/custom-css.md): what the docs page says, rules, official snippets.
- [selectors.md](references/selectors.md): `--cs` classes read from the live builder, grouped by area, plus what the official example gets wrong.
- Official docs: <https://docs.beefree.io/beefree-sdk/other-customizations/appearance/custom-css>.
- Official example, React and Vite: <https://github.com/BeefreeSDK/beefree-sdk-examples/tree/main/custom-css-example>.
