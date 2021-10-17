## Keyboard Navigation

> See also the [Wunderbaum Overview](tutorial.md) for a general overview.

The option `keyboard: true` should be used to control if standard keyboard
navigation is enabled.

Related options:

```js
{
  navigationMode: "allow",
  quicksearch: true,
}
```

Related methods:

- `setCellMode(mode: NavigationMode)`
- `setColumn(colIdx: number)`

Related events:

```js
```

General Key mapping ('row mode'):

- <kbd>+</kbd>: Expand node.
- <kbd>-</kbd>: Collapse node.
- <kbd>SPACE</kbd>: in select mode: toggle selection. Otherwise set active.
- <kbd>ENTER</kbd>: Set active.
- <kbd>BACKSPACE</kbd>: Set focus to parent.
- <kbd>LEFT</kbd>: If expanded: collapse. Otherwise set focus to parent.
- <kbd>RIGHT</kbd>: If collapsed: expand. Otherwise set focus to first child.
- <kbd>UP</kbd>: Set focus to previous sibling (or parent if already on first sibling).
- <kbd>DOWN</kbd>: Set focus to next visible node.
- <kbd>Ctrl</kbd>+<kbd>Cursor</kbd>: Same as `Cursor`, but only sets the focus,
  even if `autoActivate` is on.
- <kbd>F2</kbd> edit title (requires edit extension)

- Note that we distinguish 'focused', 'active', and 'selected'.
'Set focus' only sets a dotted border around the node. When `autoActivate`
is enabled (which is on by default), the node also gets activated.
- Special case table extension:
If the table is only used readonly to get a column-alignment, we can use the
above mapping.
??? If the grid contains checkboxes or input fields however, it would be desirable
to navigate between the grid cells with `TAB`, `Shift-TAB`, `UP`, `DOWN`?

The `tabbable: true` option was added to control the behavior when the tree is
part of a web form.
If we TAB through a form that contains a tree and other controls, the tree
should *behave like a listbox*, i.e.

- be entered / exited using TAB, i.e. be part of the tab index chain
- set focus to the active node when entered using TAB
- it is possible that the tree control is active, but no node is yet active
  (see the listbox in the 'Embed in Forms' demo, at least in Safari).
- optionally activate first node when entered using TAB and no node was active
- gray out active node marker when tree control looses focus

If the default implementation for `keyboard: true` also satisfies these
requirements (and makes all users happy), maybe we can remove the tabbable option.
