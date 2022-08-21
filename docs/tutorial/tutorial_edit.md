# Edit Nodes and Columns

?> See also the [General Overview](/tutorial/overview.md).

Editing is supported in two different ways:

  1. There is direct support for renaming nodes, i.e. editing the node title.
     Use the `edit.trigger` option and implement the `edit.apply()` callback
     to enable this.

  2. In a treegrid, there is also general support for embedded input elements
     in column cells, like checkboxes, text fields, etc.<br>
     Note that *Wunderbaum* does **not** implement fancy input controls though.
     Rather think of it as a framework that makes it easy to use standard or
     custom HTML controls: <br>
     Create HTML controls in the  `tree.render()` callback and implement the
     `tree.change()` event to enable this.

## 1. Rename Nodes

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
     * We can also return a `Promise` (e.g. from an ajax request).
     * In this case, the cell is marked 'busy' while updating.
     *
     * Implementing this event is optional. By default, `node.setTitle()` is
     * called with the new text.
     */
    apply: (e) => {
      const node = e.node;
      const oldValue = e.oldValue;
      const newValue = e.newValue;
      const inputElem = e.inputElem;
      // An async storage call that handles validation
      return storeMyStuff(node.refKey, newValue).then(() => {
        if( ...) {
          e.inputElem.setCustomValidity("Invalid for *reasons*: " + e.newValue)
          return false;
        }
      };
    },
  },
});
```

### Related Methods

- `tree.isEditingTitle()`
- `tree.startEditTitle(node)`
- `tree.stopEditTitle(apply: boolean)`

### Style Hacks

```css
input.wb-input-edit {}
span.wb-col.wb-busy {}
span.wb-col.wb-error {}
span.wb-col input:invalid {}
```

### Code Hacks

```js
```

## 2. Edit Cell Content

### Related Tree Options

**Note:**
See also the [Render Tutorial](tutorial_render.md) for a general rendering
description.

```js
const tree = new Wunderbaum({
  // --- Common Options ---
  ...
  // --- Common Events ---
  /**
   * Called when a node is rendered.
   *
   * We can do many things here, but related to editing, a typical aspect is
   * rendering `<input>` elements in column cells.
   */
  render: function (e) {
    const node = e.node;
    const util = e.util;
    // console.log(e.type, e.isNew, e);
  },
  /**
   * Called when an input control, that is embedded in a node's row, fires a
   * `change` event.
   *
   * Return a string value or a Promise (e.g. from an ajax request).
   * In the latter case, the cell is marked 'busy' while updating.
   */
  change: function (e) {
    const node = e.node;
    const util = e.util;
    // e.node.datasetTitle(e.inputValue)
  },
  ...
});
```

### Related Methods

- `util.getValueFromElem()`
- `util.setValueToElem()`
- `util.toggleCheckbox()`

### Related CSS Rules

```css
span.wb-col.wb-busy {}
span.wb-col.wb-error {}
span.wb-col input:invalid {}
```
