# Migrate from Fancytree to Wunderbaum

> See also the [Wunderbaum Overview](/tutorial/index.md) for a general overview.

## Main Differences
**Main Changes to [Fancytree](https://github.com/mar10/fancytree/):**

- Removed dependecy to jQuery and jQuery UI
- Dropped support for Internet Explorer
- Markup now `<div>` based, instead of `<ul>/<li>` and `<table>`
- Grid layout is now built-in standard. A plain tree is only a special case thereof.
- Clone suppport is standard (i.e. support for duplicate `refKey`s in addition
  to unique `key`s).
- Built-in html5 drag'n'drop
- Built-in ARIA
- escapeTitles: true
- 'folder' is no longer a builtin type
