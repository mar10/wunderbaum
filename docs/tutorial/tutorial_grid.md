# Grid

!!! info

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

### Related CSS Rules

```css

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
