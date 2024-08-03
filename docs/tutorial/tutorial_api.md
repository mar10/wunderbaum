# Tree API

!!! note

    This chapter is still under construction.

This chapter describes different ways to modify the tree model using
the API.

## Iteration

- [tree.visit()](https://mar10.github.io/wunderbaum/api/classes/wunderbaum.Wunderbaum.html#visit)

There are two ways to traverse the tree _depth-first, pre-order_:

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

**Related Methods**

- [tree.visit()](https://mar10.github.io/wunderbaum/api/classes/wunderbaum.Wunderbaum.html#visit)

## Searching

See [Search and Filter Nodes](tutorial_filter.md).

## Selection

See [Search and Filter Nodes](tutorial_filter.md).

## Sorting

See [Search and Filter Nodes](tutorial_filter.md).

## Mutation

### Adding Nodes

### Removing Nodes

### Moving Nodes

### Changing Node Properties

### Changing Node State

### Changing Node Data

### Changing Node Style

### Changing Node Class

### Changing Node Attributes

### Changing Node Icons

### Changing Node Badge

### Changing Node Badge Colors

## Related Methods

- `node.moveTo()`
- `node.setExpanded()`
- `node.setSelected()`
- `tree.applyCommand()`

## Utility Methods

The [Module util](https://mar10.github.io/wunderbaum/api/modules/util.html)
provides a number of utility methods that are useful when working with trees.

## Performance Tips

Use `tree.runWithDeferredUpdate()` to avoid multiple updates while changing many
nodes at once.

```js
tree.runWithDeferredUpdate(() => {
  tree.visit((node) => {
    node.setSelected(true);
  });
});
```
