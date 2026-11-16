# Drag and Drop

!!! abstract "TL;DR"

    Wunderbaum implements drag and drop according to the native HTML protocol.
    This allows interaction between different tree instances, browsers, and
    even native applcations.

Wunderbaum supports drag and drop of nodes within the tree and between trees.
It is also possible to drag nodes from the tree to other elements on the page or
vice versa. Even cross-window drag and drop is supported. <br>
The implementation is purely based on the native
[HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API).

Note that there is no automatic modification of nodes. Instead, the
`drop` event is fired on the target tree and it is up to the application to
modify the tree accordingly.

## Drag and Drop Events

The following events are fired on the tree during drag and drop.

!!! info

    Note that the `dragStart`, `drag`, and `dragEnd` events are fired on the
    tree that contains the dragged node (i.e. the source node). <br>
    The other events are fired on the tree that contains the drop target.

The events are named after the corresponding
[HTML Drag and Drop events](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent).
However, the event handlers are passed an object with the following properties:

```js
e = {
  type: "dnd.EVENTNAME",
  node: // the source or target node, depending on the event type
  event: // <the original HTML DragEvent>
}
```

These are events are sent in a typical drag and drop operation:

- `dragStart(e)`: Fired when a drag operation is started.<br>
  This event handler MUST be implemented by the application in order to enable
  dragging in general. <br>
  The handler can return `false` to prevent dragging the source node.<br>
  The handler can set the `e.event.dataTransfer.effectAllowed` property in order
  to adjust copy/move/link behavior. <br>
  The handler can set the `e.event.dataTransfer.dropEffect` property in order to
  adjust copy/move/link behavior.

- `drag(e)`: Fired repeadedly during a drag operation.<br>
  We will hardly ever have to implement this handler.

- `dragEnter(e)`: Fired when a dragged item enters a drop target.<br>
  This event handler MUST be implemented by the application in order to enable
  dropping in general. <br>
  The handler can return `false` to prevent the drop operation or return a set
  of drop regions to indicate which drop regions are allowed. <br>
  The handler can set the `e.event.dataTransfer.dropEffect` property in order to
  adjust copy/move/link behavior.

- `dragOver(e)`: Fired continuously when a dragged item is moved over a drop target. <br>
  We will hardly ever have to implement this handler. <br>
  The handler can set the `e.event.dataTransfer.dropEffect` property in order to
  adjust copy/move/link behavior.

- `dragLeave(e)`: Fired when a dragged node leaves a drop target. <br>
  We will hardly ever have to implement this handler.

- `drop(e)`: Fired when a dragged node is dropped on a drop target. <br>
  This is the most important event handler. It is responsible for modifying the
  tree according to the drop operation. <br>

  ```js
  e = {
    type: "dnd.drop",
    node: // the target node
    event: // <the original HTML DragEvent>
    region: // 'before', 'after', 'over'
    suggestedDropMode: // 'before', 'after', 'appendChild'
                       // (compatible with node.moveTo() and .appendChild())
    suggestedDropEffect: // 'copy', 'move', 'link'
    sourceNode: // the source node if available
    sourceNodeData: // the serialized data of the source node if any
    isEmptyArea: // true if dropped into the empty area below the last row
  }
  ```

  Foreign source data can be retreived from the `e.event.dataTransfer` object.

- `dragEnd(e)`: Fired when a drag operation is ended.<br>
  The handler is passed additional information about where the drag ended,
  e.g. to show a hint when a node was dropped outside the browser window
  (see [Dragging Nodes Out of the Browser](#dragging-nodes-out-of-the-browser)):

  ```js
  e = {
    type: "dnd.dragEnd",
    node: // the source node
    event: // <the original HTML DragEvent>
    dropEffect: // e.event.dataTransfer.dropEffect: 'none', 'copy', 'move', 'link'
    droppedInTree: // true if dropped on this tree
    droppedInDocument: // true if dropped anywhere in this document
    leftWindow: // true if the pointer left the browser window and did not return
    isExternalDrop: // true if probably dropped outside this document
  }
  ```

  `isExternalDrop` is defined as
  `!droppedInDocument && (dropEffect !== "none" || leftWindow)`.

## Dropping Into the Empty Area

Dropping an item into the empty area below the last row (or onto a tree that
has no nodes yet) is handled like a drop on a substitute target node:

- By default, the item is dropped `"after"` the **last top-level node**,
  so it becomes the new last top-level node.
- If the tree has no nodes, the target is `tree.root` with region `"over"`,
  i.e. `e.suggestedDropMode` is `"appendChild"`.

The `dragEnter`, `dragOver`, `drop`, and `dragLeave` events are then fired for
this substitute node, with `e.isEmptyArea` set to `true`.
Since the drop region is fixed in this case, `dragEnter` only needs to return
a truthy value (returning `false` still prevents the drop).
So a typical handler like `e.sourceNode.moveTo(e.node, e.suggestedDropMode)`
works without changes.

The `dnd.emptyAreaTarget` option can override the default target or disable
the feature:

```js
dnd: {
  // Pass `false` to ignore drops into the empty area:
  // emptyAreaTarget: false,
  emptyAreaTarget: (e) => {
    // e.node and e.region contain the default suggestion.
    // Example: always append as last top-level node, even on empty trees:
    return { node: e.tree.root, region: "over" };
    // Return `false` to prevent the drop, or nothing to accept the default.
  },
  ...
}
```

While the pointer is over the empty area, the tree element has the
`wb-drop-empty-area` class.

## Dragging Nodes Out of the Browser

Nodes can be dragged onto the desktop or into other applications.
What is created there depends on the `dataTransfer` items that are set in
`dragStart` and on the browser:

- Chromium-based browsers (Chrome, Edge, Opera, ...) support the non-standard
  `DownloadURL` type (`"mime:filename:absoluteUrl"`) and create a real file
  by downloading the URL.
- Safari and Firefox ignore `DownloadURL` and create a .webloc file or a text
  clipping from the `text/uri-list` or `text/plain` items instead.

`util.supportsDownloadURL()` returns true for Chromium-based browsers.
This cannot be feature-detected, because `setData()` accepts any type without
error.

By default, the node title is added as `text/plain` item (unless `dragStart`
already set one). Pass `sendText: false` to suppress this, or a callback that
returns the text (or `null` to add nothing).

The `dragEnd` event reports where the drag ended, so we can show a hint when a
node was dropped outside the browser (`e.isExternalDrop`):

```js
const util = Wunderbaum.util;

const tree = new Wunderbaum({
  ...
  dnd: {
    // Don't create text clippings from the node title:
    sendText: false,
    dragStart: (e) => {
      const node = e.node;
      if (node.type === "folder") {
        return false;
      }
      const url = new URL(node.data.href, location.href).href;
      const dt = e.event.dataTransfer;
      dt.effectAllowed = "copy";
      dt.setData("text/uri-list", url);
      if (util.supportsDownloadURL()) {
        dt.setData("DownloadURL", `application/octet-stream:${node.title}:${url}`);
      }
      return true;
    },
    dragEnd: (e) => {
      if (e.isExternalDrop && !util.supportsDownloadURL()) {
        alert(`This browser created a link to '${e.node.title}', not a copy.`);
      }
    },
  },
});
```

!!! note

    The drop target is detected with document-level listeners that are only
    active while a node of this tree is dragged.
    `dropEffect` is `"none"` when the drag was canceled, but Firefox on macOS
    also reports `"none"` when another application (e.g. Finder) accepted
    the drop. In this case `leftWindow` is used: it is set when the pointer
    left the browser window and did not come back.
    Canceling the drag with the Esc key does not set `leftWindow`.
    Drops into other browser windows or iframes count as external drops.

## Related Tree Options

!!! info "See also"

    See also the [API Documentation for DnD options](https://mar10.github.io/wunderbaum/api/types/types.DndOptionsType.html)
    and the [live demo](https://mar10.github.io/wunderbaum/demo/#demo-plain).

## Examples

### Basic Drag and Drop

Allow sorting of plain nodes:

```js
const tree = new Wunderbaum({
  // --- Common Options ---
  ...
  dnd: {
    dragStart: (e) => {
      if (e.node.type === "folder") {
        return false; // do not allow dragging folders
      }
      return true;
    },
    dragEnter: (e) => {
      if (e.node.type === "folder") {
        return "over";
      }
      return ["before", "after"];
    },
    drop: (e) => {
      console.log(
        `Drop ${e.sourceNode} => ${e.suggestedDropEffect} ${e.suggestedDropMode} ${e.node}`, e
      );
      e.sourceNode.moveTo(e.node, e.suggestedDropMode)
    },
  },
});
```

### Basic Drag and Drop (move)

```js
const tree = new Wunderbaum({
  // --- Common Options ---
  ...
  dnd: {
    effectAllowed: "all",
    dropEffectDefault: "move",
    guessDropEffect: true,
    dragStart: (e) => {
      // if (e.node.type === "folder") {
      //   return false;
      // }
      return true;
    },
    dragEnter: (e) => {
      // console.log(`DragEnter ${e.event.dataTransfer.dropEffect} ${e.node}`, e);
      // We can only drop 'over' a folder, so the source node becomes a child.
      // We can drop 'before' or 'after' a non-folder, so the source node becomes a sibling.
      if (e.node.type === "folder") {
        // e.event.dataTransfer.dropEffect = "link";
        return "over";
      }
      return ["before", "after"];
    },
    drag: (e) => {
      // e.tree.log(e.type, e);
    },
    drop: (e) => {
      console.log(
        `Drop ${e.sourceNode} => ${e.suggestedDropEffect} ${e.suggestedDropMode} ${e.node}`,
        e
      );
      switch (e.suggestedDropEffect) {
        case "copy":
          e.node.addNode(
            { title: `Copy of ${e.sourceNodeData.title}` },
            e.suggestedDropMode
          );
          break;
        case "link":
          e.node.addNode(
            { title: `Link to ${e.sourceNodeData.title}` },
            e.suggestedDropMode
          );
          break;
        default:
          e.sourceNode.moveTo(e.node, e.suggestedDropMode);
      }
    },
  },
```

### Related Methods

- `util.supportsDownloadURL()`

### Related CSS Rules

```css
div.wb-row.wb-drag-source {
  /* The dragged node */
}
div.wb-row.wb-drop-target {
  /* The current target node while dragging */
}
div.wb-row.wb-drop-target.wb-drop-before .wb-node .wb-icon::after {
  /* Drop marker */
}
div.wunderbaum.wb-drop-empty-area div.wb-list-container {
  /* Dragging over the empty area below the last row */
}
```

### Code Hacks

```js

```
