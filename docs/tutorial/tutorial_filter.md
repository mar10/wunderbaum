# Search and Filter

?> See also the [General Overview](/tutorial/overview.md).

### Related Methods

- `util.foo()`

### Related CSS Rules

```css
  &.wb-ext-filter-dim,
  &.wb-ext-filter-hide {
    div.wb-node-list div.wb-row {
      color: $filter-dim-color;

      &.wb-submatch {
        color: $filter-submatch-color;
      }

      &.wb-match {
        color: $node-text-color;
      }
    }
  }
```

### Code Hacks

```js
```

### Related Tree Options

```js
const tree = new Wunderbaum({
  // --- Common Options ---
  ...
});
```
