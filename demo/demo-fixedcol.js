/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */
/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-info").innerHTML = `
 A treegrid with a fixed left column: Try horizontal scrolling...
 Navigation mode: 'cell'.
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  // Columns- and types-definition are part of the Ajax response:
  source:
    // "../../test/fixtures/tree_department_M_t_c.json",
    "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/tree_department_M_t_c_comp.json",
  // "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/fixture_department_1k_3_6_p.json",
  debugLevel: 5,
  // header: false,
  connectTopBreadcrumb: document.getElementById("parentPath"),
  // checkbox: true,
  // minExpandLevel: 1,
  fixedCol: true,
  // columnsResizable: true,
  navigationModeOption: "cell",
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
      // Assumption: we named column.id === node.data.NAME
      const val = node.data[col.id];

      switch (col.id) {
        case "date":
          if (val) {
            const dt = new Date(val);
            col.elem.textContent = dt.toISOString().slice(0, 10);
          } else {
            col.elem.textContent = "n.a.";
          }
          break;
        case "mood":
          {
            const map = { h: "Happy", s: "Sad" };
            col.elem.textContent = map[val] || "";
          }
          break;
        case "price":
          col.elem.textContent = "$ " + val.toFixed(2);
          break;
        case "qty": // thousands separator
          col.elem.textContent = val.toLocaleString();
          break;
        case "details": // text control
          if (e.isNew) {
            col.elem.innerHTML = "<input type='text'>";
          }
          util.setValueToElem(col.elem, val);
          break;
        default:
          // Assumption: we named column.id === node.data.NAME
          if (typeof val === "boolean") {
            col.elem.textContent = val ? "X" : "";
          } else {
            col.elem.textContent = val;
          }
          break;
      }
    }
  },
});
