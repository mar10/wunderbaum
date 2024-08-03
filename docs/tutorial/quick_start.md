# Quick Start

!!! note

    Wunderbaum has beta status:<br>
    API, Markup, Stylesheet, etc. are still subject to change.

A Wunderbaum control is added to a web page by defining a `<div>` tag and
then create a new _Wunderbaum_ class instance, passing the tag and configuration
options.

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Additional icon fonts. Wunderbaum uses bootstrap icons by default. -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css"
    />
    <!-- Wunderbaum CSS and Library -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/wunderbaum@0/dist/wunderbaum.min.css"
    />
    <script
      defer
      src="https://cdn.jsdelivr.net/npm/wunderbaum@0/dist/wunderbaum.umd.min.js"
    ></script>
    <!-- Your application code -->
    <script>
      data = [
        {
          title: "Node 1",
          expanded: true,
          children: [
            {
              title: "Node 1.1",
            },
            {
              title: "Node 1.2",
            },
          ],
        },
        {
          title: "Node 2",
        },
      ];

      document.addEventListener("DOMContentLoaded", (event) => {
        const tree = new mar10.Wunderbaum({
          element: document.getElementById("demo-tree"),
          source: data,
          init: (e) => {
            e.tree.setFocus();
          },
          activate: (e) => {
            alert(`Thank you for activating ${e.node}.`);
          },
        });
      });
    </script>
  </head>

  <body>
    ...
    <div
      id="demo-tree"
      class="wb-skeleton wb-initializing wb-fade-expander"
    ></div>
    ...
  </body>
</html>
```

ESM modules are also supported:

```html
<script type="module">
  import wunderbaum from "https://cdn.jsdelivr.net/npm/wunderbaum@0/+esm";
</script>
```

!!! info

    Wunderbaum is a refactored version of [Fancytree](https://github.com/mar10/fancytree).

    Read [migrate](migrate.md) for details and migration hints.

!!! info

    See also the [API Documentation](https://mar10.github.io/wunderbaum/api/)
    and the [live demo](https://mar10.github.io/wunderbaum/demo/).
