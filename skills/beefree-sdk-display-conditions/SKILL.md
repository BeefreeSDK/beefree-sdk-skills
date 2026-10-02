---
name: beefree-sdk-display-conditions
license: Apache-2.0
description: Add Display Conditions to a Beefree SDK integration (Core plan and above) so end users show or hide a row per recipient with the host app's own templating syntax, such as Liquid or Handlebars. Covers the rowDisplayConditions array, before and after rules for multi-row logic, a condition builder dialog, roles and permissions. Use when the user mentions display conditions, conditional rows, rowDisplayConditions, show a row only to a segment, personalized or conditional content per recipient, if and endif around a row, or a condition builder for Beefree SDK. Merge tags and other content dialogs have their own skill.
metadata:
  author: Beefree SDK
  version: "0.1.3"
  last-verified: "2026-09-03"
  docs: https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/display-conditions
---

# Beefree SDK display conditions

Let end users wrap a row in a condition, so the sending engine shows it only to some recipients.
The host app supplies ready-made conditions, and can add a builder dialog where users make their own.
The builder writes the syntax around the row's HTML and never interprets it.

Requires a working Beefree SDK integration.
If the builder does not run yet, use the `beefree-sdk-setup` skill first.
The dialog part is one handler of the Content Dialog; the `beefree-sdk-content-dialog` skill has the general contract and the other handlers.

## Step 1: check the plan

Display Conditions are available on **Core** (tier 30), **Superpowers** and **Enterprise**.

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
   On Free only the upgrade exists.

## Step 2: turn the feature on in the Developer Console

Manual step, the user does it.
The feature is off in every new application, and without it no condition widget appears and the dialog never fires.

1. <https://developers.beefree.io/apps/>, pick the application, open its details.
2. In the application configuration, find the **Row Display Conditions** switch and turn it on.
   The docs call it **Display Conditions**; the console label observed on 2026-09-03 says Row Display Conditions.
   The sub-switch **Highlight rows with Display Conditions** turns on with it; it draws a dashed border and the condition name on the stage.
3. Save.

Use the same application whose credentials are in `.env`.
The change is picked up on the next builder start, no code change needed.

## Step 3: confirm conditions are the right tool

Ask what should vary per recipient, unless the request already says.

- **A whole row shown to some recipients and not others.** This skill.
- **A word or a value inside a text**, such as a first name. Merge tags, see `beefree-sdk-content-dialog`.
- **A row hidden for everyone on mobile or on desktop.** The row's own hide options, no condition.
- **Who may add or edit conditions.** Roles in the Developer Console and `advancedPermissions`, covered in Step 6B, not a separate feature.

Then ask which syntax the sending engine understands.
The builder is agnostic: Liquid, Handlebars, a proprietary language, all work the same.
The demo uses Liquid, as the docs and the official example do.

## Step 4: the predefined conditions

```javascript
const beeConfig = {
  container: 'beefree-sdk-container',
  rowDisplayConditions: [
    {
      type: 'Customer segment',              // category in the picker
      label: 'Recurring buyers',             // name in the picker and on the row
      description: 'More than three orders',
      before: '{% if customer.orders_count > 3 %}',
      after: '{% endif %}',
    },
  ],
}
```

Facts, details in [display-conditions.md](references/display-conditions.md):

- `before` or `after` is required, both is the usual case. The builder adds no closing statement on its own.
- `before` alone and `after` alone exist for logic across rows: `if` on the first row, `elsif` and `else` on the middle one, `endif` on the last.
- `type` groups conditions in the picker, and the picker has a search box.
- The syntax and the row's HTML stay apart in the output, so the engine can drop or repeat the row safely.
- A condition edited by the user becomes a custom one: blue dot, remove only, not written back to the array.

## Step 5: the builder dialog

Optional. Add it when the predefined list cannot cover what users need.

```javascript
contentDialog: {
  rowDisplayConditions: {
    label: 'Build a condition',
    handler: function (resolve, reject, current) {
      openYourBuilder(current)                    // current: the row's condition, when editing
        .then(condition => resolve(condition))    // { type, label, description, before, after }
        .catch(() => reject())
    },
  },
},
```

- The label becomes a button in the row's **Dynamic content → Display condition** section, next to **Select condition** and **Add condition**, and stays there once a condition is applied.
- **Always end with `resolve` or `reject`.** The builder blocks editing while it waits.
- Resolve with all five fields. Use `type: 'BEE_CUSTOM_DISPLAY_CONDITION'`, the value the builder itself uses for a condition made in a dialog and the one the official example resolves.
- The third argument is the row's current condition, when one is set. Pre-fill the builder from it so the user edits instead of starting over.
- The handler runs in the host page: any UI, and a fetch to the app's backend carries the app's session.

## Step 6A: add it to the setup demo

Ready-made file in `assets/demo/`, written for the `beefree-sdk-setup` demo.
Four predefined conditions in three categories, plus a native `<dialog>` builder with a field, an operator, a value and a live syntax preview.
Nothing changes in `server.js`.

1. Copy `assets/demo/public/display-conditions.js` into `public/`.
2. Load it in `public/index.html`, before `app.js`:

   ```html
   <script src="display-conditions.js"></script>
   ```

3. In `public/app.js`, wrap the config where the builder is created:

   ```javascript
   BeePlugin.create(token, withDisplayConditions(beeConfig), function (instance) {
   ```

   With other feature skills installed, chain the wrappers: `withDisplayConditions(withContentDialog(beeConfig))`.
   Each one merges into `contentDialog` and keeps what is already there.
4. `npm start`, open <http://localhost:3000>.

To use the app's own fields, replace the two lists at the top of the file; the dialog code stays.

## Step 6B: existing app

Stay framework-neutral and port the demo file.

- **The array.** Build `rowDisplayConditions` from the segments the sending engine knows. Keep `type` values few, they are the picker's categories.
- **The dialog.** The handler is the bridge between the builder and the app's modal. In React, keep `resolve` and `reject` in state or a ref and assemble `contentDialog` inside the component, as the official example does.
- **Conditions made by users.** They live only in the saved template JSON. Read them from there if the app should offer them again.
- **Permissions.** Roles in the Developer Console give three levels: view and preview only, select only, full control. `advancedPermissions.rows.displayConditions: { show, locked }` hides or locks the widget for one `beeConfig`.
- **Preview.** Users toggle each condition in Preview to see what a segment receives. No code needed.

## Step 7: verify

Verified on 2026-09-03 with a Superpowers application, Chrome, Node 20, after the console switch was turned on.

1. The builder loads. Select a row by clicking its blank margin.
   The row properties show a **Dynamic content** section with **Display condition**, "No display condition applied to this row", and three buttons: **Select condition**, **Add condition**, **Build a condition**.
   If the section is missing, Step 2 was not done or the plan is below Core.
2. Click **Select condition**. The picker lists **Customer segment**, **Loyalty** and **Region**, with a search box. Type `Recurring`, click **Recurring buyers**.
   The section now shows the name, the description, the `before` and `after` text, **Edit** and **Delete**, and the buttons **Replace condition** and **Build a condition**.
3. Click **Build a condition**. The dialog opens with the name and description of the current condition already filled.
   Change the name, pick **Last order total**, **greater than**, type `100`, watch the preview, click **Apply**.
   The section shows the new condition with a **CUSTOM** badge, and **Replace condition** is gone: a custom condition can only be edited or deleted.
4. Click **Build a condition** again and press Escape. The dialog closes and the builder is editable at once.
5. Deselect the row. On the stage the row has a dashed border and a label with the condition name; an eye icon in the stage toolbar hides them.
6. Click Save. In the HTML output `{% if last_order.total > 100 %}` sits right before the row's table and `{% endif %}` right after it. The JSON carries the condition with `type: BEE_CUSTOM_DISPLAY_CONDITION`.

| Symptom                                              | Likely cause and fix                                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| No **Display condition** section on any row          | Console switch off (Step 2), plan below Core (Step 1), role without the permission, or `advancedPermissions.rows.displayConditions.show` is `false`. |
| Section present, no **Select condition** button      | `rowDisplayConditions` missing or empty in the config passed at creation.                                          |
| No **Build a condition** button next to the others   | `contentDialog.rowDisplayConditions` not in the config passed at creation, or the role cannot add conditions.      |
| Builder stays blocked after the dialog               | The handler never called `resolve` or `reject`. Check every path, including errors and closing the modal.          |
| Console says `the item is malformed`                 | Wrong shape. Five string fields, and at least one of `before` and `after` non-empty.                              |
| Condition applied but the output has no syntax       | `before` and `after` both empty, or the row was replaced after the condition was set. Re-apply.                    |
| No dashed border or label on the stage               | Sub-switch **Highlight rows with Display Conditions** off. Older applications did not get it automatically.        |

## References

- [display-conditions.md](references/display-conditions.md): console switch, the condition object and its rules, the array, the dialog and its current-condition argument, custom conditions, roles and permissions, stage and preview behaviour, observations from the official example.
- Official docs: <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/display-conditions>.
- Content dialog, display conditions handler: <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/content-dialog#display-conditions>.
- Advanced permissions for the widget: <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/advanced-permissions#add-condition-and-edit-condition-buttons>.
- Official example, React: <https://github.com/BeefreeSDK/beefree-sdk-examples/tree/main/conditional-rows-example>.
