/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */
/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-info").innerHTML = `
 A read-only treegrid (no d'n'd).
Navigation mode: 'cell'.
 `;

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  debugLevel: 5,
  connectTopBreadcrumb: document.getElementById("parentPath"),
  // checkbox: true,
  // fixedCol: true,
  navigationModeOption: "cell",
  // The JSON only contains a list of nested node dicts (no types or columns):
  source:
    "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/tree_department_M_p.json",
  types: {
    department: { icon: "bi bi-diagram-3", colspan: true },
    role: { icon: "bi bi-microsoft-teams", colspan: true },
    person: { icon: "bi bi-person" },
  },
  columns: [
    { title: "Title", id: "*", width: "250px" },
    { title: "Age", id: "age", width: "60px", classes: "wb-helper-end" },
    { title: "Date", id: "date", width: "90px", classes: "wb-helper-end" },
    {
      title: "Status",
      id: "state",
      width: "70px",
      classes: "wb-helper-center",
    },
    {
      title: "Avail.",
      id: "avail",
      width: "60px",
      classes: "wb-helper-center",
    },
    { title: "Remarks", id: "remarks", width: "*" },
  ],
  columnsResizable: true,
  columnsSortable: true,
  filter: {
    connectInput: "input#filterQuery",
  },
  init: (e) => {},
  buttonClick: function (e) {
    console.log(e.type, e);
    if (e.command === "sort") {
      e.tree.sortByProperty({ colId: e.info.colId, updateColInfo: true });
    }
  },
  render: function (e) {
    // console.log(e.type, e.isNew, e);
    const node = e.node;
    // const util = e.util;

    // Render formatted data values for all columns
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
        case "state":
          {
            const map = { h: "Happy", s: "Sad" };
            col.elem.textContent = map[val] || "n.a.";
          }
          break;
        case "avail":
          col.elem.textContent = val ? "Yes" : "No";
          break;
        default:
          // Assumption: we named column.id === node.data.NAME
          col.elem.textContent = val;
          break;
      }
    }
  },
});
