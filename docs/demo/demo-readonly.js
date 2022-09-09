/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2022, Martin Wendt (https://wwWendt.de).
 */
document.getElementById("demo-info").innerHTML = `
 A treegrid with embedded input controls (also renaming nodes, but no filter or d'n'd).
 cell-navigation mode
 `;

new mar10.Wunderbaum({
  id: "demo",
  element: document.querySelector("#demo-tree"),
  debugLevel: 5,
  connectTopBreadcrumb: document.getElementById("parentPath"),
  // checkbox: true,
  // fixedCol: true,
  navigationModeOption: "cell",
  source: "../assets/ajax_1k_3_6.json",
  types: {
    "department": { "icon": "bi bi-diagram-3", "colspan": true },
    "role": { "icon": "bi bi-microsoft-teams", "colspan": true },
    "person": { "icon": "bi bi-person" },
  },
  columns: [
    { "title": "Title", "id": "*", "width": "250px" },
    { "title": "Age", "id": "age", "width": "50px", "classes": "wb-helper-end" },
    { "title": "Date", "id": "date", "width": "100px" },
    { "title": "Mood", "id": "mood", "width": "70px" },
    { "title": "Remarks", "id": "remarks", "width": "*" },
  ],

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
  },
  init: (e) => {
  },
  load: function (e) {
  },
  change: function (e) {
    const util = e.util;
    const info = e.info;
    const colId = info.colId;

    // console.log(e.type, util.getValueFromElem(e.inputElem, true));
    // For demo purposes, simulate a backend delay:
    return e.util.setTimeoutPromise(() => {
      // Assumption: we named column.id === node.data.NAME
      switch (colId) {
        case "author":
        case "details":
        case "price":
        case "qty":
        case "sale": // checkbox control
        case "year":
          // We can hand-code and customize it like so:
          // e.node.data[colId] = e.inputValue;
          // ... but this helper should work in most cases:
          e.node.data[colId] = util.getValueFromElem(e.inputElem, true);
          break;
      }
      // e.node.setModified()
    }, 500);
  },
  render: function (e) {
    // console.log(e.type, e.isNew, e);
    const node = e.node;
    const util = e.util;

    // Render embedded input controls for all data columns
    for (const col of Object.values(e.renderColInfosById)) {
      switch (col.id) {
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
