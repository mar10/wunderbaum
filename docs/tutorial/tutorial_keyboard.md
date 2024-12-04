# Keyboard Navigation

The option `keyboard: true` enables standard keyboard navigation.

!!! info

    See also a [live demo](https://mar10.github.io/wunderbaum/demo/#demo-editable)
    and use the keyboard to navigate, expand, and edit grid cells.

## General Keyboard Navigation

We distinguish node states 'focused', 'active', and 'selected'.<br>
`setFocus()` only sets a dotted border around the node. When `autoActivate`
is enabled (which is on by default), the node also gets activated.<br>
A node becomes 'selected', when the checkbox is checked.

A tree can have one of two navigation modes. We can toggle using the keyboard:

_Row Mode_ &harr; _Cell-Nav Mode_

The initial mode, and if modes can be switched, is controlled by the
`navigationModeOption` option:<br>
If the tree has only one column, or if _navigationModeOption_ is `"row"`,
Row Mode is obligatory.
If the value is `"cell"`, Cell-Nav Mode is obligatory.<br>
A value of `"startCell"` or `"startRow"` allows switching.

### Navigation in **Row Mode**

In _row mode_, Wunderbaum behaves like a simple tree. Even if multiple columns
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
    <td>Jump to next matching node, i.e. title starts with this character (if `quicksearch` is true).</td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Tab</kbd>, <kbd>Shift</kbd> + <kbd>Tab</kbd></td>
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
      Behaves as alias for <kbd>F2</kbd> on macOS if <i>edit.trigger</i> option list 
      contains "macEnter".<br>
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
    <td>
      If expanded: collapse. Otherwise set focus to parent node.
    </td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>ArrowRight</kbd></td>
    <td>
      If collapsed: expand. <br>
      Otherwise switch to &rarr;<b>Cell-Nav Mode</b>.
    </td>
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

_Cell-Nav mode_ is only available, when multiple columns are defined.
In this mode we navigate the single grid cells in read-only mode mostly. <br>
However, if the cell contains an embedded <code>&lt;input&gt;</code> element,
we can focus that control and edit its content.

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
      Navigate to adjacent cell.<br>
      <kbd>ArrowLeft</kbd> on the leftmost column switches to &rarr;<b>Row Mode</b>.
    </td>
  </tr>
  <tr>
    <td colspan=2 align=center>
      <kbd>Tab</kbd>, 
      <kbd>Shift</kbd> + <kbd>Tab</kbd>
    </td>
    <td>
      Move to adjacent cell.
    </td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>Escape</kbd></td>
    <td>
      If the focus is inside an embedded <code>&lt;input&gt;</code> element: 
      discard changes and set focus to the outer cell.<br>
      Otherwise switch to &rarr;<b>Row Mode</b>.
    </td>
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
      If on the first column and node is expandable: toggle expansion.<br>
      If the cell contains an embedded <code>&lt;input&gt;</code> element: 
      set focus into that input control.<br>
      If the input control already had the focus, accept the entered data.<br>
      <b>Note:</b> 
      <kbd>Enter</kbd> behaves as alias for <kbd>F2</kbd> on macOS if the 
      <i>edit.trigger</i> option list contains "macEnter".
    </td>
  </tr>
  <tr>
    <td colspan=2 align=center><kbd>AlphaNum</kbd></td>
    <td>
      If the cell contains an embedded <code>&lt;input&gt;</code> element: 
      start editing its value.
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
    <td><kbd>Home</kbd></td>
    <td><kbd>Fn</kbd> + <kbd>ArrowLeft</kbd></td>
    <td> Select leftmost cell. </td>
  </tr>
  <tr>
    <td><kbd>End</kbd></td>
    <td><kbd>Fn</kbd> + <kbd>ArrowRight</kbd></td>
    <td> Select rightmost cell. </td>
  </tr>
  <tr>
    <td><kbd>PageUp</kbd></td>
    <td><kbd>Fn</kbd> + <kbd>ArrowUp</kbd></td>
    <td>
      Select top cell in viewport or scroll one page upwards if we are already 
      at the top.
    </td>
  </tr>
  <tr>
    <td><kbd>PageDown</kbd></td>
    <td><kbd>Fn</kbd> + <kbd>ArrowDown</kbd></td>
    <td>
      Select bottom cell in viewport or scroll one page down if we are already 
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
    <td>Select top / bottom tree cell.</td>
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

- `tree.setNavigationOption(mode: NavModeEnum)`
- `tree.setColumn(colIdx: number|string,  options?: SetColumnOptions)`
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
