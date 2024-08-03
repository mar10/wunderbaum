# Edit Nodes and Columns

Editing is supported in two different ways:

1. There is direct support for renaming nodes, i.e. editing the node title.
   Use the `edit.trigger` option and implement the `edit.apply()` callback
   to enable this.

2. In a treegrid, there is also general support for embedded input elements
   in column cells, like checkboxes, text fields, etc.<br>
   Note that _Wunderbaum_ does **not** implement fancy input controls though.
   Rather think of it as a framework that makes it easy to use standard or
   custom HTML controls: <br>
   Create HTML controls in the `tree.render()` callback and implement the
   `tree.change()` event to enable this.

## 1. Rename Nodes

Here is an example implementation of the edit title feature (i.e. rename):

```js
const tree = new Wunderbaum({
  // --- Common Options ---
  ...
  // --- Common Events ---
  ...
  // --- Special Options and Events ---
  edit: {
    // --- Options ---
    trigger: ["clickActive", "F2", "macEnter", ...],
    select: true,  // Select all text on start
    slowClickDelay: 1000,
    trim: true,  // Trim input before applying
    validity: true,  // Check validation rules while typing
    ...
    // --- Events ---
    /**
     * Called when an editing request was detected, e.g. `F2` key, etc.
     *
     * Return `false` to prevent editing. Optionally an HTML string may be
     * returned that defines the temporary input element.
     * Any other return value - including undefined - defaults to
     * `'<input type="text" class="wb-input-edit" value="TITLE" required autocorrect="off">'`
     */
    beforeEdit: (e) => {
    },
    /**
     * Called after the temporary input control was created, initialized
     * with the current node title, focused, and selected.
     */
    edit: (e) => {
      const inputElem = e.inputElem;
    },
    /**
     * Called when the edit operation is ending, either because the user
     * canceled, confirmed, or moved focus.
     *
     * Return `false` to keep the input control open (not always possible).
     *
     * We can also return a `Promise` (e.g. from an Ajax request).
     * In this case, the cell is marked 'busy' while the request is pending.
     *
     * Implementing this event is optional. By default, `node.setTitle()` is
     * called with the new text.
     */
    apply: (e) => {
      const node = e.node;
      const oldValue = e.oldValue;
      const newValue = e.newValue;
      const inputElem = e.inputElem;
      // For example:
      // call an async storage function and  handle validation.
      //
      return storeMyStuff(node.refKey, newValue).then(() => {
        if( ...) {
          inputElem.setCustomValidity(`Invalid for *reasons*: ${newValue`})
          return false;
        }
      };
    },
  },
});
```

Input validation can be implemented by using the `inputElem.setCustomValidity()`
method as in the example above, or by raising a
[util.ValidationError](https://mar10.github.io/wunderbaum/api/classes/ValidationError.html):

```js
const tree = new Wunderbaum({
  ...
  edit: {
    ...
    apply: (e) => {
      const util = e.util;
      const node = e.node;
      const newValue = e.newValue;

      return storeMyStuff(node.refKey, newValue).then(() => {
        if( ...) {
          throw new util.ValidationError(`Invalid for *reasons*: ${newValue`});
        }
      };
    },
  },
});
```

!!! info

    See also a [live demo](https://mar10.github.io/wunderbaum/demo/#demo-plain),
    activate a node, and hit <code>F2</code>.

!!! info

    See also [EditOptionsType](https://mar10.github.io/wunderbaum/api/types/types.EditOptionsType.html).

### Related Methods

- `node.setActive(true, {colIdx: 0, edit: true})`
- `node.startEditTitle()`
- `tree.isEditingTitle()`
- `tree.startEditTitle(node)`
- `tree.stopEditTitle(apply: boolean)`
- `util.setValueToElem()`

### Style Hacks

```css
input.wb-input-edit {}
span.wb-col.wb-busy {}
span.wb-col.wb-error {}
span.wb-col.wb-invalid {}
span.wb-col input:invalid {}
wb-tristate
```

### Code Hacks

```js
Todo;
```

## 2. Edit Cell Content

!!! info

    See the [Grid Tutorial](tutorial_grid.md?id=editing) for general
    information about rendering grid cell content.

!!! info

    See also a [live demo](https://mar10.github.io/wunderbaum/demo/#demo-editable),
    expand some nodes and enter values into the input controls.

Editing cells &mdash; other than the node title column &mdash; is not supported
by default. Instead we have to

1. Implement the `render(e)` callback to render the cell's content as an HTML
   element that can be edited, like a text field, checkbox, etc.
2. Implement the `change(e)` callback to update the node data when the user
   has finished editing a cell.

### 2.1. Render Input Elements

Following an example implementation of the `render(e)` callback that renders
embedded input controls for all data columns.

The [util.setValueToElem()](https://mar10.github.io/wunderbaum/api/functions/util.setValueToElem.html)
helper function can be used to update the embedded input element with the
current node value.

The `e.isNew` property is `true` if the node is new and has not been
rendered before. This is useful to avoid overwriting user input when the
user is editing a cell.

We follow the convention to name the column id after the node data property
that should be rendered in that column for simplicity.

```js
const tree = new Wunderbaum({
  ...
  columns: [
    { title: "Title", id: "*", width: "250px" },
    { title: "Age", id: "age", width: "50px", classes: "wb-helper-end" },
    { title: "Date", id: "date", width: "100px", classes: "wb-helper-end" },
    { title: "Status", id: "state", width: "70px", classes: "wb-helper-center" },
    { title: "Avail.", id: "avail", width: "70px", classes: "wb-helper-center" },
    { title: "Remarks", id: "remarks", width: "*" },
  ],

  render: function (e) {
    const node = e.node;
    const util = e.util;

    // Render embedded input controls for all data columns
    for (const col of Object.values(e.renderColInfosById)) {

      const val = node.data[col.id];

      switch (col.id) {
        case "author":
          if (e.isNew) {
            col.elem.innerHTML = '<input type="text" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        case "remarks":
          if (e.isNew) {
            col.elem.innerHTML = '<input type="text" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        case "age": // numeric input (positive integers only)
          if (e.isNew) {
            col.elem.innerHTML = '<input type="number" min="0" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        case "state": // select box
          if (e.isNew) {
            col.elem.innerHTML = `<select tabindex="-1">
                <option value="h">Happy</option>
                <option value="s">Sad</option>
                </select>`;
          }
          util.setValueToElem(col.elem, val);
          break;
        case "avail": // checkbox
          if (e.isNew) {
            col.elem.innerHTML = '<input type="checkbox" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        case "date": // date picker
          if (e.isNew) {
            col.elem.innerHTML = '<input type="date" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        default:
          // Render all other node data cells as text (read-only)
          // Assumption: we named column.id === node.data.NAME
          col.elem.textContent = node.data[col.id];
          break;
      }
    },
});
```

#### Simplify the Pattern

The pattern above can be simplified by defining the `html` property in the
column definition, so the column cells are rendered by default and we can
skip the `if (e.isNew) {...}` handling. <br>
Note that we still have to update the embedded input elements with the current
node value.

```js
const tree = new Wunderbaum({
  ...
  columns: [
    { title: "Title", id: "*", width: "250px" },
    { title: "Age", id: "age", width: "50px", classes: "wb-helper-end",
      "html": "<input type=number min=0 tabindex='-1'>",
    },
    { title: "Date", id: "date", width: "100px", classes: "wb-helper-end",
      "html": '<input type=date tabindex="-1">',
    },
    { title: "Status", id: "state", width: "70px", classes: "wb-helper-center",
      "html": `<select tabindex="-1">
          <option value="h">Happy</option>
          <option value="s">Sad</option>
          </select>`
    },
    { title: "Avail.", id: "avail", width: "70px", classes: "wb-helper-center",
      "html": '<input type=checkbox tabindex="-1">',
    },
    { title: "Remarks", id: "remarks", width: "*",
      "html": "<input type=text tabindex='-1'>",
    },
  ],

  render: function (e) {
    const node = e.node;
    const util = e.util;

    // Render embedded input controls for all data columns
    for (const col of Object.values(e.renderColInfosById)) {

      const val = node.data[col.id];

      switch (col.id) {
        default:
          util.setValueToElem(col.elem, val);
          break;
      }
    }
  },
});
```

### 2.2. Validate and Apply Modified Cell Data

The `change(e)` callback is called when the user has finished editing a cell.
More precisely, it is called when the embedded _input_, _select_, or _textarea_
element fired a _change_ event. <br>
It receives a [WbChangeEventType](https://mar10.github.io/wunderbaum/api/interfaces/types.WbChangeEventType.html)
object that contains useful properties for this purpose.

The [util.getValueFromElem()](https://mar10.github.io/wunderbaum/api/functions/util.getValueFromElem.html)
helper function can be used to read the current value from the embedded input
element. This value is also avalable as `e.inputValue`, however without coercing
date inputs to _Date_ instances.

> Again, we follow the convention to name the column id after the node data
> property that appears in that column.

```js
const tree = new Wunderbaum({
  ...
  change: function (e) {
    const util = e.util;
    const node = e.node;
    const colId = e.info.colId;

    this.logDebug(`change(${colId})`, util.getValueFromElem(e.inputElem, true));

    // Assumption: we named column.id === node.data.NAME
    node.data[colId] = util.getValueFromElem(e.inputElem, true);
  },
});
```

If we want to customize the `change(e)` callback, we can do so like this:

```js
const tree = new Wunderbaum({
  ...
  change: function (e) {
    const util = e.util;
    const node = e.node;
    const colId = e.info.colId;
    let val;

    switch (colId) {
      case "year":
        val = util.getValueFromElem(e.inputElem, true);

        if(val && new Date(val) > new Date()) {
          throw new util.ValidationError("Invalid year (must not be in the past)");
        }
        if (val && !/^\d{4}$/.test(val)) {
          throw new util.ValidationError("Invalid year (yyyy)");
        }
        e.node.data[colId] = val;
        break;
      default:
        e.node.data[colId] = util.getValueFromElem(e.inputElem, true);
        break;
    }
  },
});
```

### Related Methods

- `node.setActive(true, {colIdx: 2, edit: true})`
- `util.getValueFromElem()`
- `util.setValueToElem()`
- `util.toggleCheckbox()`

### Related CSS Rules

```css
span.wb-col.wb-busy {
}
span.wb-col.wb-error {
}
span.wb-col input:invalid {
}
```
