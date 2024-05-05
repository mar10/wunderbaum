# Search and Filter

Wunderbaum supports different ways to search and filter nodes:

1. **Search** allows to find nodes by title patterns or arbitrary conditions.
2. **Filter** is a more powerful feature that can hide or dim nodes that do not
   match a given search pattern or condition. It can also highlight matching
   title parts.

## Searching

### Quicksearch

Quicksearch is triggered by typing a character and jumps to the next node that
starts with that character. <br>
It can be disabled by setting `quicksearch: false` in the tree options.

### Using the API

Many methods are available to search for nodes. For example, to find a node by
its title, use `tree.findFirst()`, `tree.findAll()` and others:

```js
// Match all node titles that match exactly 'Joe':
nodeList = node.findAll("Joe");
// Match all node titles that start with 'Joe' case sensitive:
nodeList = node.findAll(/^Joe/);
// Match all node titles that contain 'oe', case insensitive:
nodeList = node.findAll(/oe/i);
// Match all nodes with `data.price` >= 99:
nodeList = node.findAll((n) => {
  return n.data.price >= 99;
});
```

?> See also the [API tutorial](tutorial/tutorial_api) for more details.

## Filtering

A filter can be used to hide or dim nodes that do not match a given search pattern.

First, define the filter options in the tree options:

```js
const tree = new Wunderbaum({
  ...
  filter: {
    autoApply: true, // Re-apply last filter if lazy data is loaded
    mode: "hide",
    ...
  },
  ...
});
```

Following options are available (see also
[FilterOptionsType](https://mar10.github.io/wunderbaum/api/types/types.FilterOptionsType.html)):

```js
const tree = new Wunderbaum({
  ...
  filter: {
    autoApply: true, // Re-apply last filter if lazy data is loaded
    autoExpand: false, // Expand all branches that contain matches while filtered
    branchMode: false, // Whether to implicitly match all children of matched nodes
    connectInput: null, // Element or selector of an input control for filter query strings
    fuzzy: false, // Match single characters in order, e.g. 'fb' will match 'FooBar'
    hideExpanders: false, // Hide expanders if all child nodes are hidden by filter
    highlight: true, // Highlight matches by wrapping inside <mark> tags
    leavesOnly: false, // Match end nodes only
    mode: "dim", // Grayout unmatched nodes (pass "hide" to remove unmatched node instead)
    noData: true, // Display a 'no data' status node if result is empty
  },
  ...
});
```

### Filter Nodes

The `filterNodes()` method can be used to apply a filter to the tree. It accepts
a string or a function as a filter pattern:

```js
tree.filterNodes("Joe");
tree.filterNodes((node) => {
  return node.data.age <= 30;
});
```

Options can be passed as a second argument to override the default `tree.filter`
options:

```js
tree.filterNodes("Joe", { mode: "hide" });
```

See
[FilterNodesOptions](https://mar10.github.io/wunderbaum/api/types/types.FilterNodesOptions.html)):

Examples

```js
// Match all nodes with a title that does contain 'Joe' (case insensitive) and
// dim the rest:
tree.filterNodes("Joe");
// Match all nodes with a title that does contain 'Joe' (case insensitive) and
// hide the rest:
tree.filterNodes("Joe", { mode: "hide" });
// Match all nodes with a custom property 'age' > 30:
tree.filterNodes((node) => {
  return node.data.age <= 30;
});
// Match  all nodes with a a title that contains 'foo' or 'fox':
tree.filterNodes((node) => {
  return /.*fo[ox].*/i;
});
```

### Display Count of Matches as Badges

Show a badge with number of matching child nodes near parent icons.
If no matchin children exist or the node is expanded, the badge is hidden.

```js
const tree = new Wunderbaum({
  ...
  iconBadge: (e) => {
    const node = e.node;
    if (node.children?.length > 0 && !node.expanded && node.subMatchCount > 0) {
      return {
        badge: node.subMatchCount,
        badgeTooltip: `${node.subMatchCount} matches`,
        badgeClass: "match-count",
      };
    }
  },
  ...
});
```

### Connect to Search Input

Define some html elements as filter controls:

```html
<label for="filterQuery">Filter:</label>
<input
  id="filterQuery"
  type="search"
  placeholder="Enter search pattern"
  autofocus
/>
<button type="button" title="Hide unmatched nodes">
  <i class="bi bi-funnel"></i>
</button>
```

and connect them to the `tree.filterNodes()` method:

```js
const queryInput = document.querySelector("input#filterQuery");

queryInput.addEventListener(
  "input",
  Wunderbaum.util.debounce((e) => {
    tree.filterNodes(queryInput.value.trim(), {});
  }, 700)
);
...
// For example: dynamically toggle hide/dim mode
tree.setOption("filter.mode", hideMode ? "hide" : "dim");
```

An even simpler way is to use the `options.filter.connectInput` option, like
[in the demo](https://mar10.github.io/wunderbaum/demo/#demo-plain),
use the `connectInput` option.

```js
const tree = new Wunderbaum({
  ...
  filter: {
    connectInput: "input#filterQuery",
    ...
  },
});
```

?> See also a [live demo](https://mar10.github.io/wunderbaum/demo/#demo-plain)
and enter some text in the _Filter_ control at the top.

### Related Methods

- `tree.findFirst()`
- `tree.findAll()`
- `tree.countMatches()`
- `tree.filterNodes()`
- `tree.iconBadge()`

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
