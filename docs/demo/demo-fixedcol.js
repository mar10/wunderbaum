/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2022, Martin Wendt (https://wwWendt.de).
 */
document.getElementById("demo-info").innerHTML = `
 A treegrid with a fixed left column: Try horizontal scrolling...
 Navigation mode: 'cell'.
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.querySelector("#demo-tree"),
  // source: "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/ajax_100k_3_1_6.json",
  // source: "../assets/ajax_1k_3_54.json",
  // Columns- and types-definition are part of the Ajax response:
  source: "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/ajax_1k_3_54_t_c.json",
  debugLevel: 5,
  // header: false,
  connectTopBreadcrumb: document.getElementById("parentPath"),
  // checkbox: true,
  // minExpandLevel: 1,
  fixedCol: true,
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

    for (const col of Object.values(e.renderColInfosById)) {
      switch (col.id) {
        case "price":
          col.elem.textContent = "$ " + node.data.price.toFixed(2);
          break;
        case "qty": // thousands separator
          col.elem.textContent = node.data.qty.toLocaleString();
          break;
        case "details": // text control
          if (e.isNew) {
            col.elem.innerHTML = "<input type='text'>";
          }
          util.setValueToElem(col.elem, node.data.details);
          break;
        default:
          // Assumption: we named column.id === node.data.NAME
          val = node.data[col.id];
          if( typeof val === "boolean") {
            col.elem.textContent = val ? "X" : "";
          }else{
            col.elem.textContent = node.data[col.id];
          }
          break;
      }
    }
  },
  update: function (e) {
    // Only used for the demo app (display some stats in the bottom pane):
    showStatus(this);
  },
});
