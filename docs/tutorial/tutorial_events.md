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

## The Event Object

Depending on the event type, the event handler functions can return a value,
that is used by the tree to control the default behavior. For example, the
`beforeActivate` event handler can return `false` to prevent activation of a node.

Some events are sent by the tree, others by a distinct node.
A <i>node event</i> always passes a reference to the node object.
A <i>tree event</i> does not always pass a node reference.

The event handler functions are called with a single argument, of type
[WbTreeEventType](https://mar10.github.io/wunderbaum/api/interfaces/types.WbTreeEventType.html).

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

!!! info

    See also the overview of available functions of the
    [utility module](https://mar10.github.io/wunderbaum/api/modules/util.html).

## Event Handlers

!!! info

    A list of all available events can also be found in the
    [API Reference](https://mar10.github.io/wunderbaum/api/interfaces/wb_options.WunderbaumOptions.html).

Common event handlers include:

<dl>

<dt>
  <code>activate(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbActivateEventType.html">WbActivateEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` was activated.
</dd>

<dt>
  <code>beforeActivate(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbActivateEventType.html">WbActivateEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  Return `false` to prevent activation of `e.node`.
</dd>

<dt>
  <code>beforeExpand(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbExpandEventType.html">WbExpandEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  Return `false` to prevent expansion of `e.node`.
</dd>

<dt>
  <code>beforeSelect(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbSelectEventType.html">WbSelectEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  Return `false` to prevent (de)selection.
</dd>

<dt>
  <code>buttonClick(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbButtonClickEventType.html">WbButtonClickEventType</a>)</code>
  <small>- <i>tree event</i></small>
</dt> <dd>
  A column header button was clicked, e.g. sort, filter, or menu.
  Check `e.command` and `e.info.colId`, ... for details. <br>
  Note that the actual implementation of the command must be explicitly provided.<br>
  See also <a href="https://mar10.github.io/wunderbaum/index.html#tutorial_filter">Search and Filter</a> for examples.

</dd>

<dt>
  <code>change(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbChangeEventType.html">WbChangeEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  The `change(e)` callback is called when the user has finished editing a cell.
  More precisely, it is called when the embedded <i>input</i>, <i>select</i>, 
  or <i>textarea</i> element fired a <i>change</i> event.
</dd>

<dt>
  <code>click(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbClickEventType.html">WbClickEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` was clicked. <br>
  Return `false` to prevent default behavior, e.g. expand/collapse, 
  (de)selection, or activation.
</dd>

<dt>
  <code>dblclick(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbClickEventType.html">WbClickEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` was double-clicked. <br>
  Return `false` to prevent default behavior, e.g. expand/collapse.
</dd>

<dt>
  <code>deactivate(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbDeactivateEventType.html">WbDeactivateEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` was deactivated.
</dd>

<dt>
  <code>discard(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbNodeEventType.html">WbNodeEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` was discarded from the viewport and its HTML markup removed.
</dd>

<dt>
  <code>edit.apply(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbEditApplyEventType.html">WbEditApplyEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` title was changed.
</dd>

<dt>
  <code>edit.beforeEdit(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbNodeEventType.html">WbNodeEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` title is about to renamend. Return `false` to prevent renaming.
</dd>

<dt>
  <code>edit.edit(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbEditEditEventType.html">WbEditEditEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` just switched to edit mode, an input element was created and populated with the current title.
</dd>

<dt>
  <code>error(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbErrorEventType.html">WbErrorEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  An error occurred, e.g. during initialization or lazy loading.
</dd>

<dt>
  <code>expand(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbExpandEventType.html">WbExpandEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` was expanded (`e.flag === true`) or collapsed (`e.flag === false`)
</dd>

<dt>
  <code>focus(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbFocusEventType.html">WbFocusEventType</a>)</code>
  <small>- <i>tree event</i></small>
</dt> <dd>
  The tree received or lost focus. Check `e.flag`.
</dd>

<dt>
  <code>iconBadge(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbIconBadgeEventType.html) an">WbIconBadgeEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` is about to be rendered. We can add a badge to the icon cell here. <br>
  Returns <a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbIconBadgeEventResultType.html">WbIconBadgeEventResultType</a>.
</dd>
  
<dt>
  <code>init(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbInitEventType.html">WbInitEventType</a>)</code>
  <small>- <i>tree event</i></small>
</dt> <dd>
  Fires when the tree markup was created and the initial source data was loaded.
  Typical use cases would be activating a node, setting focus, enabling other
  controls on the page, etc.
  Also sent if an error occured during initialization (check for `e.error` property).
</dd>

<dt>
  <code>keydown(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbKeydownEventType.html">WbKeydownEventType</a>)</code>
  <small>- <i>tree event</i></small>
</dt> <dd>
  Fires when a key was pressed while the tree has focus. <br>
  `e.node` is set if a node is currently active. <br>
  Return `false` to prevent default navigation.
</dd>

<dt>
  <code>lazyLoad(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbNodeEventType.html">WbNodeEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  Fires when a node that was marked 'lazy', is expanded for the first time.
  Typically we return an endpoint URL or the Promise of a fetch request that
  provides a (potentially nested) list of child nodes.
</dd>

<dt>
  <code>load(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbNodeEventType.html">WbNodeEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  Fires when data was loaded (initial request, reload, or lazy loading),
  after the data is applied and rendered.
</dd>

<dt>
  <code>modifyChild(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbModifyChildEventType.html">WbModifyChildEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  TODO
</dd>

<dt>
  <code>receive(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbReceiveEventType.html">WbReceiveEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  Fires when data was fetched (initial request, reload, or lazy loading),
  but before the data is uncompressed, applied, and rendered.
  Here we can modify and adjust the received data, for example to convert an
  external response to native Wunderbaum syntax.
</dd>

<dt>
  <code>render(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbRenderEventType.html">WbRenderEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  Fires when a node is about to be displayed.
  The default HTML markup is already created, but not yet added to the DOM.
  Now we can tweak the markup, create HTML elements in this node's column
  cells, etc. <br>
  See also `Custom Rendering` for details.
</dd>

<dt>
  <code>renderStatusNode(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbRenderEventType.html">WbRenderEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  Same as `render(e)`, but for the status nodes, i.e. `e.node.statusNodeType`.
</dd>

<dt>
  <code>select(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbSelectEventType.html">WbSelectEventType</a>)</code>
  <small>- <i>node event</i></small>
</dt> <dd>
  `e.node` was selected (`e.flag === true`) or deselected (`e.flag === false`)
</dd>

<dt>
  <code>update(<a href="https://mar10.github.io/wunderbaum/api/interfaces/types.WbRenderEventType.html">WbRenderEventType</a>)</code>
  <small>- <i>tree event</i></small>
</dt> <dd>
  Fires when the viewport was updated, after scroling, expanding etc.
</dd>

</dl>
