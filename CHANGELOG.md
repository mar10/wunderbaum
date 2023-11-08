# 1.0.0 / Unreleased

First release.

# Beta-Changes since v0.2.0

> This section will be removed after the beta phase. <br>
> Note that semantic versioning rules are not strictly followed during this phase.

- v0.5.6: #61 Avoid race conditions in debounced 'change' event handler.
- v0.5.6: #64 Accept Promise in `tree.load()`.

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
