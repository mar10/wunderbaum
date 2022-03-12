## Edit Nodes and Columns

> See also the [Wunderbaum Overview](tutorial.md) for a general overview.

## Configuration and Customization

### Related Tree Options

```js
const tree = new Wunderbaum({
  // --- Common Options ---
  ...
  // --- Common Events ---
  /**
   * Called editing control .
   *
   * Called when an input control, that is embedded in a node's row, fires a
   * `change` event. This is the case, when the edit-title functionality had
   * created an `<input>` element or if we rendered input elements in other
   * colum cells.
   *
   * Return a string value or a Promise.
   */
  change: function (e) {
    // e.node.setTitle(e.inputValue)
  },
  ...
  // --- Special Options and Events ---
  edit: {
    // --- Options ---
    trigger: ["F2", "macEnter", ...],
    ...
    // --- Events ---
    render: function (e) {
      // console.log(e.name, e.isNew, e);
    },
    /**
     * Called when an editing request was detected, e.g. `F2` key, etc.
     *
     * Return `false` to prevent editing. Optionally an HTML string may be
     * returned that defines the temporary input element.
     * Any other return value - including undefined - will defaults to
     * `'<input type="text" class="wb-input-edit" value="TITLE" required="" autocorrect="off">'`
     */
    beforeEdit: (e) => {
    },
    /**
     * Called after the temporary input control was created, initialized
     * with the current node title, and focused.
     */
    edit: (e) => {
      let inputElem = e.inputElem;
    },
    /**
     * Called when the edit operation is ending, either because the user
     * cancelled, confirmed, or moved focus
     *
     * Return `false` to keep the input control open.
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
span.wb-col.wb-dirty {}
span.wb-col.wb-error {}
input.wb-input-edit {}
```
