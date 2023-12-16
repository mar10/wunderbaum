# Migrate from Fancytree to Wunderbaum

## What has Changed?

**Main Changes to [Fancytree](https://github.com/mar10/fancytree/):**

- Written in TypeScript, transpiled to JavaScript ES6 with type hints (.esm & .umd).
- Removed dependecy on jQuery and jQuery UI.
- Dropped support for Internet Explorer.
- Markup is now `<div>` based, instead of `<ul>/<li>` and `<table>`.
- Grid layout is now built-in standard. A plain tree is only a special case thereof.
- New viewport concept (implies a fixed header and a scrollable body).
- 'Clone' suppport is now built-in standard (i.e. support for duplicate
  `refKey`s in addition to unique `key`s).
- Built-in html5 drag'n'drop.
- Titles are always XSS-safe now (former explicit `escapeTitles: true`).
- 'folder' is no longer a special built-in node type. Instead, the application
  can define any number of node types.

**Missing Features (as of today)**

- Persistence
<!-- - Built-in ARIA -->
