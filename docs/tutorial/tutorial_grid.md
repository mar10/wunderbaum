# Grid

## Column Definitions

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
      classes: "wb-helper-end",
    },
    { id: "details", title: "Details", width: "*" },
  ],
  ...
  // --- Events ---
  render: function (e) {
    const node = e.node;
    const util = e.util;
    // console.log(e.type, e.isNew, e);
  },
});
```


## Editing

> TODO

## Rendering

> TODO

## Configuration and Customization

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
- `tree.setColumn(colIdx: number)`


### Related CSS Rules

```css
```

### Code Hacks

#### Redefine columns:

```js
tree.columns.push(
  { title: "New Col", id: "col_" + sequence++, width: "100px" }
)
tree.update("colStructure")
```
