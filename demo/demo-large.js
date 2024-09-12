/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */
/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-info").innerHTML = `
 A treegrid with about 100,000 nodes.
 Navigation mode: 'row'.
 `;

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  debugLevel: 5,
  connectTopBreadcrumb: document.getElementById("parentPath"),
  // checkbox: false,
  // minExpandLevel: 1,
  // fixedCol: true,
  navigationModeOption: "row",
  source:
    // "../../test/fixtures/tree_store_XL_t_c_comp.json",
    "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/tree_store_XL_t_c_comp.json",
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
    // e.tree.setFocus();
  },
  load: function (e) {
    // e.tree.addChildren({ title: "custom1", classes: "wb-error" });
  },
  lazyLoad: function (e) {
    console.log(e.type, e);
    // return { url: "../assets/json/ajax-lazy-products.json" };
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // reject("Epic fail")
        resolve({ url: "../assets/json/ajax-lazy-products.json" });
      }, 1500);
    });
  },
  buttonClick: function (e) {
    console.log(e.type, e);
    if (e.command === "sort") {
      e.tree.sortByProperty({ colId: e.info.colId, updateColInfo: true });
    } else if (e.command === "menu") {
      // eslint-disable-next-line no-alert
      alert("Menu clicked");
    }
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
      // e.node.update()
    }, 500);
  },
  render: function (e) {
    // console.log(e.type, e.isNew, e);
    const node = e.node;
    const util = e.util;

    for (const col of Object.values(e.renderColInfosById)) {
      switch (col.id) {
        case "price":
          col.elem.textContent = "$ " + node.data.price.toFixed(2);
          break;
        case "year": // date stamp
          col.elem.textContent = new Date(node.data.year).getFullYear();
          break;
        case "qty": // thousands separator
          col.elem.textContent = node.data.qty.toLocaleString();
          break;
        case "sale": // checkbox control
          if (e.isNew) {
            col.elem.innerHTML = "<input type='checkbox'>";
          }
          // Cast value to bool, since we don't want tri-state behavior
          util.setValueToElem(col.elem, !!node.data.sale);
          break;
        // case "details": // text control
        //   if (e.isNew) {
        //     col.elem.innerHTML = "<input type='text'>";
        //   }
        //   util.setValueToElem(col.elem, node.data.details);
        // break;
        default:
          // Assumption: we named column.id === node.data.NAME
          col.elem.textContent = node.data[col.id];
          break;
      }
    }
  },
});
