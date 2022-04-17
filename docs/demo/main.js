document.addEventListener("DOMContentLoaded", (event) => {
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
    edit: {
      trigger: ["clickActive", "F2", "macEnter"],
      select: true,
      beforeEdit: function (e) {
        console.log(e.name, e);
        // return false;
      },
      edit: function (e) {
        console.log(e.name, e);
      },
      apply: function (e) {
        console.log(e.name, e);
        // Simulate async storage that also validates:
        return e.util.setTimeoutPromise(() => {
          e.inputElem.setCustomValidity("")
          if( e.newValue.match(/.*\d.*/)){
            e.inputElem.setCustomValidity("No numbers please.")
            return false;
          }
        }, 1000);
      },
    },
    filter: {
      attachInput: "input#filterQuery",
      // mode: "dim",
    },
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
    change: function (e) {
      console.log(e.name, e);
      return e.util.setTimeoutPromise(() => {
        e.node.data.sale = e.inputValue;
      }, 1000);
    },
    render: function (e) {
      // console.log(e.name, e.isNew, e);
      const node = e.node;
      const util = e.util;

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
          case "sale": // checkbox control
            col.elem.innerHTML = "<input type='checkbox'>";
            util.setValueToElem(col.elem, !!node.data.sale);
            break;
          default:
            // Assumption: we named column.id === node.data.NAME
            col.elem.textContent = node.data[col.id];
            break;
        }
      }
    },
    update: function (e) {
      // console.log(e.name, e);
      showStatus(this);
    },
  });
});
