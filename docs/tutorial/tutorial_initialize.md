# Loading and Initialization

## Passing Options

There are many more options and callbacks available. Here are some of the
frequently used ones:

```js
document.addEventListener("DOMContentLoaded", (event) => {
  const tree = new mar10.Wunderbaum({
    id: "demo",
    element: document.getElementById("demo-tree"),
    source: "get/root/nodes",
    types: {},
    columns: [{ id: "*", title: "Product", width: "250px" }],
    // Event handlers:
    init: (e) => {
      e.tree.setFocus();
    },
    receive: function (e) {},
    load: function (e) {},
    lazyLoad: function (e) {
      return { url: 'get/child/nodes', params: { parentKey: e.node.key } };
    },
    render: function (e) {},
    ...
  });
});
```

Common options include:

<dl>
<dt>element</dt>
<dd>
    Selector or HTML Element of the target div tag.
</dd>
<dt>id</dt>
<dd>
    The identifier of this tree. Used to reference the instance, especially when
    multiple trees are present (e.g. `tree = mar10.Wunderbaum.getTree("demo")`).
</dd>
<dt>source</dt>
<dd>
    Define the initial tree data. Typically a URL of an endpoint that serves a JSON formatted structure, but also a callback, Promise, or static data is allowed.
</dd>
<dt>types</dt>
<dd>
    Define shared attributes for multiple nodes of the same type.
    This allows for more compact data models.
    Type definitions can be passed as tree option, or be part of a
    `source` response.
</dd>
<dt>columns</dt>
<dd>
    A list of maps that define column headers.
    If this option is set, Wunderbaum becomes a treegrid control instead
    of a plain tree.
    Column definitions can be passed as tree option, or be part of a
    `source` response.
</dd>
</dl>

?> See [WunderbaumOptions](https://mar10.github.io/wunderbaum/api/interfaces/wb_options.WunderbaumOptions.html)
for a complete list of options.

### Dynamic Options

Some node options can be defined in a flexible way, using a dynamic pattern.

Consider for example the `checkbox` option, which may be true, false, or
"radio". If omitted, it will default to false.
Globally enabling checkboxes for all nodes can be configured like so:

```js
const tree = new mar10.Wunderbaum({
  ...
  checkbox: true,
  ...
```

This global setting may be overridden per node by the concrete source data,
if a property of the same name is present:

```js
[
  { title: "Node 1" },
  { title: "Node 2", checkbox: false },
  { title: "Node 3", checkbox: "radio" },
];
```

If the global setting is a callback, it will be called for every node, thus
allowing to dynamically define option values:

```js
const tree = new mar10.Wunderbaum({
  checkbox: (e) => {
    // Hide checkboxes for folders
    return e.node.type === "folder" ? false : true;
  },
  tooltip: (e) => {
    // Create dynamic tooltips
    return `${e.node.title} (${e.node.key})`;
  },
  icon: (e) => {
    // Create custom icons
    if( e.node.data.critical ) {
      return "foo-icon-class";
    }
    // Exit without returning a value: continue with default processing.
  },
  ...
```

Currently the following options are evaluated as dynamic options:
`checkbox`, `icon`, `iconTooltip`, `tooltip`, `unselectable`.

See method `node.getOption()` for details.

## Event Handlers

Event handlers can be used to control tree behavior and react on status changes.
Common event handlers include: `init(e)`, `lazyLoad(e)`, `receive(e)`, `render(e)`,
and more.

?> Event Handlers are described in detail in the [Events chapter](/tutorial/tutorial_events.md).

## Source Format and API

Typically we load the tree nodes in a separate Ajax request like so:

```js
const tree = new mar10.Wunderbaum({
  ...
  source: "path/to/request",
  ...
});
```

The example above issues a simple GET request.
For more controle, we can use the extended syntax:

```js
const tree = new mar10.Wunderbaum({
  ...
  source: {
    url: "path/to/request",
    params: {},  // key/value pairs converted to URL parameters
    body: {},    // key/value pairs converted to JSON body (defaults to method POST)
    options: {}, // passed to `fetch(url, OPTIONS)`
  }
  ...
});
```

The endpoint must return a node structure in JSON format.

Note that

- The structure may be nested, e.g. a child node may in turn contain a `children` list.
- Some reserved attributes names are part of the node data model:<br>
  `checkbox`, `classes`, `expanded`, `icon`, `iconTooltip`, `key`, `lazy`, `radiogroup`, `refKey`, `selected`, `statusNodeType`, `title`, `tooltip`, `type`, `unselectable`.<br>
  They can be accessed as `node.title`, for example,

- All other properties are stored under the _data_ namespace and are accessed
  like `node.data.author`, for example.
- Only `title` is mandatory
- Node titles are escaped in order to prevent [XSS](https://owasp.org/www-community/attacks/xss/).
  For example if JSON source contains `"title": "<script>..."`, it will be
  converted to `&lt;script&gt;...`, which is rendered by the browser as
  `<script>...`, but not interpreted as HTML element.

### Nested List Format

All node are transferred as a list of top-level nodes, with optional nested
lists of child nodes.

```js
[
  {
    title: "Books",
    expanded: true,
    children: [
      {
        title: "Art of War",
        author: "Sun Tzu",
      },
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
      },
    ],
  },
  {
    title: "Music",
    children: [
      {
        title: "Nevermind",
        author: "Nirvana",
      },
    ],
  },
];
```

### Object Format

This is the most commonly used format. Here we pass an object that contains
one `children` element, but also additional information.

```js
{
  "types": {...},
  "columns": [...],
  "_keyMap": {...},
  "children": [
    {
      "title": "Books",
      "expanded": true,
      "children": [
        {
          "title": "Art of War",
          "author": "Sun Tzu"
        },
      ]
    },
    ...
  ]
}
```

### Type Information

A tree often contains multiple nodes that share attributes.
We can extract type information to a separate block, in order to make the
data model more concise:

```js
{
  "types": {
    "folder": { "icon": "bi bi-folder", "classes": "bold-style" },
    "book": { "icon": "bi bi-book" },
    "music": { "icon": "bi bi-disk" }
  },
  "children": [
    {
      "title": "Books",
      "type": "folder",
      "expanded": true,
      "children": [
        {
          "title": "Art of War",
          "type": "book",
          "author": "Sun Tzu"
        },
        ...
      ]
    },
    {
      "title": "Music",
      "type": "folder",
      "children": [
        {
          "title": "Nevermind",
          "type": "music",
          "author": "Nirvana"
        }
      ]
    }
  ]
}
```

Type definitions can also be passed directly to the tree constructor:

```js
const tree = new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  source: "get/root/nodes",
  types: {
    folder: { icon: "bi bi-folder", classes: "bold-style" },
    book: { icon: "bi bi-book" },
    music: { icon: "bi bi-disk" }
  },
  ...
```

### Compact Formats

Load time of data is an important aspect of the user experience. <br>
We can reduce the size of the JSON data by eliminating redundancy:

- Remove whitespace from the JSON (the listings in this chapter are formatted
  for readability).
- Don't pass default values, e.g. `expanded: false` is not required.
- Use `node.type` declarations, to extract shared properties (see above).

```js
{
  "_format": "nested",
  "types": {"person": {...}, ...},
  "children": [
    {"title": "Node 1", "key": "id123", "type": "folder", "expanded": true, "children": [
      {"title": "Node 1.1", "key": "id234", "type": "person"},
      {"title": "Node 1.2", "key": "id345", "type": "person", "age": 32}
    ]}
  ]
}
```

The example above can still be optimized:

- Pass `1` instead of `true` and `0` instead of `false`
  (or don't pass it at all if it is the default).
- Use `_keyMap` and shorten the key names, e.g. send `{"t": "foo"}` instead of
  `{"title": "foo"}` (see below).
- Use a `_valueMap` and pass numeric indexes into this list instead of sending
  type name strings.

!> The syntax of `_keyMap` and `_valueMap` has changed with v0.7.0.

```js
{
  "_format": "nested",  // Optional
  "types": {"person": {...}, ...},
  "columns": [...],
  // Map from short key to final key (if a key is not found here it will
  // be used literally):
  "_keyMap": {"title": "t", "key": "k", "type": "y", "children": "c", "expanded": "e"},
  // Optional: if a 'type' entry has a numeric value, use it as index into this
  // list (string values are still used literally):
  "_valueMap": {
    "type": ["folder", "person"]
  },
  "children": [
    {"t": "Node 1", "k": "id123", "y": 0, "e": 1, "c": [
      {"t": "Node 1.1", "k": "id234", "y": 1},
      {"t": "Node 1.2", "k": "id345", "y": 1, "age": 32}
    ]}
  ]
}
```

### Flat, Parent-Referencing List

The flat format is a even few percent smaller than the nested format.
It is also easier to process, because it does not require recursion
and it is more apropropriate for sending pathches for existing trees.

!> The syntax of `_keyMap` and `_valueMap` has changed with v0.7.0.

Here all nodes are passed as a flat list, without nesting.
Chid nodes reference the parent by
NOTE: This also works when `node.key`'s are not provided.

```js
{
  "_format": "flat",
  "types": {...},       // Optional, but likely if `_valueMap` is used
  "columns": [...],     // Optional
  // Map from short key to final key (if a key is not found here it will
  // be used literally):
  "_keyMap": {"expanded": "e"},
  // Values for these keys are appended as list items.
  // Other items - if any - are collected into one dict that is also appended:
  "_positional": ["title", "key", "type"],
  // Optional: if a 'type' entry has a numeric value, use it as index into this
  // list (string values are still used literally):
  "_valueMap": {
    "type": ["folder", "person"]
  },
  // List index is 0-based, parent index null means 'top-node'.
  // If parent index is a string, parent is searched by `node.key` (slower)
  "children": [
    [0, "Node 1", "id123", 0, {"e": true}],   // index=0
    [1, "Node 1.1", "id234", 1],              // index=1
    [1, "Node 1.2", "id345", 1, {"age": 32}]  // index=2
  ]
}
```

### Handling External Data Formats

?> See also [Example with source](https://mar10.github.io/wunderbaum/demo/#demo-custom)
that queries the [Fake Store API](https://fakestoreapi.com).

```js
const tree = new Wunderbaum({
  ...
  source: { url: "https://fakestoreapi.com/products/categories" },
  lazyLoad: (e) => {
    return { url: `https://fakestoreapi.com/products/category/${e.node.refKey}` }
  },
  receive: (e) => {
    return e.response.map((elem) => {
      return {
        title: elem.name,
        refKey: elem.id,
      }
    });
  },
});
```

### Column Definitions

Column definitions are required to turn a plain Wunderbaum tree into a treegrid.

?> See `Grid` for details.

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
