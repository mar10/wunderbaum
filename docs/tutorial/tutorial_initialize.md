# Loading and Initialization

## General Format and API

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" media="screen" href="../wunderbaum.css" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.0/font/bootstrap-icons.css"
    />

    <script defer src="../wunderbaum.umd.js"></script>
    <script defer src="main.js"></script>
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

```js
document.addEventListener("DOMContentLoaded", (event) => {
  const tree = new mar10.Wunderbaum({
    id: "demo",
    element: document.querySelector("#demo-tree"),
    source: "../assets/ajax-tree-products.json",
    debugLevel: 5,
    types: {},
    columns: [{ id: "*", title: "Product", width: "250px" }],
    init: (e) => {
      // e.tree.setFocus();
    },
    load: function (e) {
      // e.tree.addChildren({ title: "custom1", classes: "wb-error" });
    },
    lazyLoad: function (e) {
      console.log(e.name, e);
      // return { url: "../assets/ajax-lazy-sample.json" };
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // reject("Epic fail")
          resolve({ url: "../assets/ajax-lazy-sample.json" });
        }, 1500);
      });
    },
    render: function (e) {},
  });
});
```

### Use Type Information

### Column Definitions

## Load Events

##
