# Custom Rendering

?> See also the [General Overview](/tutorial/overview.md).

A tree ...

## Configuration and Customization

### Related Tree Options

**Note:**
See also the [Edit Tutorial](tutorial_edit.md) for specific rendering
of embedded input controls.

```js
const tree = new Wunderbaum({
  ...
  types: {},
  columns: [
    { id: "*", title: "Product", width: "250px" },
    { id: "author", title: "Author", width: "200px" },
    { id: "year", title: "Year", width: "50px", classes: "wb-helper-end" },
    { id: "qty", title: "Qty", width: "50px", classes: "wb-helper-end" },
    {
      id: "price",
      title: "Price ($)",
      width: "80px",
      classes: "wb-helper-end",
    },
    { id: "details", title: "Details", width: "*" },
  ],
  ...
  // --- Events ---
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
});
```

### Related Methods

- `util.setValueToElem()`
- `util.toggleCheckbox()`

### Performance Tips

Use `tree.runWithDeferredUpdate()` to avoid multiple updates when changing many 
nodes at once.

```js
tree.runWithDeferredUpdate(() => {
  tree.visit((node) => {
    node.setSelected(true);
  });
});
```

### Related CSS Rules

```css
div.wunderbaum.wb-grid.wb-cell-mode div.wb-row.wb-active span.wb-col.wb-active {
  /* Highlighted cell in cell-nav mode */
}
```

### Code Hacks

```js
```
