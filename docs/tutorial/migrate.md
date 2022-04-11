# Migrate from Fancytree to Wunderbaum

?> See also the [General Overview](/tutorial/overview.md).

## Main Differences
**Main Changes to [Fancytree](https://github.com/mar10/fancytree/):**

- Removed dependecy on jQuery and jQuery UI
- Dropped support for Internet Explorer
- Markup is now `<div>` based, instead of `<ul>/<li>` and `<table>`
- Grid layout is now built-in standard. A plain tree is only a special case thereof.
- New viewport concept (implies a fixed header)
- Clone suppport is standard (i.e. support for duplicate `refKey`s in addition
  to unique `key`s).
- Built-in html5 drag'n'drop
<!-- - Built-in ARIA -->
- Titles are always XSS-safe now (`escapeTitles: true`)
- 'folder' is no longer a built-in type
- Written in TypeScript, transpiled to JavaScript ES6 with type hints (.esm & .umd).

**Missing Features (So Far)**

- Persistence
- Hierarcical Multi-Selection
- Fixed Columns
