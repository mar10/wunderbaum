# Loading and Initialization

## General Setup

A Wunderbaum control is added to a web page by defining a `<div>` tag and
then create a new `Wunderbaum` class instance, passing the tag and configuration
options.

For example

```html {16-19}
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" media="screen" href="../wunderbaum.css" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.0/font/bootstrap-icons.css"
    />

    <script defer src="../wunderbaum.umd.js"></script>
    <script defer src="main.js"></script>
  </head>

  <body>
    ...
    <div
      id="demo-tree"
      class="wb-skeleton wb-initializing wb-fade-expander"
    ></div>
    ...
  </body>
</html>
```

Once the page is loaded, initialize the tree control:

```js
document.addEventListener("DOMContentLoaded", (event) => {
  const tree = new mar10.Wunderbaum({
    element: document.querySelector("#demo-tree"),
    source: "get/root/nodes",
    init: (e) => {
      e.tree.setFocus();
    }
  });
});
```

## Passing Options

There are many more options and callbacks available. Here are some of the
frequenlty used ones:

```js
document.addEventListener("DOMContentLoaded", (event) => {
  const tree = new mar10.Wunderbaum({
    id: "demo",
    element: document.querySelector("#demo-tree"),
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
      return { url: `get/child/nodes?parentKey=${e.node.key}` };
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

```json
[{"title": "Node 1"},
 {"title": "Node 2", "checkbox": false},
 {"title": "Node 3", "checkbox": "radio"}
 ]
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
`checkbox`, `icon`, `iconTooltip`, `tooltip`, `unselectable`, `unselectableIgnore`,
`unselectableStatus`.

See method `node.getOption()` for details.

### Event Handlers

Event handlers can be used to control tree behavior and react on status changes.
Common event handlers include: `init(e)`, `lazyLoad(e)`, `receive(e)`, `render(e)`,
and more.

?> Event Handlers are describe in detail in the "Events" chapter.

## Source Format and API

A simple node structure defines a list of child node definitions.

Note that

- The structure may be nested, e.g. a child node may in turn contain a `children` list.
- Some attributes are part of the data model:<br>
  `classes`, `expanded`, `icon`, `key`, `lazy`, `refKey`, `selected`, `title`,
  `tooltip`, `type`.<br>
  They can be accesed as `node.title`, for example,
- All other properties are stored under the _data_ namespace and are accessed
  like `node.data.author`, for example.
- Only `title` is mandatory
- TODO: HTML escaping

```json
[
  {
    "title": "Books",
    "expanded": true,
    "children": [
      {
        "title": "Art of War",
        "author": "Sun Tzu"
      },
      {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien"
      }
    ]
  },
  {
    "title": "Music",
    "children": [
      {
        "title": "Nevermind",
        "author": "Nirvana"
      }
    ]
  }
]
```

### Type Information

A tree often contains multiple nodes that share attributes.
We can extract type information to a separate block, in order to make the
data model more concise:

```json
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
        {
          "title": "The Hobbit",
          "type": "book",
          "author": "J.R.R. Tolkien"
        }
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

Type definitions can also be passed to the tree constructor directly:

```js
const tree = new mar10.Wunderbaum({
  id: "demo",
  element: document.querySelector("#demo-tree"),
  source: "get/root/nodes",
  types: {
    folder: { icon: "bi bi-folder", classes: "bold-style" },
    book: { icon: "bi bi-book" },
    music: { icon: "bi bi-disk" }
  },
  ...
```

### Handling External Data Formats

?> TODO: `receive(e)`

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
    // console.log(e.name, e.isNew, e);
  },
});
```
