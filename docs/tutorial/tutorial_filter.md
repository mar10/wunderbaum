# Search and Filter

!> This chapter is still under construction.

?> See also a [live demo](https://mar10.github.io/wunderbaum/demo/#demo-plain)
and enter some text in the _Filter_ control at the top.

### Related Methods

- `util.foo()`

### Related CSS Rules

```scss
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
