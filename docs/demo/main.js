document.addEventListener("DOMContentLoaded", (event) => {
  /* ---------------------------------------------------------------------------
   * Navigation
   */
  const navTree = new mar10.Wunderbaum({
    id: "navigation",
    header: "Wunderbaum",
    element: document.querySelector("#nav-tree"),
    checkbox: false,
    minExpandLevel: 1,
    types: {
      link: { icon: "bi bi-link-45deg" },
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
        // href: "https://github.com/mar10/wunderbaum",
      },
    ],
    click: (e) => {
      if (e.node.type === "link") {
        window.open(e.node.data.href);
      }
    },
  });

  /* ---------------------------------------------------------------------------
   * Demo Tree
   */
  const tree = new mar10.Wunderbaum({
    id: "demo",
    element: document.querySelector("#demo-tree"),
    source: "../assets/ajax-tree-products.json",
    // source:
    //   "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json",
    debugLevel: 5,
    // checkbox: false,
    // minExpandLevel: 1,
    types: {},
    columns: [
      { id: "*", title: "Product", width: "250px" },
      { id: "author", title: "Author", width: "200px" },
      { id: "year", title: "Year", width: "50px", classes: "wb-helper-end" },
      { id: "qty", title: "Qty", width: "50px", classes: "wb-helper-end" },
      {
        id: "price",
        title: "Price ($)",
        width: "80px",
        classes: "wb-helper-end",
      },
      { id: "details", title: "Details", width: "*" },
    ],
    dnd: {
      dragStart: (e) => {
        if (e.node.type === "folder") {
          return false;
        }
        e.event.dataTransfer.effectAllowed = "all";
        return true;
      },
      dragEnter: (e) => {
        if (e.node.type === "folder") {
          e.event.dataTransfer.dropEffect = "copy";
          return "over";
        }
        return ["before", "after"];
      },
      drop: (e) => {
        console.log("Drop " + e.sourceNode + " => " + e.region + " " + e.node);
      },
    },
    filter: {
      attachInput: "input#filterQuery",
      // mode: "dim",
    },
    // load: function (e) {
    //   e.tree.addChildren({ title: "custom1" });
    // },
    change: function (e) {
      console.log(e.name, e);
    },
    lazyLoad: function (e) {
      console.log(e.name, e);
      return { url: "../assets/ajax-lazy-sample.json" };
    },
    // render: function (e) {
    //   console.log(e.name, e);
    //   document.querySelector("#tree-info").textContent = "todo";
    // },
    renderNode: function (e) {
      // console.log(e.name, e.isNew, e);
      const node = e.node;
      if (node.type === "folder") {
        return;
      }
      // Skip first column (node icon & title is rendered by the core)
      for (let i = 1; i < e.colInfo.length; i++) {
        const elem = e.colElems[i];
        const col = e.colInfo[i];

        switch (col.id) {
          case "price":
            elem.textContent = "$ " + node.data.price.toFixed(2);
            break;
          case "qty": // thousands separator
            elem.textContent = node.data.qty.toLocaleString();
            break;
          default:
            // Assumption: we named column.id === node.data.NAME
            elem.textContent = node.data[col.id];
            break;
        }
        //
        // elem.setAttribute("contenteditable", true);
        // TODO: this should be standard:
        col.classes ? elem.classList.add(...col.classes.split(" ")) : 0;
      }
    },
    update: function (e) {
      console.log(e.name, e);
      showStatus(this);
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
    // let tree = mar10.Wunderbaum.getTree("demo");
    console.time("expandAll");
    tree.expandAll().then(() => {
      console.timeEnd("expandAll");
    });
  });

  document
    .querySelector("a#collapse-all")
    .addEventListener("click", (event) => {
      // let tree = mar10.Wunderbaum.getTree("demo");
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
