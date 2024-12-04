# Selection

Wunderbaum supports hierarchical selection, and radio-groups.

### Related Tree Options

```js
const tree = new Wunderbaum({
  // --- Common Options ---
  selectMode: "multi",  // 'single', 'multi', 'hier'
  checkbox: true, // boolean, "radio", or a callback
  ...
  // --- Common Events ---
  beforeSelect: function (e) {
    // return false to prevent selection
  },
  select: function (e) {
    console.log(`Selected ${e.node}: ${e.flag}`);
    console.log("Selected nodes:", e.tree.getSelectedNodes());
  },
  ...
});
```

!!! info

    See also the [Selection Example](https://mar10.github.io/wunderbaum/demo/#demo-select).

### Related Node Properties

```js
[
  { title: "Node 1", selected: true },
  { title: "Node 2", checkbox: true },
  { title: "Node 3", unselectable: true, radiogroup: true
    children: [
      { title: "Option 1", selected: true },
      { title: "Option 2" },
    ]
  },
]
```

### Related Methods

- `node.fixSelection3AfterClick()`
- `node.fixSelection3FromEndNodes()`
- `node.getSelectedNodes()`
- `node.isSelected()`
- `node.setSelected(flag, options)`
- `node.toggleSelected()`
- `tree.getSelectedNodes()`
- `tree.selectAll(flag)`
- `tree.toggleSelect()`

### Related CSS Rules

```css

```

### Code Hacks

Display the number of selected subnodes in the badge of collapsed parent:

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

```css
div.wunderbaum span.wb-badge.selection-count {
  color: white;
  background-color: green;
}
```
