document.addEventListener("DOMContentLoaded", (event) => {
  /* ---------------------------------------------------------------------------
   * Navigation
   */
  let navTree = new mar10.Wunderbaum({
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
  let tree = new mar10.Wunderbaum({
    id: "demo",
    element: document.querySelector("#demo-tree"),
    source:
      "../assets/ajax-tree-products.json",
    // source:
    //   "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json",
    debugLevel: 5,
    // checkbox: false,
    // minExpandLevel: 1,
    types: {},
    columns: [
      { id: "*", title: "Product", width: "250px" },
      { id: "author", title: "Author", width: "200px" },
      { id: "year", title: "Year", width: "50px", classes: "wb-helper-right" },
      { id: "qty", title: "Qty", width: "50px", classes: "wb-helper-right" },
      { id: "price", title: "Price ($)", width: "50px", classes: "wb-helper-right" },
      { id: "details", title: "Details", width: "*" },
    ],
    dnd: {
      dragStart: (e) => {
        return true;
      },
      dragEnter: (e) => {
        return true;
      },
    },
    filter: {
      attachInput: "input#filterQuery",
      // mode: "dimm",
    },
    change: function (e) {
      console.log(e.name, this, arguments);
    },
    // render: function (e) {
    //   console.log(e.name, this, arguments);
    //   document.querySelector("#tree-info").textContent = "todo";
    // },
    renderColumns: function (e) {
      console.log(e.name, this, arguments);
      const node = e.node;
      if (node.type === "folder") {
        return;
      }
      // Skip first column
      for (let i = 1; i < e.colInfo.length; i++) {
        let elem = e.colElems[i];
        let info = e.colInfo[i];
        // Assumption: we named type.id === node.data.NAME
        elem.textContent = node.data[info.id];
        //
        elem.setAttribute("contenteditable", true);
        // TODO: this should be standard:
        info.classes ? elem.classList.add(...info.classes.split(" ")) : 0;
      }
      // document.querySelector("#tree-info").textContent = "todo";
    },
    update: function (e) {
      console.log(e.name, this, arguments);
      showStatus(this);
    },
  });
  /* ---------------------------------------------------------------------------
   * Demo Behavior
   */
  document.querySelector("a#expand-all").addEventListener("click", (event) => {
    // let tree = mar10.Wunderbaum.getTree("demo");
    console.time("expandAll");
    tree.expandAll().then(() => {
      console.timeEnd("expandAll");
    });
  });

  document.querySelector("a#collapse-all").addEventListener("click", (event) => {
    // let tree = mar10.Wunderbaum.getTree("demo");
    console.time("collapseAll");
    tree.expandAll(false);
    console.timeEnd("collapseAll");
  });
});


function showStatus(tree, options) {
  const info = document.querySelector("#tree-info");
  const elemCount = document.querySelector("#demo-tree .wb-node-list").childElementCount;
  const msg =
    `Nodes: ${tree.count().toLocaleString()}, rows: ${tree
      .count(true)
      .toLocaleString()}, rendered: ${elemCount}` + `.`;
  info.textContent = msg;
  tree._check();
}
