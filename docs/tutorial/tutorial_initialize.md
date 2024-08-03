# Loading and Initialization

## Passing Options

There are many more options and callbacks available. Here are some of the
frequently used ones:

```js
document.addEventListener("DOMContentLoaded", (event) => {
  const tree = new mar10.Wunderbaum({
    element: document.getElementById("demo-tree"),
    id: "demo",
    types: {},
    columns: [{ id: "*", title: "Product", width: "250px" }],
    source: "get/root/nodes",
    // Event handlers:
    init: (e) => {
      // e.tree.setFocus();
      e.tree.findFirst("Foo")?.setActive(true, {
        colIdx: "*",
        edit: true,
        focusTree: true,
      });
    },
    receive: function (e) {},
    load: function (e) {},
    lazyLoad: function (e) {
      return { url: 'get/child/nodes', params: { parentKey: e.node.key } };
    },
    activate: function (e) {},
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
    Define shared attributes for multiple nodes of the same `node.type`.
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

!!! info

    See [WunderbaumOptions](https://mar10.github.io/wunderbaum/api/interfaces/wb_options.WunderbaumOptions.html)
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

!!! info

    Event Handlers are described in detail in the [Events chapter](tutorial_events.md).

## Data Source

!!! info

    See examples of JSON data and learn more in the next section,
    [Data Formats](tutorial_source.md)

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

### Handling External Data Formats

!!! info

    See also [Example with source](https://mar10.github.io/wunderbaum/demo/#demo-custom)
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
