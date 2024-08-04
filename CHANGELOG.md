# 1.0.0 / Unreleased

First release.

# Beta-Changes since v0.2.0

> This section will be removed after the beta phase. <br>
> Note that semantic versioning rules are not strictly followed during this phase.

- v0.11.0: BREAKING
  Renamed `tree.options.resizableColumns` to `columnsResizable`.
- v0.11.0: Add support for icon buttons in column headers (menu, sort, filter).
- v0.11.0: Add `tree.options.columnsSortable` and `ColumnDefinition.sortable`.
- v0.11.0: Add `tree.options.columnsFilerable` and `ColumnDefinition.filterable`.
- v0.11.0: Add `tree.options.columnsMenu` and `ColumnDefinition.menu`.
- v0.11.0: Add `tree.sortByProperty()`.
- v0.11.0: Add `util.rotate()`.
- v0.11.0: Migrate documentation from docsify to MkDocs.

- v0.10.1: Fix column resizer for Edge.

- v0.10.0: Add `tree.options.resizableColumns` and `ColumnDefinition.resizable`.
- v0.10.0: Add `tree.resetColumns()`.

- v0.9.0: DEPRECATE `tree.filterBranches()`:
  use `tree.filterNodes(..., {matchBranch: true})` instead.
- v0.9.0: Allow to pass a RegEx to filterNodes()
- v0.9.0: Add `tree.countMatches()` method.
- v0.9.0: Add `node.hasFocus()` method.
- v0.9.0: Fix `tree.filter.hideExpanders` option.
- v0.9.0: Drop `tree.filter.count` and `hideExpandedCounter` options in favor of
  `tree.iconBadge` (see tutorial for an example).

- v0.8.4: Fix #90: Add tooltip functionality to node titles.

- v0.8.3: Fix #84: After editing a node title a javascript error
  "Cannot read properties of null (reading '\_render')" occurs (Chromium).

- v0.8.2: Fix #82: Drag/Drop of nodes does not work any more.

- v0.8.1: Distinguish between `.log()` and `.logDebug()`, which now call
  `console.log()` and `console.debug()` respectively.
- v0.8.1: Fix #72: DragEnter event does not provide the source node, only the target.
- v0.8.1: Fix #73: Fix typing of `tree.options.dnd.dropEffect` and others.
- v0.8.1: Fix #75: After reloading nodes with "resetLazy", wunderbaum is broken.
- v0.8.1: Fix #76: Lazyload could be called for the same node multiple times.
- v0.8.1: Fix #78: Add JS Bin template for reporting issues.
- v0.8.1: Fix #79: Improve logging when drop operation is prevented.
- Thanks to @jogibear9988 for the testing, opening, and contributing to most of
  these issues.

- v0.8.0: Add `expand(e)` and `beforeExpand(e)` events.
- v0.8.0: Add `tree.findByRefKey()`, `node.getCloneList()`, and `node.isClone()`.
- v0.8.0: Add `node.startEditTitle()`.
- v0.8.0: Fix #70: resetLazy does not remove sub childrens "key"s, so error
  occurs when re-adding.
- v0.8.0: Allow to `throw new ValidationError()` in `tree.change(e)` event.
- v0.8.0: `node.setActive()` allows to focus or edit a cell.
- v0.8.0: Rename `tree.isEditing()` to `.isEditingTitle()`
  and add `tree.isEditing()` to check for title _and_ grid cell editing.

- v0.7.0: #68 Always reset 'loading' status.
- v0.7.0: #69 prevent iOS browser from opening links on drop.
- v0.7.0: BREAKING CHANGE:
  Changed syntax format for compressed formats:

  - `_keyMap: {"t": "title", ...}` -> `_keyMap: {"title": "t", ...}`.
  - `_typeList: [...]` -> `_valueMap: {"type": [...]}`.
    This allows to compress values of other properties than `type`.

- v0.6.0: #61 Avoid race conditions in debounced 'change' event handler.
- v0.6.0: #63 Don't overwrite dataTransfer 'text/plain' on drag'n'drop.
- v0.6.0: #64 Accept Promise in `tree.load()`.

- v0.5.5: Rename `defaultDropMode` -> `suggestedDropMode`; add `suggestedDropEffect`
- v0.5.5: Work on drag'n'drop (dropEffects, cross-window, ...)

- v0.5.4: Use eslint
- v0.5.4: Removed deprecated `setModified()`

- v0.5.2: Improved typing and drag'n'drop behavior (@jogibear9988)
- v0.5.2: Add `tree.options.adjustHeight` (default: `true`)
- v0.5.2: Add `tree.options.scrollIntoViewOnExpandClick` (default: `true`)
- v0.5.2: Add `tree.options.dnd.serializeClipboardData` (default: `true`)

- v0.5.1: Add EXPERIMENTAL support for `tree.iconBadge` (allows to implement counter badges, ...)

- v0.5.0: Add support for Font Awesome icons (`options.iconMap: "fontawesome6"`)

- v0.4.0: Add support for hierarchical selection (`selectMode: "hier"`)
- v0.4.0: Add support for radio-groups

- v0.3.6: Remove import of wunderbaum.scss into TS modules
- v0.3.6: Renamed `setModified()` to `update()`
- v0.3.6: Removed `node.render()`: use `node.update()` instead
- v0.3.6: #26: New option `autoCollapse` and methods `node.collapseSiblings()`

- v0.3.5: #23: New `columns` option `headerClasses`

- v0.3.4: Add `tree.toDictArray()`
- v0.3.4: #21: Use CSS variables to allow dynamic custom themes
- v0.3.4: #22: Set box-sizing: border-box
- v0.3.4: #23: wb-helper-end is not applied to column header

- v0.3.2, v0.3.3: Improve distribution

- v0.3.1: #20: Fix sourcemaps
- v0.3.1: #19: Fix missing icons in deploymet by inlining
- v0.3.1: #19: Make options optional: debugLevel, edit, filter, grid
- v0.3.1: Update typescript to 5.x

- v0.3.0: new option `tree.options.emptyChildListExpandable` controls if
  parent nodes with `node.children === []` are still expandable
  (like macOS Finder). Defaults to false.
- v0.3.0: `load()`, `source` and `lazyLoad` now support an extended sytax :
  ```js
  source: {
    url: "path/to/request",
    params: {},  // key/value pairs converted to URL parameters
    body: {},    // key/value pairs converted to JSON body (defaults to method POST)
    options: {}, // passed to `fetch(url, OPTIONS)`
  }
  ```
- v0.3.0: Add `node.setIcon()`.
- v0.3.0: Add `tree.` and `node.sortChildren()`.
- v0.3.0: Removed `tree.updateColumns()`. Use `tree.setModified(ChangeType.colStructure)` instead.
