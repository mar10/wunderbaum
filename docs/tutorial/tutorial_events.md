# Event Handling

The interactive behavior of Wunderbaum is controlled by a set of event handlers.
These are defined as properties of the tree object, and are called by the tree
whenever a certain event occurs.

```js
const tree = new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  source: "get/root/nodes",
  ...
  init: (e) => {
    e.tree.setFocus();
  },
  lazyLoad: function (e) {
    return { url: 'get/child/nodes', params: { parentKey: e.node.key } };
  },
  activate: function (e) {
    alert(`Thank you for activating ${e.node}.`);
  },
  ...
});
```

Depending on the event type, the event handler functions can return a value,
that is used by the tree to control the default behavior. For example, the
`beforeActivate` event handler can return `false` to prevent activation of a node.

The event handler functions are called with a single argument, the
[Tree Event](https://mar10.github.io/wunderbaum/api/interfaces/types.WbTreeEventType.html).
The event object contains the following properties:

```js
e = {
  type: string,         // the event type
  tree: Wunderbaum,     // the tree object
  util: object,         // some useful utility functions
  node: WunderbaumNode, // the node object (if applicable)
  event: Event,         // the original DOM event (if applicable)
  flag: boolean,        // a flag (if applicable)
  error: string,        // an error (if applicable)
  ...                   // additional properties (if applicable)
}
```

> See also the overview of [utility functions](https://mar10.github.io/wunderbaum/api/modules/util.html).

## Event Handlers

> A list of all available events can be found in the
> [API Reference](https://mar10.github.io/wunderbaum/api/interfaces/wb_options.WunderbaumOptions.html).

Common event handlers include:

<dl>
<dt>init(e) <small>- <code>tree event</code></small></dt>
<dd>
  Fires when the tree markup was created and the initial source data was loaded.
  Typical use cases would be activating a node, setting focus, enabling other
  controls on the page, etc.
  Also sent if an error occured during initialization (check for `e.error` property).
</dd>

<dt>focus(e) <small>- <code>tree event</code></small></dt>
<dd>
  The tree received or lost focus. Check `e.flag`.
</dd>

<dt>lazyLoad(e) <small>- <code>node event</code></small></dt>
<dd>
  Fires when a node that was marked 'lazy', is expanded for the first time.
  Typically we return an endpoint URL or the Promise of a fetch request that
  provides a (potentially nested) list of child nodes.
</dd>

<dt>receive(e) <small>- <code>node event</code></small></dt>
<dd>
  Fires when data was fetched (initial request, reload, or lazy loading),
  but before the data is applied and rendered.
  Here we can modify and adjust the received data, for example to convert an
  external response to native Wunderbaum syntax.
</dd>

<dt>load(e) <small>- <code>node event</code></small></dt>
<dd>
  Fires when data was loaded (initial request, reload, or lazy loading),
  after the data is applied and rendered.
</dd>

<dt>keydown(e) <small>- <code>tree event</code></small></dt>
<dd>
  Fires when a key was pressed while the tree has focus. <br>
  `e.node` is set if a node is currently active. <br>
  Return `false` to prevent default navigation.
</dd>

<dt>update(e) <small>- <code>tree event</code></small></dt>
<dd>
  Fires when the viewport was updated, after scroling, expanding etc.
</dd>

<dt>render(e) <small>- <code>node event</code></small></dt>
<dd>
  Fires when a node is about to be displayed.
  The default HTML markup is already created, but not yet added to the DOM.
  Now we can tweak the markup, create HTML elements in this node's column
  cells, etc.
  See also `Custom Rendering` for details.
</dd>

<dt>renderStatusNode(e) <small>- <code>node event</code></small></dt>
<dd>
  Same as `render(e)`, but for the status nodes, i.e. `e.node.statusNodeType`.
</dd>

<dt>discard(e) <small>- <code>node event</code></small></dt>
<dd>
  `e.node` was discarded from the viewport and its HTML markup removed.
</dd>

<dt>beforeActivate(e) <small>- <code>node event</code></small></dt>
<dd>
  Return `false` to prevent activation of `e.node`.
</dd>

<dt>activate(e) <small>- <code>node event</code></small></dt>
<dd>
  `e.node` was activated. 
</dd>

<dt>deactivate(e) <small>- <code>node event</code></small></dt>
<dd>
  `e.node` was deactivated.
</dd>

<dt>beforeSelect(e) <small>- <code>node event</code></small></dt>
<dd>
  Return `false` to prevent (de)selection.
</dd>

<dt>select(e) <small>- <code>node event</code></small></dt>
<dd>
  `e.node` was selected (`e.flag === true`) or deselected (`e.flag === false`)
</dd>

<dt>error(e) <small>- <code>node event</code></small></dt>
<dd>
  An error occurred, e.g. during initialization or lazy loading.
</dd>

<dt>iconBadge(e) <small>- <code>node event</code></small></dt>
<dd>
  `e.node` is about to be rendered. We can add a badge to the icon cell here.
</dd>
  
<dt>click(e) <small>- <code>node event</code></small></dt>
<dd>
  `e.node` was clicked. <br>
  Return `false` to prevent default behavior, e.g. expand/collapse, 
  (de)selection, or activation.
</dd>
<dt>dblclick(e) <small>- <code>node event</code></small></dt>
<dd>
  `e.node` was clicked. <br>
  Return `false` to prevent default behavior, e.g. expand/collapse.
</dd>

</dl>
