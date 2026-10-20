# Display conditions

Source: <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/display-conditions?from=skill> (read on 2026-09-03),
with <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/content-dialog?from=skill#display-conditions>
and <https://docs.beefree.io/beefree-sdk/other-customizations/advanced-options/advanced-permissions?from=skill#add-condition-and-edit-condition-buttons>.
Example: <https://github.com/BeefreeSDK/beefree-sdk-examples/tree/main/conditional-rows-example> (read on 2026-09-03).

## Availability

Core plan and above.
A development application can be upgraded "at no extra charge" to try it; usage on it still counts toward usage-based fees and limits.

Off by default in every application.
Turned on with the **Display Conditions** switch in the Developer Console, in the application configuration.
Turning it on also turns on the sub-switch **Highlight rows with Display Conditions** (added in April 2026 with builder 3.50.0; applications that already had the feature on did not get the sub-switch on automatically).

## What a condition is

A row-level wrapper: text the builder writes before the row's HTML and text it writes after.
The syntax is the host app's choice. The builder does not interpret it, it only places it.
Liquid in the docs and the example, Handlebars or anything else works the same.

```javascript
{
  type: 'Customer segment',                 // category in the picker, groups conditions
  label: 'Recurring buyers',                // name shown in the picker and on the row
  description: 'More than three orders',   // help text in the picker
  before: '{% if customer.orders_count > 3 %}',
  after: '{% endif %}',
}
```

- `before` or `after` is required. Both together is the common case.
- The builder adds no closing statement on its own. `before` only and `after` only exist for multi-row logic:

| Row   | Condition                                          |
| ----- | -------------------------------------------------- |
| Row 1 | `{% if a %}` as `before` only                       |
| Row 2 | `{% elsif b %}` as `before`, `{% else %}` as `after` |
| Row 3 | `{% endif %}` as `after` only                       |

- In the HTML output the syntax and the row markup are kept apart, so the sending engine can delete, repeat or change the row without touching the rest of the message.

## Predefined conditions in the config

```javascript
const beeConfig = {
  container: 'beefree-sdk-container',
  rowDisplayConditions: [ /* condition objects as above */ ],
}
```

End users pick one by category or by search from the row's **Display condition** section, change it, or edit its syntax when their role allows.
The configuration parameters page lists `rowDisplayConditions` with the type `object`; the display conditions page, the example and the npm types use an array.

With no array and a role that allows adding, the builder shows only **Add condition**, where the user types the syntax by hand.

## The builder dialog

```javascript
contentDialog: {
  rowDisplayConditions: {
    label: 'Build a condition',
    handler: function (resolve, reject, current) {
      // current: the condition already on the row, or undefined
      openYourBuilder(current)
        .then(condition => resolve(condition))   // { type, label, description, before, after }
        .catch(() => reject())
    },
  },
},
```

- The label becomes a button in the display condition widget of the row.
- The third argument is the row's current condition, in the shape below, when one is set. The docs call it `currentCondition` and say the name is free.
- The resolved object is validated like an array entry. A wrong shape logs `Error getting content rowDisplayConditions, the item is malformed.` and inserts nothing.
- `resolve` or `reject` is mandatory, or the builder stays in waiting mode.

Shape the builder passes back for a condition made in a dialog:

```javascript
{ label: '', description: '', before: '', after: '', type: 'BEE_CUSTOM_DISPLAY_CONDITION' }
```

The example resolves with that same `type` value. The docs do not say whether another `type` is accepted from the dialog.

## Custom conditions

A predefined condition edited by the user, or one made in the dialog, is a custom condition:

- a blue dot next to its name,
- no **Change condition** button, it can only be removed,
- a trash icon instead of the cancel icon, because once removed it is gone.

The builder does not write custom conditions back into `rowDisplayConditions`; the host app owns that array.
Read the condition from the saved template JSON if it should be offered again.

## Who can do what

Roles, set in the Developer Console when the feature is on, give three levels:

| Level               | Role settings                    | End user sees                                                              |
| ------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| View and preview    | nothing selected                 | Conditions on loaded rows are read-only, and can be toggled in Preview     |
| Select only         | "Can select conditions" (remove follows) | Pick from the array, no add, no edit                                |
| Full control        | all selected                     | Pick, edit the syntax, add a new one, use the dialog                       |

`advancedPermissions.rows.displayConditions: { show, locked }` hides or locks the section for a given `beeConfig`, independent of roles.

## On the stage and in the preview

With **Highlight rows with Display Conditions** on: a dashed border and a label with the condition name on the row, hidden while the row or a module inside it is selected; the eye icon in the stage toolbar hides labels and borders, and hidden rows with them.
With it off: a small branch icon in the row's structure tag on hover; the eye icon controls hidden rows only.

In **Preview**, a toggle per condition simulates what a recipient in that segment sees.

## Observed in the builder on 2026-09-03

Superpowers application, builder loaded through the hosted loader script, console switch on.

- The console switch is labelled **Row Display Conditions**; the docs page says Display Conditions.
- The row properties gained a **Dynamic content** section holding **Display condition** with three buttons: **Select condition** (the picker over `rowDisplayConditions`, categories plus search), **Add condition** (manual syntax), and the content dialog label.
- With a condition applied the section shows name, description, `before`, `after`, **Edit**, **Delete**, and the buttons **Replace condition** plus the dialog label.
- A condition made in the dialog shows a **CUSTOM** badge and loses **Replace condition**. The docs describe a blue dot; the current UI uses the badge.
- The dialog received the current condition as its third argument, with `label` and `description` filled.
- The dialog's resolved object was accepted without `isActive`; the saved JSON carries `type: BEE_CUSTOM_DISPLAY_CONDITION`.
- In the HTML output the `before` text sits right before the row's outer `<table>` and the `after` text right after it, inside the surrounding cell.
- An eye icon appeared in the stage toolbar once a condition existed.

## Observed in the official example

- The React handler stores `resolve` and `reject` in component state, opens a modal, and the modal's confirm and cancel call them. The config is assembled inside the component for that reason.
- The modal offers a field list, an operator list and a value, joins several rules with `and`, quotes non-numeric values, shows a live syntax preview, and resolves `type: 'BEE_CUSTOM_DISPLAY_CONDITION'`.
- The example's 14 predefined conditions carry an extra `isActive: false` field. In the npm package types (`IPluginDisplayCondition`, read on 2026-09-03) it is the only required field of an array entry, and `rowDisplayConditions` is typed as an array; the docs snippets omit `isActive`. The value the dialog resolves is typed with five required strings: `type`, `label`, `description`, `before`, `after`.
- The example README describes the console switch as **Configure Applications → Display Conditions → ON**, and states the plan as Core.
