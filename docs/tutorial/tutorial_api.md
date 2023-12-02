# Tree API

!> This chapter is still under construction.

This chapter describes different ways to modify the tree model using
the API.

<!-- ?> See also the [Grid Tutorial](/tutorial/tutorial_grid.md) for specific
rendering of grid cells and the [Edit Tutorial](/tutorial/tutorial_edit.md) for
rendering of embedded input controls in grids. -->

## Iteration

There are two ways to traverse the tree _depth-first, pre-order_

```js
for (const node of tree) {
  node.log();
}
```

```js
tree.visit((node) => {
  node.log();
});
```

Both are 'fast enough' for most use cases, but the latter is slightly faster.

`visit()` also allows to break or skip nodes by returning a
special value:

```js
tree.visit((node) => {
  if (node.isSelected()) {
    return "skip"; // skip selected nodes and their children
  }
  if (node.title === "foo") {
    return false; // stop iteration
  }
});
```

Iteration is also available for subnodes:

```js
for(const node of parentNode) {
  ...
}
parentNode.visit((node) => {
  ...
});
```

### Related Methods

- `node.moveTo()`
- `node.setExpanded()`
- `node.setSelected()`
- `tree.applyCommand()`

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
