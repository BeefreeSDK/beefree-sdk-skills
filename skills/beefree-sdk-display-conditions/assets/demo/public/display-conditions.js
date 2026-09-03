// Display conditions for the Beefree SDK demo page: ready-made conditions plus a builder dialog for new ones.
// Requires the Display Conditions switch on in the Developer Console (see SKILL.md, Step 2).
// Load this file before app.js, then:
//   BeePlugin.create(token, withDisplayConditions(beeConfig), ...)

// Demo shortcut: Liquid syntax, as in the docs and the official example. Use whatever your sending engine understands.
const DISPLAY_CONDITIONS = [
  { type: 'Customer segment', label: 'New customers', description: 'Exactly one order so far', before: '{% if customer.orders_count == 1 %}', after: '{% endif %}' },
  { type: 'Customer segment', label: 'Recurring buyers', description: 'More than three orders', before: '{% if customer.orders_count > 3 %}', after: '{% endif %}' },
  { type: 'Loyalty', label: 'VIP members', description: 'More than 500 loyalty points', before: '{% if customer.points > 500 %}', after: '{% endif %}' },
  { type: 'Region', label: 'Europe', description: 'Recipients in Europe', before: '{% if customer.region == "europe" %}', after: '{% endif %}' },
]

// What the builder dialog offers. A real app takes these from its own data model.
const CONDITION_FIELDS = [
  ['customer.orders_count', 'Orders count'],
  ['customer.points', 'Loyalty points'],
  ['customer.region', 'Region'],
  ['customer.tier', 'Tier'],
  ['last_order.total', 'Last order total'],
]
const CONDITION_OPERATORS = [['==', 'equals'], ['!=', 'not equals'], ['>', 'greater than'], ['<', 'less than']]

function conditionSyntax(field, operator, value) {
  const literal = value !== '' && !isNaN(Number(value)) ? value : '"' + value + '"'
  return '{% if ' + field + ' ' + operator + ' ' + literal + ' %}'
}

// Native <dialog>: name, description, one rule (field, operator, value) and a live syntax preview.
// Resolves a condition object, or null when cancelled. Pre-fills name and description when editing an existing condition.
function buildCondition(current) {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog')
    const options = (pairs, selected) => pairs.map(([v, t]) => '<option value="' + v + '"' + (v === selected ? ' selected' : '') + '>' + t + '</option>').join('')
    dialog.innerHTML =
      '<form method="dialog" style="display:grid;gap:10px;min-width:420px;font-family:system-ui,sans-serif">' +
      '<strong>Build a display condition</strong>' +
      '<label>Name<br><input name="label" required style="width:100%;padding:6px"></label>' +
      '<label>Description<br><input name="description" style="width:100%;padding:6px"></label>' +
      '<div style="display:flex;gap:6px"><select name="field">' + options(CONDITION_FIELDS) + '</select>' +
      '<select name="operator">' + options(CONDITION_OPERATORS) + '</select>' +
      '<input name="value" placeholder="value" required style="flex:1;padding:6px"></div>' +
      '<code data-preview style="display:block;padding:6px;background:#f5f7fa"></code>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button type="button" data-cancel>Cancel</button><button value="ok">Apply</button></div></form>'
    const form = dialog.querySelector('form')
    const preview = dialog.querySelector('[data-preview]')
    if (current) {
      form.label.value = current.label || ''
      form.description.value = current.description || ''
    }
    function render() {
      preview.textContent = conditionSyntax(form.field.value, form.operator.value, form.value.value) + ' … {% endif %}'
    }
    form.addEventListener('input', render)
    render()
    dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close('cancel'))
    dialog.addEventListener('close', () => {
      const ok = dialog.returnValue === 'ok'
      const condition = ok
        ? {
            type: 'BEE_CUSTOM_DISPLAY_CONDITION', // the value the builder passes back for a condition made in a dialog
            label: form.label.value.trim(),
            description: form.description.value.trim(),
            before: conditionSyntax(form.field.value, form.operator.value, form.value.value.trim()),
            after: '{% endif %}',
          }
        : null
      dialog.remove()
      resolve(condition)
    })
    document.body.appendChild(dialog)
    dialog.showModal()
    form.label.focus()
  })
}

// Merges the display conditions keys into an existing beeConfig and returns it.
// Keeps a contentDialog already present (for example mergeTags from the content dialog skill).
function withDisplayConditions(beeConfig) {
  beeConfig.rowDisplayConditions = (beeConfig.rowDisplayConditions || []).concat(DISPLAY_CONDITIONS)
  beeConfig.contentDialog = Object.assign({}, beeConfig.contentDialog, {
    rowDisplayConditions: {
      label: 'Build a condition',
      // The third argument is the condition already on the row, when there is one.
      handler: function (resolve, reject, current) {
        buildCondition(current)
          .then(condition => (condition ? resolve(condition) : reject()))
          .catch(() => reject())
      },
    },
  })
  return beeConfig
}
