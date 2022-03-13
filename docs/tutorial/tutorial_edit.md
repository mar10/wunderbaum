## Edit Nodes and Columns

> See also the [Wunderbaum Overview](tutorial.md) for a general overview.

Editing is supported in two different ways:

  1. There is direct support for renaming nodes, i.e. editing the node title.
     Use the `edit.trigger` option and implement the `edit.apply()` callback
     to enable this.

  2. In a tree grid, there is also general support for embedded input elements
     in column cells, like checkboxes, text fileds, etc.<br>
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
    trigger: ["F2", "macEnter", ...],
    select: true,  // Select all text on start
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
      let inputElem = e.inputElem;
    },
    /**
     * Called when the edit operation is ending, either because the user
     * canceled, confirmed, or moved focus.
     *
     * Return `false` to keep the input control open (not always possible).
     * It is also possible to return a `Promise` (e.g. from an ajax request).
     * In this case, the cell is marled 'busy' while updating.
     */
    apply: (e) => {
      let oldValue = e.oldValue;
      let newValue = e.newValue;
      let inputElem = e.inputElem;
    },
  },
});
```

### Related Methods

- `tree.isEditingTitle()`
- `tree.startEditTitle(node)`
- `tree.stopEditTitle(apply: boolean)`

### Related CSS Rules

```css
input.wb-input-edit {}
span.wb-col.wb-dirty {}
span.wb-col.wb-error {}
span.wb-col input:invalid {}
```

## 2. Edit Cell Content

### Related Tree Options

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
    // console.log(e.name, e.isNew, e);
  },
  /**
   * Called when an input control, that is embedded in a node's row, fires a
   * `change` event. This is the case when we rendered input elements in other
   * colum cells.
   *
   * Return a string value or a Promise.
   * It is also possible to return a `Promise` (e.g. from an ajax request).
   * In this case, the cell is marled 'busy' while updating.
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
span.wb-col.wb-dirty {}
span.wb-col.wb-error {}
span.wb-col input:invalid {}
```
