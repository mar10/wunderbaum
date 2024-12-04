/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */
/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-info").innerHTML = `
 A readonly treegrid with renaming, 'checkbox: true', 'minExpandLevel: 1'.
 Navigation mode: 'row/cell'.
 <br>
 Click the <i class="bi bi-grid-3x3-gap"></i> button to toggle navigation mode.
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  source: "../assets/json/ajax-tree-products.json",
  debugLevel: 5,
  connectTopBreadcrumb: document.getElementById("parentPath"),
  checkbox: true,
  minExpandLevel: 1,
  // fixedCol: true,
  // Types are sent as part of the source data:
  navigationModeOption: "startRow",
  types: {},
  columns: [
    { id: "*", title: "Product", width: "250px" },
    {
      id: "author",
      title: "Author",
      width: 1,
      minWidth: "100px",
    },
    {
      id: "year",
      title: "Year",
      width: "50px",
      classes: "wb-helper-end",
    },
    {
      id: "qty",
      title: "Qty",
      width: "50px",
      classes: "wb-helper-end",
    },
    {
      id: "price",
      title: "Price ($)",
      width: "80px",
      classes: "wb-helper-end",
    },
    // In order to test horizontal scrolling, we need a fixed or at least minimal width:
    { id: "details", title: "Details", width: 3, minWidth: "200px" },
  ],
  columnsResizable: true,
  columnsSortable: true,
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
      e.sourceNode.moveTo(e.node, e.suggestedDropMode);
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
    connectInput: "input#filterQuery",
    // mode: "dim",
  },
  init: (e) => {
    console.log(e.type, e);
    e.tree.findFirst("More...").setExpanded();
    e.tree
      .findFirst((n) => {
        return n.data.qty === 21;
      })
      .setActive();
    // e.tree.setFocus();
  },
  load: (e) => {
    console.log(e.type, e);
    // e.tree.addChildren({ title: "custom1", classes: "wb-error" });
  },
  buttonClick: function (e) {
    console.log(e.type, e);
    if (e.command === "sort") {
      e.tree.sortByProperty({ colId: e.info.colId, updateColInfo: true });
    }
  },
  lazyLoad: function (e) {
    console.log(e.type, e);
    // return { url: "../assets/json/ajax-lazy-products.json" };
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // reject("Epic fail")
        // resolve({ url: "../assets/json/ajax-lazy-products.json", params: {foo: 42} , options:{method: "PUT"}});
        resolve({ url: "../assets/json/ajax-lazy-products.json" });
      }, 1500);
    });
  },
  render: function (e) {
    // console.log(e.type, e.isNew, e);
    const node = e.node;
    // const util = e.util;

    for (const col of Object.values(e.renderColInfosById)) {
      switch (col.id) {
        default:
          // Assumption: we named column.id === node.data.NAME
          col.elem.textContent = node.data[col.id];
          break;
      }
    }
  },
});
