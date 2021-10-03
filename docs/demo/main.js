document.addEventListener("DOMContentLoaded", (event) => {
  /* ---------------------------------------------------------------------------
   * Demo Tree
   */
  const tree = new mar10.Wunderbaum({
    id: "demo",
    element: document.querySelector("#demo-tree"),
    // source: "../assets/ajax-tree-products.json",
    source:
      "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json",
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
    load: function (e) {
      // e.tree.addChildren({ title: "custom1", classes: "wb-error" });
    },
    change: function (e) {
      console.log(e.name, e);
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
    render: function (e) {
      // console.log(e.name, e.isNew, e);
      const node = e.node;

      if (node.type === "folder" || !node.type) {
        return;
      }

      // const colInfos = e.colInfosById
      // colInfos["price"].elem.textContent = "$ " + node.data.price.toFixed(2);
      // colInfos["qty"].elem.textContent = node.data.qty.toLocaleString();

      for (const col of Object.values(e.colInfosById)) {
        switch (col.id) {
          case "*":
            // node icon & title is rendered by the core
            break;
          case "price":
            col.elem.textContent = "$ " + node.data.price.toFixed(2);
            break;
          case "qty": // thousands separator
            col.elem.textContent = node.data.qty.toLocaleString();
            break;
          default:
            // Assumption: we named column.id === node.data.NAME
            col.elem.textContent = node.data[col.id];
            break;
        }
      }

      // for (let i = 0; i < e.colInfos.length; i++) {
      //   const elem = e.colElems[i];
      //   const col = e.colInfos[i];

      //   switch (col.id) {
      //     case "*":
      //       // node icon & title is rendered by the core
      //       break;
      //     case "price":
      //       elem.textContent = "$ " + node.data.price.toFixed(2);
      //       break;
      //     case "qty": // thousands separator
      //       elem.textContent = node.data.qty.toLocaleString();
      //       break;
      //     default:
      //       // Assumption: we named column.id === node.data.NAME
      //       elem.textContent = node.data[col.id];
      //       break;
      //   }
      //
      // elem.setAttribute("contenteditable", true);
      // }
    },
    update: function (e) {
      console.log(e.name, e);
      showStatus(this);
    },
  });
});
