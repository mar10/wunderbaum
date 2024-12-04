# Concepts

This document describes some general concepts of Wunderbaum.

## Design Goals

- Implement a **treegrid** control with emphasis on "tree".<br>
  Depending on the number of columns and nesting depth, Wunderbaum can also be
  used as a **plain tree**, **plain grid**, or a **simple list** control.
- **Performant** and efficient handling of **big data structures**.
- Use modern technologies with **zero dependencies** (except for icon fonts you
  may want to use).<br>
  Drop legacy support (IE, jQuery, ...).
- Robust, consistent handling of parallel, asynchronous behavior.
- Built-in support for
  <!-- [aria](https://www.w3.org/TR/wai-aria-1.1/), -->
  [drag and drop](tutorial_dnd.md),
  [editing](tutorial_edit.md),
  [filtering](tutorial_filter.md),
  [multi-selection](tutorial_select.md).
- Fully [controllable using the keyboard](tutorial_keyboard.md).
- Framework agnostic.
- Good documentation.
<!-- - Decent test coverage. -->
- Written in TypeScript, transpiled to JavaScript ES6 with type hints (.esm & .umd).

## Main Concepts

We have a tree **data model** as the backbone, i.e. an instance of the
`Wunderbaum` class that contains a hierarchical structure of `WunderbaumNode`
objects.

A node may be active, selected, focused, and/or hovered.
These **node states are independent**, so one node can have all, some, or none
of these states at the same time. See [[FAQ]] 'What statuses can a node have?'.

This structure is initialized on startup from a JavaScript data structure, an
Ajax JSON response or a generator function.

The tree's data model can be accessed and modified using an extensive
**object oriented API** like `tree.getNodeByKey()`, `node.setTitle()`,
or `node.setExpanded()`.

The rectangular, scrollable area on the page, that contains the (potentially
much larger) tree is called **viewport**.<br>
HTML markup is **rendered on demand**, i.e. only for nodes that are visible
inside the _viewport_.<br>
Also children of collapsed parent nodes don't have HTML elements.<br>
This concept allows to hold a _huge_ data model (100k+ nodes) in the frontend,
while only having a few HTML elements materialized in the DOM.
Developers should not manipulate the html directly, but change the data model
and then call `tree.update()` or `node.update()` if needed.<br>
Due to lazy rendering, it is not possible to bind events to all node HTML
elements directly. However this is rarely necessary, since Wunderbaum offers
event handlers like `click`, `dblclick`, and `keypress`.
Use event delegation otherwise.

A tree is usually set up for **lazy loading**:
For one thing, the tree initialization may be delayed to an asynchronous Ajax
request. This will result in a fast page load, and an empty tree displaying a
spinner icon until the data arrives.<br>
Additionally, single child nodes may be marked 'lazy'. These nodes will generate
Ajax requests when expanded for the first time.
Lazy loading allows to present hierarchical structures of infinite size in an
efficient way. But since neither all DOM elements nor even the complete tree
data model is available in the browser, API functions like `tree.getNodeByKey()`
or `node.findAll()` may not work as expected.

Some API functions are potentially **asynchronous**. For example `node.setExpanded()`
on a lazy node may have to issue an Ajax request, wait for its response and then
scroll and render new nodes.
These functions generally return a
[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise),
so handling deferred responses is easy:

```js
node.setExpanded().then(() => {
  alert("expand has finished");
});
```

or

```js
await tree.expandAll();
alert("expand has finished");
```

Activities and state changes generate **events**. Event handlers are used
to implement behavior:

```js
const tree = new Wunderbaum({
  // ...
  activate: (e) => {
    console.log("Node was activated:", e.node);
  },
  change: (e) => {
    console.log("Grid data was modified:", e);
  },
  render: (e) => {
    // e.node was rendered. We may now modify the markup...
  },
});
```
