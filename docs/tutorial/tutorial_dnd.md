# Drag and Drop

?> See also the [General Overview](/tutorial/overview.md).

[drag and drop](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)

### Related Tree Options

```js
const tree = new Wunderbaum({
  // --- Common Options ---
  ...
  dnd: {
    dragStart: (e) => {
      if (e.node.type === "folder") {
        return false;
      }
      e.event.dataTransfer.effectAllowed = "all";
      return true;
    },
    dragEnter: (e) => {
      if (e.node.type === "folder") {
        e.event.dataTransfer.dropEffect = "copy";
        return "over";
      }
      return ["before", "after"];
    },
    drop: (e) => {
      console.log("Drop " + e.sourceNode + " => " + e.region + " " + e.node, e);
      e.sourceNode.moveTo(e.node, e.defaultDropMode)
    },
  },
});
```

### Related Methods

- `util.foo()`

### Related CSS Rules

```css
div.wb-row.wb-drop-target.wb-drop-before .wb-node .wb-icon::after {}
```

### Code Hacks

```js
```
