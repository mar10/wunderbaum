# Keyboard Navigation

?> See also the [General Overview](/tutorial/overview.md).

The option `keyboard: true` should be used to control if standard keyboard
navigation is enabled.

## General Keyboard Navigation

We distinguish node states 'focused', 'active', and 'selected'.<br>
`setFocus()` only sets a dotted border around the node. When `autoActivate`
is enabled (which is on by default), the node also gets activated.<br>
A node becomes 'selected', when the checkbox is checked.

A tree can have one of two navigation modes. Use <kbd>Enter</kbd>/<kbd>Esc</kbd>
to toggle:

*Row Mode* &harr; *Cell-Nav Mode*

The initial mode, and if both modes are available, is controlled by the 
`navigationModeOption` option.<br>
If the tree only has one column, row-mode is obligatory.


### Navigation in **Row Mode**

In *row mode*, Wunderbaum behaves like a simple tree. Even if multiple columns 
are present, always the whole row is highlighted.

<table>
<thead>
  <tr>
    <th>Windows</th>
    <th>macOS</th>
    <th>Function</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td colspan=2 align=center><kbd>AlphaNum</kbd></td>
    <td>Jump to next matching node (if `quicksearch` is true).</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Tab</kbd>, <kbd>Shift</kbd>+<kbd>Tab</kbd></td>
    <td>Leave the Wunderbaum tree control and focus next/previous control on the page.</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>+</kbd> / <kbd>-</kbd></td>
    <td>Expand/collapse node</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Space</kbd></td>
    <td>Toggle <i>selected</i> status if <i>checkbox</i> option is on.</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>F2</kbd></td>
    <td>Edit node title.</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Enter</kbd></td>
    <td>
      If node is active and expandable: toggle expansion.<br>
      <b>Note:</b> 
      Behaves as alias for `F2` on macOS if <i>edit.trigger</i> option list 
      contains "macEnter".
    </td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Escape</kbd></td>
    <td>Discard edit title operation if any.</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Backspace</kbd></td>
    <td>Set focus to parent node.</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>ArrowLeft</kbd></td>
    <td>If expanded: collapse. Otherwise set focus to parent node.</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>ArrowRight</kbd></td>
    <td>If collapsed: expand. Otherwise set focus to first child.</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>ArrowUp</kbd></td>
    <td>Set focus to previous sibling (or parent if already on first sibling).</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>ArrowDown</kbd></td>
    <td>Set focus to next visible node.</td>
  </tr>
  <tr>
    <td><kbd>Ctrl</kbd> + <kbd>Arrow&hellip;</kbd></td>
    <td><kbd>⌘</kbd> + <kbd>Arrow&hellip;</kbd></td>
    <td>
      Same as plain <kbd>Arrow&hellip;</kbd>, but only sets the focus, even if 
      <i>autoActivate</i> option is on.
    </td>
  </tr>
  <tr>
    <td><kbd>Home</kbd></td>
    <td><kbd>Fn</kbd> + <kbd>ArrowLeft</kbd></td>
    <td>
      &mdash;
    </td>
  </tr>
  <tr>
    <td><kbd>End</kbd></td>
    <td><kbd>Fn</kbd> + <kbd>ArrowRight</kbd></td>
    <td>
      &mdash;
    </td>
  </tr>
  <tr>
    <td><kbd>PageUp</kbd></td>
    <td><kbd>Fn</kbd> + <kbd>ArrowUp</kbd></td>
    <td>
      Select top row in viewport or scroll one page upwards if we are already 
      at the top.
    </td>
  </tr>
  <tr>
    <td><kbd>PageDown</kbd></td>
    <td><kbd>Fn</kbd> + <kbd>ArrowDown</kbd></td>
    <td>
      Select bottom row in viewport or scroll one page down if we are already 
      at the bottom.
    </td>
  </tr>
  <tr>
    <td>
      <kbd>Ctrl</kbd> + <kbd>Home</kbd>,<br>
      <kbd>Ctrl</kbd> + <kbd>End</kbd>
    </td>
    <td>
      <kbd>⌘</kbd> + <kbd>ArrowUp</kbd>,<br>
      <kbd>⌘</kbd> + <kbd>ArrowDown</kbd>
    </td>
    <td>Select first / last row.</td>
  </tr>
</tbody>
</table>


### Navigation in **Cell-Nav Mode**

*Cell-nav mode* is only available, when multiple columns are defined.
In this mode we navigate the grid cells in read-only mode mostly.
Only in some special cases a cell content is edited directly. For example
<kbd>Space</kbd> toggles an embedded checkbox.

<table>
<thead>
  <tr>
    <th>Windows</th>
    <th>macOS</th>
    <th>Function</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td colspan=2 align=center><kbd>+</kbd> / <kbd>-</kbd></td>
    <td>Expand/collapse node if the title column is highlighted.</td>
  </tr>
  <tr>
    <td colspan=2 align=center>
      <kbd>ArrowUp</kbd>, <kbd>ArrowDown</kbd>, <kbd>ArrowLeft</kbd>, <kbd>ArrowRight</kbd>
    </td>
    <td>
      Navigate to adjacent cell.
    </td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Escape</kbd></td>
    <td>Discard edit title operation if any. Otherwise switch to &rarr; **Row Mode**.</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>F2</kbd></td>
    <td>
      Edit the current grid cell.
      If the title column is highlighted, edit the node title.
    </td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Enter</kbd></td>
    <td>
      If on first column and node expandable: toggle expansion.<br>
      If cell contains an input element: set focus to input control.<br>
      <b>Note:</b> 
      Behaves as alias for `F2` on macOS if <i>edit.trigger</i> option list 
      contains "macEnter".
    </td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Space</kbd></td>
    <td>
      Toggle value if current cell contains a checkbox.
      Toggle node selection if current cell is in the title column.
    </td>
  </tr>
  <tr>
    <td colspan=2 align=center>
      <kbd>Tab</kbd>, 
      <kbd>Shift</kbd>+<kbd>Tab</kbd>
    </td>
    <td>
      Toggle value if current cell contains a checkbox.
      Toggle node selection if current cell is in the title column.
    </td>
  </tr>

</tbody>
</table>


## Configuration and Customization

### Related Tree Options

```js
const tree = new Wunderbaum({
  ...
  enable: true,
  autoActivate: true,
  checkbox: true,
  navigationModeOption: "startRow",  // | "cell" | "startCell" | "row"
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

- `tree.setNavigationOption(mode: NavigationOptions)`
- `tree.setColumn(colIdx: number)`
- `tree.setEnabled(flag: boolean)`

### Related CSS Rules

```css
div.wunderbaum.wb-grid.wb-cell-mode div.wb-row.wb-active span.wb-col.wb-active {
  /* Highlighted cell in cell-nav mode */
}
```

### Code Hacks

```js
```
