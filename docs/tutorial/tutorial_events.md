# Event Handling

The intarctive behavior of Wunderbaum is

```js
document.addEventListener("DOMContentLoaded", (event) => {
  const tree = new mar10.Wunderbaum({
    id: "demo",
    element: document.getElementById("demo-tree"),
    source: "get/root/nodes",
    ...
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

## Common Event Handlers

Common event handlers include:

<dl>
<dt>init(e)</dt>
<dd>
  Fires when the tree markup was created and the initial source data was loaded.
  Typical use cases would be activating a node, setting focus, enabling other
  controls on the page, etc.
</dd>
<dt>lazyLoad(e)</dt>
<dd>
  Fires when a node that was marked 'lazy', is expanded for the first time.
  Typically we return an endpoint URL or the Promise of a fetch request that
  provides a (potentially nested) list of child nodes.
</dd>
<dt>receive(e)</dt>
<dd>
  Fires when data was fetched (initial request, reload, or lazy loading),
  but before the data is applied and rendered.
  Here we can modify and adjust the received data, for example to convert an
  external response to native Wunderbaum syntax.
</dd>
<dt>load(e)</dt>
<dd>
  Fires when data was loaded (initial request, reload, or lazy loading),
  after the data is applied and rendered.
</dd>
<dt>render(e)</dt>
<dd>
  Fires when a node is about to be displayed.
  The default HTML markup is already created, but not yet added to the DOM.
  Now we can tweak the markup, create HTML elements in this node's column
  cells, etc.
  See also `Custom Rendering` for details.
</dd>
<dt>update(e)</dt>
<dd>
  Fires when the viewport was updated, after scroling, expanding etc.
</dd>
</dl>

<dt>beforeSelect(e)</dt>
<dd>
  Return `false` to prevent (de)selection.
</dd>
</dl>

<dt>select(e)</dt>
<dd>
  `e.node` was selected (`e.flag === true`) or deselected (`e.flag === false`)
</dd>
</dl>

