document.addEventListener("DOMContentLoaded", (event) => {
  /* ---------------------------------------------------------------------------
   * Navigation
   */
  const navTree = new mar10.Wunderbaum({
    id: "navigation",
    header: "Wunderbaum",
    element: document.querySelector("#nav-tree"),
    checkbox: false,
    minExpandLevel: 2,
    types: {
      link: { icon: "bi bi-link-45deg", classes: "wb-helper-link" },
      code: { icon: "bi bi-file-code" },
    },
    source: [
      {
        title: "GitHub Project",
        type: "link",
        href: "https://github.com/mar10/wunderbaum",
      },
      {
        title: "Tutorial",
        type: "link",
        href: "https://github.com/mar10/wunderbaum",
      },
      {
        title: "API Documentation",
        type: "link",
        href: "../api",
      },
      {
        title: "Demo",
        type: "folder",
        expanded: true,
        children: [
          {
            title: "Products",
            type: "code",
            code: (tree) => {
              tree.load("../assets/ajax-tree-products.json");
            },
          },
          {
            title: "Large data",
            type: "code",
            code: (tree) => {
              tree.load(
                "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json"
              );
            },
          },
          {
            title: "Editable",
            type: "code",
            code: (tree) => {
                tree.load("../assets/ajax-tree-editable.json");
            },
          },
        ],
      },
    ],
    init: (e) => {
      e.tree.findFirst("Products").setActive(true, {noEvent: true})
    },
    click: (e) => {
      switch (e.node.type) {
        case "link":
          window.open(e.node.data.href);
          break;
        case "code":
          const tree = mar10.Wunderbaum.getTree("demo");
          e.node.data.code(tree);
          break;
      }
    },
  });

  /* ---------------------------------------------------------------------------
   * Demo Behavior
   */
  // setTimeout(() => {
  //   tree.root.load(
  //     "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json"
  //   );
  // }, 0);

  document.querySelector("a#expand-all").addEventListener("click", (event) => {
    const tree = mar10.Wunderbaum.getTree("demo");

    console.time("expandAll");
    tree.expandAll().then(() => {
      console.timeEnd("expandAll");
    });
  });

  document
    .querySelector("a#collapse-all")
    .addEventListener("click", (event) => {
      const tree = mar10.Wunderbaum.getTree("demo");

      console.time("collapseAll");
      tree.expandAll(false);
      console.timeEnd("collapseAll");
    });
});

function showStatus(tree, options) {
  const info = document.querySelector("#tree-info");
  const elemCount = document.querySelector("#demo-tree .wb-node-list")
    .childElementCount;
  const msg =
    `Nodes: ${tree.count().toLocaleString()}, rows: ${tree
      .count(true)
      .toLocaleString()}, rendered: ${elemCount}` + `.`;

  info.textContent = msg;
  tree._check();
}
