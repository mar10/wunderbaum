# Keyboard Navigation

?> See also the [General Overview](/tutorial/overview.md).

The option `keyboard: true` should be used to control if standard keyboard
navigation is enabled.

## General Keyboard Navigation

We distinguish node states 'focused', 'active', and 'selected'.<br>
`setFocus()` only sets a dotted border around the node. When `autoActivate`
is enabled (which is on by default), the node also gets activated.<br>
A node becomes 'selected', when the checkbox is checked.

A tree can have one of three navigation modes. Use <kbd>Enter</kbd>/<kbd>Esc</kbd>
to toggle:

*Row Mode* &harr; *Cell-Nav Mode* &harr; *Cell-Edit Mode*

### Navigation in **Row Mode**

In *row mode*, Wunderbaum behaves like a simple tree. Even if multiple columns are present, always the whole row is highlighted.

- <kbd>+</kbd> / <kbd>-</kbd>: Expand/collapse node.
- <kbd>SPACE</kbd>: Toggle *select* status if `checkbox` option is on.
- <kbd>Enter</kbd>: Switch to &rarr; **Cell-Nav Mode**.
  On macOS this is an alias for <kbd>F2</kbd>.
- <kbd>Escape</kbd>: Discard edit operation if any.
- <kbd>BACKSPACE</kbd>: Set focus to parent.
- <kbd>LEFT</kbd>: If expanded: collapse. Otherwise set focus to parent node.
- <kbd>RIGHT</kbd>: If collapsed: expand. Otherwise set focus to first child.
- <kbd>UP</kbd>: Set focus to previous sibling (or parent if already on first sibling).
- <kbd>DOWN</kbd>: Set focus to next visible node.
- <kbd>Ctrl</kbd>+<kbd>Cursor</kbd>: Same as `Cursor`, but only sets the focus,
  even if `autoActivate` is on.
- <kbd>Home</kbd>, <kbd>End</kbd>:
- <kbd>PageUp</kbd>, <kbd>PageDown</kbd>:
- <kbd>Control</kbd>+<kbd>Home</kbd>, <kbd>Control</kbd>+<kbd>End</kbd>:
- <kbd>F2</kbd> Edit node title.
- <kbd>AlphaNum</kbd> jump to next matching node (if `quicksearch` is true)
- <kbd>Tab</kbd>, <kbd>Shift</kbd>+<kbd>Tab</kbd>: Leave the Wunderbaum tree
  control and focus next/previous control on the page.


### Navigation in **Cell-Nav Mode**

*Cell-nav mode* is only available, when multiple columns are defined.
In this mode we navigate the grid cells in read-only mode mostly.
Only in some special cases a cell content is edited directly. For example
<kbd>Space</kbd> toggles an embedded checkbox.

- <kbd>+</kbd> / <kbd>-</kbd>: Expand/collapse node if the title column is highlighted.
- <kbd>Up</kbd>, <kbd>Down</kbd>, <kbd>Left</kbd>, <kbd>Right</kbd>:
  Navigate to adjacent cell.
- <kbd>Escape</kbd>: Discard edit operation if any.
  Otherwise switch to &rarr; **Row Mode**.
- <kbd>Enter</kbd>: Switch to &rarr; **Cell-Edit Mode**.
- <kbd>Space</kbd>: Toggle value if current cell contains a checkbox.
  Toggle node selection if current cell is in the title column.
- <kbd>F2</kbd> Edit the current grid cell.
  If the title column is highlighted, edit the node title.
- <kbd>Tab</kbd>, <kbd>Shift</kbd>+<kbd>Tab</kbd>: (?)


### Navigation in **Cell-Edit Mode**

*Cell-edit mode* is only available, when multiple columns are defined. <br>
The main difference to the *cell-nav mode* is the behavior when a cell with an
embedded `<input>` element is highlighted: <br>
In this case cursor keys and keystrokes are sent to the embedded control.

For example

- <kbd>Up</kbd>, <kbd>Down</kbd>: select value from embedded listbox.
- <kbd>Left</kbd>, <kbd>Right</kbd>:
  Navigate to adjacent cell.
- <kbd>Space</kbd>: Toggle value if current cell contains a checkbox.
  Toggle node selection if current cell is in the title column.


- <kbd>Escape</kbd>: Discard edit operation if any and switch to &rarr; **Cell-Nav Mode**.
- <kbd>Enter</kbd>: Switch to &rarr; **Cell-Edit Mode**.


## Configuration and Customization

### Related Tree Options

```js
const tree = new Wunderbaum({
  ...
  enable: true,
  autoActivate: true,
  checkbox: true,
  navigationMode: "startRow",  // | "cell" | "startCell" | "row"
  quicksearch: true,
  ...
  // --- Events ---
  keydown: (e) => {
    // Return false to prevent default behavior
  }
  ...
  edit: {
    trigger: ["F2", "macEnter", ...],
    ...
  },
});
```

### Related Methods

- `tree.setNavigationMode(mode: NavigationMode)`
- `tree.setColumn(colIdx: number)`
- `tree.setEnabled(flag: boolean)`

### Related CSS Rules

```css
div.wunderbaum.wb-grid.wb-cell-mode div.wb-row.wb-active span.wb-col.wb-active {
  /* Highlighted cell in cell-nav mode */
}
div.wunderbaum.wb-grid.wb-cell-mode.wb-cell-edit-mode div.wb-row.wb-active span.wb-col.wb-active {
  /* Highlighted cell in cell-edit mode */
}
```
