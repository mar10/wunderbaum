# Drag and Drop

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
  }
  ```

  Foreign source data can be retreived from the `e.event.dataTransfer` object.

- `dragEnd(e)`: Fired when a drag operation is ended.<br>
  We will hardly ever have to implement this handler.

## Related Tree Options

!!! info

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

- `util.foo()`

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
```

### Code Hacks

```js

```
