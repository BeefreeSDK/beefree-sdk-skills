# Selectors observed in the builder

Source: <https://docs.beefree.io/beefree-sdk/other-customizations/appearance/custom-css?from=skill> (rules, read on 2026-09-03).
The class list itself is observed, not documented: Beefree does not publish a list of `--cs` classes.
The docs say only class names with the `--cs` suffix are reliable, and that changes to them and to the HTML structure are announced in advance.

The classes below were read from the live DOM of builder `3.55.1` (Email Builder) on 2026-09-03, with the Content, Rows and Settings tabs open and one content block selected.
Other builder types (Page, Popup) and other versions may differ.
Check the DOM of your builder before relying on a class not listed here.

## Scope

| Class          | Where it applies                                 |
| -------------- | ------------------------------------------------ |
| `body.bee--cs` | Body of the builder. Scope every rule under it. |

## Top bar

| Class                          | Element                            |
| ------------------------------ | ---------------------------------- |
| `.topbar--cs`                  | Top bar container                  |
| `.topbar-logo--cs`             | Logo                               |
| `.topbar-actions--cs`          | Actions area                       |
| `.topbar-structure-button--cs` | Show structure button              |
| `.topbar-save-button--cs`      | Save button                        |

## Sidebar

| Class                                                            | Element                                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `.widget-bar--cs`                                                | Sidebar container                                                           |
| `.widget-bar__scroll-container--cs`                              | Scrollable area inside the sidebar                                          |
| `.sidebar-collapse-handle--cs`                                   | Handle that collapses the sidebar                                           |
| `.tabs--cs`, `.tabs__tablabels--cs`                              | Tab strip                                                                   |
| `.tabs__tablabel--cs`                                            | One tab button. Also carries `.tabs__content--cs`, `.tabs__rows--cs` or `.tabs__settings--cs` |
| `.tab-content--cs`                                               | Tab panel                                                                   |
| `.widgets-section__title--cs`, `.widgets-section__title-inner--cs` | Section title in Settings and in the properties panel                     |
| `.widgets-section__heading--cs`                                  | Heading inside a properties section                                         |
| `.widget__label--cs`, `.widget__labelmin--cs`, `.widget__labelmax--cs` | Control labels                                                        |
| `.scrollable__panel--cs`                                         | Scroll containers (sidebar and stage)                                       |

The active tab has no `--cs` state class.
It is a `button` with `role="tab"` and `aria-selected="true"`.
`.tabs__tablabel--cs[aria-selected="true"]` targets it today, but an attribute is not a `--cs` class and sits outside what the docs call reliable.
The starter stylesheet leaves tab colors to the builder for this reason.

## Content tiles

| Class                                                                                                  | Element                       |
| ------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `.sidebar-draggable--cs`                                                                               | Every draggable content tile  |
| `.sidebar-draggable-heading--cs`, `-paragraph--cs`, `-list--cs`, `-image--cs`, `-button--cs`, `-divider--cs`, `-spacer--cs`, `-social--cs`, `-icons--cs` | One tile each |

### Inside a tile

Read from the Title tile on 2026-09-03, builder 3.55.1 (Email):

```html
<div class="sidebar-draggable--cs sidebar-draggable-heading--cs" aria-label="Title" role="listitem">
  <div class="sidebar__module">
    <div class="image-drag">
      <svg width="36" height="36" viewBox="0 0 30 26" aria-hidden="true"><path d="…"/></svg>
    </div>
    <div class="body__title body__title--cs"><span>Title</span></div>
  </div>
</div>
```

Hashed class names are omitted.
`.sidebar__module` and `.image-drag` carry no `--cs` suffix: the docs' own snippet uses `.image-drag`, the example `tile-icons.css` does not and reaches the `svg` straight from the tile class.
The `path` has no `fill` attribute, so `fill` and `color` set on the `svg` reach it by inheritance unless the builder sets `fill` on the path itself.

## Properties panel (visible when a block or row is selected)

| Class                                                                              | Element                                  |
| ---------------------------------------------------------------------------------- | ---------------------------------------- |
| `.properties-panel__title--cs`                                                     | Title bar of the properties panel        |
| `.sidebar-panel-title-icon--cs`, `-closepanel--cs`, `-delete--cs`, `-duplicate--cs` | Icons in the title bar                  |
| `.module-actions-toolbar--cs`, `.module-action--cs`                                | Action toolbar and its buttons           |
| `.panel__title--cs`, `.panel__icon-preview-wrapper--cs`                            | Sub-panel title and icon preview          |
| `.widget-section__paddingpreview--cs`, `.previewbox--cs`                           | Padding and preview widgets              |
| `.padding-container--cs`, `.align-container--cs`, `.text-align-container--cs`, `.image-container--cs`, `.image-width-container--cs`, `.link-container--cs`, `.href-container--cs`, `.href-link-file--cs`, `.link-color-container--cs`, `.alternate-txt--cs`, `.ai-alt-text-container--cs`, `.icons-container--cs`, `.icons-mode-container--cs`, `.icon-spacing-container--cs`, `.social-input-container--cs`, `.social-collection-list--cs`, `.icon-organizer__panel--cs`, `.add-social-icon--cs`, `.icon-remove--cs` | Containers of individual property controls |
| `.content-area-width-container--cs`, `.content-area-align-container--cs`, `.content-background-color-container--cs`, `.container-background-color-container--cs`, `.default-font-container--cs` | Settings tab controls |

## Controls

| Class                                                                             | Element                              |
| --------------------------------------------------------------------------------- | ------------------------------------ |
| `.button--cs`                                                                     | Every button                         |
| `.button-primary--cs`, `.button-danger--cs`, `.button-solid--cs`, `.button-text--cs`, `.button-white--cs`, `.button-small--cs`, `.button-fit--cs` | Button variants |
| `.btn-file-picker--cs`                                                            | File picker button                   |
| `.radiogroup--cs`, `.radiogroup-options--cs`, `.radiogroup-options--button--cs`   | Radio groups                         |
| `.radiogroup-button--cs`                                                          | One radio option. `.active--cs` marks the selected one. Also `-left--cs`, `-center--cs`, `-right--cs`, `-desktop--cs`, `-mobile--cs` |
| `.stagemode__radiogroup--cs`, `.stagemode__buttonswrapper--cs`                    | Desktop/mobile switch above the stage |
| `.input-text--cs`, `.input-text-boxed--cs`, `.input-search--cs`                   | Text inputs                          |
| `.number-selector--cs`, `.input-number-input--cs`, `.input-number-minus--cs`, `.input-number-plus--cs` | Numeric steppers |
| `.slider--cs`, `.slider-wrapper--cs`, `.slider-container--cs`                     | Sliders                              |
| `.toggle-wrapper--cs`, `.toggle-input--cs`, `.toggle-slider--cs`                  | Toggles                              |
| `.checkbox-wrapper--cs`                                                           | Checkboxes                           |
| `.dropdown-custom--cs`, `.dropdown-menu--cs`, `.dropdown-menu-button--cs`         | Dropdowns                            |
| `.wrapper-color-selector--cs`                                                     | Color pickers                       |
| `.image-selector-container--cs`, `.image-selector-url-input--cs`                  | Image selector                       |
| `.floating-toolbar--cs`                                                           | Floating text toolbar                |
| `.body__title--cs`                                                                | Dialog and panel titles              |

## Stage (do not style)

These classes exist on the editing stage.
The docs say not to style stage elements, because the result never reaches the exported HTML.
Listed only so you can recognise them.

`.row-labels--cs`, `.row-label--cs`, `.hidden-row-label--cs`, `.content-labels--cs`, `.module-name-label--cs`, `.hidden-content-label--cs`.

The docs' own snippet on smart merge tags targets `.content-labels--cs code[data-bee-code]`, which is a label decoration and not email content.

## Seen in the official example, not found in 3.55.1

The official example (<https://github.com/BeefreeSDK/beefree-sdk-examples/tree/main/custom-css-example>) uses some selectors that do not exist in the current builder.
Do not copy them.

- `.btn--cs`: the real class is `.button--cs` plus variants.
- `.tab--cs`: the real class is `.tabs__tablabel--cs`.
- `.select--cs`, `.textarea--cs`, `.rowlayout__columns--cs`, `.widgets-bar-columns__indicator--cs`, `.focus--cs`: not present in the DOM inspected.
- `.stage-placeholder--cs`, `.stage-placeholder-icon--cs`, `.stage-placeholder-text--cs`: only on an empty stage, and on the stage anyway.
- `.page-stage`, `.icon--color-base`, `.icon--color-light`, `.module-box`, `.icon-move`, `.row-container`: no `--cs` suffix, outside the contract.

## More ideas, one snippet each

Not shipped as examples; add on request, same rules.

- **Compact density.** Smaller tiles and tighter labels for narrow embeds: `padding` on `.sidebar-draggable--cs`, `font-size` on `.widget__label--cs` and `.widgets-section__title--cs`. Test at the target width, text wraps.
- **Styled scrollbars.** `body.bee--cs .widget-bar--cs .scrollable__panel--cs::-webkit-scrollbar` plus `scrollbar-color` and `scrollbar-width` for Firefox. Keep the `.widget-bar--cs` scope: `.scrollable__panel--cs` is also on the stage.
- **Soft controls.** Shadow and radius on `.input-text--cs`, `.input-text-boxed--cs`, `.dropdown-custom--cs`, `.number-selector--cs`, `.button--cs`; `!important` where the builder's own rule is more specific.

## CSS custom properties: outside the contract

The builder declares about 480 custom properties on `:root`, for example `--widget-bar-and-active-tab-background-color` or `--tile-background-color`.
The official example overrides them with `!important`.
They are not `--cs` classes, they are not mentioned in the docs, and two used by the example (`--properties-section-title-background`, `--sidebar-row-layout-wrapper-background`) are not declared in 3.55.1.
The starter stylesheet does not use them.
If you do, treat them as a convenience that can change without notice.
