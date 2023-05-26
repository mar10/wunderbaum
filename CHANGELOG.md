# 1.0.0 / Unreleased

First release.

# Beta-Changes since v0.2.0

> This section will be removed after the beta phase. <br>
> Note that semantic versioning rules are not strictly followed during this phase.

- v0.2.1: new option `tree.options.emptyChildListExpandable` controls if
  parent nodes with `node.children === []` are still expandable 
  (like macOS Finder). Defaults to false.
- v0.2.1: `load()`, `source` and `lazyLoad` now support an extended sytax :
  ```js
  source: {
    url: "path/to/request",
    params: {},  // key/value pairs converted to URL parameters
    body: {},    // key/value pairs converted to JSON body (defaults to method POST)
    options: {}, // passed to `fetch(url, OPTIONS)`
  }
  ```
- v0.2.1: Add  `node.setIcon()`.
- v0.2.1: Add  `tree.` and `node.sortChildren()`.
- v0.2.1: Removed `tree.updateColumns()`. Use `tree.setModified(ChangeType.colStructure)` instead.
