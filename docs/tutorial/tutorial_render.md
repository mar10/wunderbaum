# Custom Rendering

!> This chapter is still under construction.

This chapter describes different ways to customize the appearance of the tree.

?> See also the [Grid Tutorial](/tutorial/tutorial_grid.md) for specific
rendering of grid cells and the [Edit Tutorial](/tutorial/tutorial_edit.md) for
rendering of embedded input controls in grids.

## Custom Icons

This example uses [Font Awesome Icons](https://fontawesome.com/icons) instead
of the default [Bootstrap Icons](https://icons.getbootstrap.com/) icon font:

```html
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
    />
    ...
  </head>
</html>
```

```js
const tree = new mar10.Wunderbaum({
  element: document.getElementById("demo-tree"),
  source: "get/root/nodes",
  iconMap: "fontawesome6",  // <-- use Font Awesome Icons
  ...
});
```

`iconMap` can also be a custom map of icon names, for example:

```js
const tree = new mar10.Wunderbaum({
  ...
  iconMap: {
    error: "bi bi-exclamation-triangle",
    loading: "bi bi-chevron-right wb-busy",
    noData: "bi bi-question-circle",
    expanderExpanded: "bi bi-chevron-down",
    expanderCollapsed: "bi bi-chevron-right",
    expanderLazy: "bi bi-chevron-right wb-helper-lazy-expander",
    checkChecked: "bi bi-check-square",
    checkUnchecked: "bi bi-square",
    checkUnknown: "bi bi-dash-square-dotted",
    radioChecked: "bi bi-circle-fill",
    radioUnchecked: "bi bi-circle",
    radioUnknown: "bi bi-record-circle",
    folder: "bi bi-folder2",
    folderOpen: "bi bi-folder2-open",
    folderLazy: "bi bi-folder-symlink",
    doc: "bi bi-file-earmark",
   },
  ...
});
```

## Custom Style Sheets

```css
div.wunderbaum.wb-grid.wb-cell-mode div.wb-row.wb-active span.wb-col.wb-active {
  /* Highlighted cell in cell-nav mode */
}
```

## Custom Markup

### Using the `render` Event

?> See also a [live demo](https://mar10.github.io/wunderbaum/demo/#demo-editable).

```js
const tree = new Wunderbaum({
  ...
  types: {},
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

### Badges

Example: Display the number of selected subnodes in the badge of collapsed parent:

```js
const tree = new Wunderbaum({
  ...
  iconBadge: (e) => {
    const node = e.node;
    if (node.expanded || !node.children) {
      return;
    }
    const count = node.children && node.getSelectedNodes()?.length;
    return {
      badge: count,
      badgeTooltip: `${count} selected`,
      badgeClass: "selection-count",
    };
  },
  ...
});
```

### Related Tree Options

### Related Methods

- `util.toggleCheckbox()`

### Related CSS Rules

### Code Hacks

```js

```
