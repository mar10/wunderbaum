/**
 * Demo code for wunderbaum.ts
 *
 * Copyright (c) 2021-2022, Martin Wendt (https://wwWendt.de).
 * https://github.com/mar10/wunderbaum
 */
document.getElementById("demo-info").innerHTML = `
 A treegrid with ...
 `;

new mar10.Wunderbaum({
  id: "demo",
  element: document.querySelector("#demo-tree"),
  source: "../assets/ajax-tree-products.json",
  debugLevel: 5,
  attachBreadcrumb: document.getElementById("parentPath"),
  // checkbox: false,
  // minExpandLevel: 1,
  // fixedCol: true,
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
    // In order to test horizontal scrolling, we need a minimal width:
    { id: "details", title: "Details", width: "*", minWidth: "600px" },
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
      console.log(e.type, e);
      // return false;
    },
    edit: function (e) {
      console.log(e.type, e);
    },
    apply: function (e) {
      console.log(e.type, e);
      // Simulate async storage that also validates:
      return e.util.setTimeoutPromise(() => {
        e.inputElem.setCustomValidity("");
        if (e.newValue.match(/.*\d.*/)) {
          e.inputElem.setCustomValidity("No numbers please.");
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
    console.log(e.type, e);
    // return { url: "../assets/ajax-lazy-sample.json" };
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // reject("Epic fail")
        resolve({ url: "../assets/ajax-lazy-sample.json" });
      }, 1500);
    });
  },
  change: function (e) {
    const info = e.info;
    const colId = info.colId;

    console.log(e.type, e);
    // For demo purposes, simulate a backend delay:
    return e.util.setTimeoutPromise(() => {
      // Assumption: we named column.id === node.data.NAME
      switch (colId) {
        case "sale":
        case "details":
          e.node.data[colId] = e.inputValue;
          break;
      }
      // e.node.setModified()
    }, 500);
  },
  render: function (e) {
    // console.log(e.type, e.isNew, e);
    const node = e.node;
    const util = e.util;

    if (node.type === "folder" || !node.type) {
      return;
    }

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
          console.log(e.type, e);

          if (e.isNew) {
            col.elem.innerHTML = "<input type='checkbox'>";
          }
          // Cast value to bool, since we don't want tri-state behavior
          util.setValueToElem(col.elem, !!node.data.sale);
          break;
        case "details": // text control
          if (e.isNew) {
            col.elem.innerHTML = "<input type='text'>";
          }
          util.setValueToElem(col.elem, node.data.details);
          break;
        default:
          // Assumption: we named column.id === node.data.NAME
          col.elem.textContent = node.data[col.id];
          break;
      }
    }
  },
  update: function (e) {
    // Only used for the demo app (display some stats in the bottom pane):
    showStatus(this);
  },
});
