# Grid

!!! abstract "TL;DR"

    Wunderbaum implements native support for treegrids (in fact, a plain tree
    is only a special case). <br>
    Rendering and editing of grid cells requires custom event handlers.

!!! info "See also"

    See also a [live demo](https://mar10.github.io/wunderbaum/demo/#demo-editable).

Wunderbaum works as a treegrid out of the box if we specify column definitions. <br>
In a treegrid, there is also general support for embedded input elements
in column cells, like checkboxes, text fields, etc.

Note that the treegrid is not editable by default however.
It does not even render cell content for columns other than the main (first)
node column. This has to be implemented in the `render(e)` callback instead. <br>
Wunderbaum does _not_ implement fancy input controls.
Rather think of it as a framework that makes it easy to use standard or custom
HTML controls: <br>
Create HTML controls in the `render(e)` callback and implement the
`change(e)` event to enable editing.

## Column Definitions

!!! info

    Column definitions are required to turn a plain Wunderbaum tree into a treegrid.

A list of column definitions is specified in the `columns` option.
`title` and `id` are required. `width` is optional, but recommended.

The `id` is used to identify the column in the `render` event. <br>
The special id `"*"` is used for the main node column with checkbox, connectors, icon, and title).
It is required and must be the first column in the list.

The `width` is either specified in absolute pixels (`"100px"`) or relative
weights (`"2.5"`). Column widths default to `"*"`, which is equivalent to `"1.0"` <br>
Absolute widths are applied first, then the remaining space is distributed
among the relative weights.

The `classes` property can be used to add CSS classes to the column header
and cells.

The `html` property can be used to define cell markup that is rendered by default.

```js
const tree = new Wunderbaum({
  ...
  columns: [
    { id: "*", title: "Product", width: "250px" },
    { id: "author", title: "Author", width: "200px" },
    { id: "year", title: "Year", width: "50px", classes: "wb-helper-end" },
    { id: "qty", title: "Qty", width: "50px", classes: "wb-helper-end" },
    {
      id: "price",
      title: "Price ($)",
      width: "80px",
      classes: "wb-helper-end",  // (1)
    },
    { id: "details", title: "Details", width: "*" },
  ],
  ...
});
```

1.  This classes are added to all header and row cells of that column.
    In this case: right align the content of the column.

!!! info

    See also
    [ColumnDefinition](https://mar10.github.io/wunderbaum/api/interfaces/types.ColumnDefinition.html)
    for details.

## Hiding Columns

The `hidden` column option (since v0.16) hides a column, either always or depending on a
condition. The most important use case is responsiveness, i.e. hiding less
important columns when the grid becomes narrow.

```js
const tree = new Wunderbaum({
  ...
  columns: [
    { id: "*", title: "Product", width: "250px" },
    // Always hidden
    { id: "sku", title: "SKU", hidden: true },
    // Hidden while the tree is in size class `sm` or smaller (i.e. < 768px)
    { id: "author", title: "Author", hidden: "sm" },
    // Hidden while the tree is 600px wide or less
    { id: "year", title: "Year", width: "50px", hidden: 600 },
    // Hidden if the callback returns true
    {
      id: "details",
      title: "Details",
      hidden: (e) => e.width < 900 || !e.tree.options.showDetails,
    },
  ],
});
```

`hidden` accepts

- `true` / `false`
- a size class: `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`.
  The column is hidden while the tree width is in that size class
  _or smaller_, e.g. `"sm"` hides the column below the `md` breakpoint.
- a number: the column is hidden while the tree width is at most this many pixels.
- a callback `(e) => boolean`, which receives `e.tree`, `e.column`, `e.width`
  (tree width in pixels), and `e.breakpoint` (current size class).

The size classes are compared against the width of the tree element
(not the browser window), so a grid in a narrow sidebar behaves like a grid on
a small screen. The default breakpoints are similar to Bootstrap and can be
changed with the `breakpoints` tree option:

```js
const tree = new Wunderbaum({
  ...
  breakpoints: { sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 },
});
```

Visibility is re-evaluated whenever the column widths are recalculated, e.g.
when the tree element is resized. To re-evaluate a callback after some other
state changed, call `tree.update("colStructure")`.

Hidden columns keep their index (e.g. `e.info.idx`, `tree.activeColIdx`,
`aria-colindex`), are skipped by keyboard navigation, and are not contained in
`e.renderColInfosById` of the `render` event.
The first column (`"*"`) cannot be hidden.

## Variable Row Height

By default all rows have the same height (`rowHeightPx`) and cell content that
does not fit is clipped. <br>
The `autoRowHeight` tree option (since v0.16) lets rows grow with their content
instead. Set the `wrap` column option to wrap long text into multiple lines
(or `columnsWrap` to define a default for all columns):

```js
const tree = new Wunderbaum({
  ...
  autoRowHeight: true,
  // columnsWrap: true,  // default for all columns
  columns: [
    { id: "*", title: "Task", width: "250px", wrap: true },
    { id: "state", title: "State", width: "90px" },  // clipped as before
    { id: "description", title: "Description", wrap: true },
  ],
  ...
});
```

The height of a row is the height of its tallest cell, so this also works for
custom markup that is created in the `render` event. `rowHeightPx` is used as
minimum height.

Use `maxRowHeightPx` to limit the height of a row. Content that exceeds this
limit is clipped:

```js
const tree = new Wunderbaum({
  ...
  autoRowHeight: true,
  maxRowHeightPx: 100,
  ...
});
```

Add this CSS rule to make clipped cells scrollable instead:

```css
div.wunderbaum.wb-auto-row-height span.wb-col.wb-wrap {
  overflow-y: auto;
}
```

!!! note

    A scrollable cell handles the mouse wheel first, so scrolling the tree
    may feel less smooth while the pointer is over such a cell. The scrollbar
    may also reduce the available width for the text.

The `wrap` option can also be set in a node type definition. This overrides
the column option for all cells of matching nodes:

```js
const tree = new Wunderbaum({
  ...
  autoRowHeight: true,
  columnsWrap: true,
  types: {
    folder: { wrap: false },  // never wrap folder rows
  },
  ...
});
```

Wunderbaum only renders the rows that are visible in the viewport, so a row is
measured when it is rendered: initially, when it is scrolled into view, and
whenever its content or the column widths change. Rows that have not been
rendered yet are assumed to have the default height. This has some implications:

- The size and position of the scrollbar thumb is an estimation that becomes
  more precise while scrolling.
- If the size of a cell changes _without_ rendering, e.g. because an embedded
  image was loaded or the markup was modified by custom code, call
  `node.update()` to measure the row again.
- Measuring forces the browser to calculate the layout, so the fixed row height
  remains the fastest option for very large trees.

See also the
[live demo](https://mar10.github.io/wunderbaum/demo/#demo-wrap).

## Rendering

Wunderbaum renders the first column (the main node column) by default.
To render additional columns, implement the `render(e)` callback.

The render event receives a
[WbRenderEventType](https://mar10.github.io/wunderbaum/api/interfaces/types.WbRenderEventType.html)
object that contains useful properties for this purpose.

We can use the `e.renderColInfosById` property to iterate over all columns
and render the content of each column. <br>
This can be simplified by following the convention to name the column id
after the node data property that should be rendered in that column.

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
  render: function (e) {
    const node = e.node;

    for (const col of Object.values(e.renderColInfosById)) {
      switch (col.id) {
        default:
          // Assumption: we named column.id === node.data.NAME
          col.elem.textContent = node.data[col.id];
          break;
      }
    }
  },
});
```

If we want to render formatted values, we can do this explicitly for each column:

```js
const tree = new Wunderbaum({
  ...
  render: function (e) {
    const node = e.node;

    for (const col of Object.values(e.renderColInfosById)) {
      const val = node.data[col.id];

      switch (col.id) {
        case "date":
          if (val) {
            const dt = new Date(val);
            col.elem.textContent = dt.toISOString().slice(0, 10);
          } else {
            col.elem.textContent = "n.a.";
          }
          break;
        case "state":
          {
            const map = { h: "Happy", s: "Sad" };
            col.elem.textContent = map[val] || "n.a.";
          }
          break;
        case "avail":
          col.elem.textContent = val ? "Yes" : "No";
          break;
        default:
          // Assumption: we named column.id === node.data.NAME
          col.elem.textContent = val;
          break;
      }
    }
  },
});
```

!!! info

    See the [Edit Tutorial](tutorial_edit.md) for examples how to render
    embedded controls.

## Editing

Editing cells &mdash; other than the node title column &mdash; is not supported
by default. Instead we have to

1. Implement the `render(e)` callback to render the cell's content as an HTML
   element that can be edited, like a text field, checkbox, etc.
2. Implement the `change(e)` callback to update the node data when the user
   has finished editing a cell.

!!! info

    See the [Edit Tutorial](tutorial_edit.md) for details.

## Navigation

A treegrid can have one of two navigation modes. We can toggle using the keyboard:

Row Mode ↔ Cell-Nav Mode

!!! info

    See the [Keyboard Tutorial](tutorial_keyboard.md) for details.

## Configuration and Customization

!!! note

    Todo.

### Related Tree Options

```js
const tree = new Wunderbaum({
  ...
  navigationModeOption: "startRow",  // | "cell" | "startCell" | "row"
  columns: [],
  rowHeightPx: 22,
  autoRowHeight: false,  // rows grow with their content
  maxRowHeightPx: undefined,  // limit the height if `autoRowHeight` is set
  columnsWrap: false,    // default for the `wrap` column option
  ...
  // --- Events ---
  render: (e) => {
    // Return false to prevent default behavior
  }
  ...
  edit: {
    trigger: ["F2", "macEnter", ...],
    ...
  },
});
```

### Related Methods

- `tree.setNavigationOption(mode: NavModeEnum)`
- `tree.setColumn(colIdx: number|string,  options?: SetColumnOptions)`
- `tree.isColumnVisible(colIdOrIdx: string|number)`
- `tree.getBreakpoint()`: current size class of the tree width (`"xs"` ... `"xxl"`)

### Related CSS Rules

```css
/* Header and body cells of hidden columns */
span.wb-col.wb-col-hidden {
  display: none;
}

/* Set on the tree element if `autoRowHeight` is enabled */
div.wunderbaum.wb-auto-row-height {
}

/* Body cells of columns with the `wrap` option */
span.wb-col.wb-wrap {
  white-space: normal;
}

```

### Code Hacks

#### Redefine Columns

For example to append a new column:

```js
tree.columns.push({
  title: "New Col",
  id: "col_" + sequence++,
  width: "100px",
});
tree.update("colStructure");
```

#### Add a Menu Button to the Column Header

Add a filter button to the column header to toggle the filter mode:

```js
const tree = new Wunderbaum({
  ...
  columns: [
    {
      title: "Title",
      menu: true,
      ...
    },
    ...
  ],
  buttonClick: (e) => {
    if (e.command === "menu") {
      alert("Open menu...");
    }
  },
  ...
});
```

#### Add a Sort Button to the Column Header

Add a sort button to the column header and handle click events to toggle
the order:

```js
const tree = new Wunderbaum({
  ...
  columns: [
    {
      title: "Title",
      sortable: true, // or set in column definition
      ...
    },
    ...
  ],
  columnsSortable: true, // or set in column definition
  buttonClick: (e) => {
    if (e.command === "sort") {
      e.tree.sortByProperty({ colId: e.info.colId, updateColInfo: true });
    }
  },
  ...
});
```
