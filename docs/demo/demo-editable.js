/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */
/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-info").innerHTML = `
 A treegrid with embedded input controls (also renaming nodes, but no filter or d'n'd).
 Navigation mode: 'startRow'.
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  debugLevel: 5,
  connectTopBreadcrumb: document.getElementById("parentPath"),
  checkbox: true,
  // fixedCol: true,
  // navigationModeOption: "row",
  navigationModeOption: "startRow",
  // navigationModeOption: "cell",

  // The JSON only contains a list of nested node dicts, but no types or
  // column definitions:
  source:
    "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/tree_department_M_p.json",
  types: {
    department: { icon: "bi bi-diagram-3", colspan: true },
    role: { icon: "bi bi-microsoft-teams", colspan: true },
    person: { icon: "bi bi-person" },
  },
  // The `html` properties are shown as comments.
  // If enabled, it would be used as markup, so `if (e.isNew) {...}` could be
  // omitted in the `render` callback:
  columns: [
    {
      title: "Title",
      id: "*",
      width: "250px",
    },
    {
      title: "Age",
      id: "age",
      width: "50px",
      classes: "wb-helper-end",
      // "html": "<input type=number min=0 tabindex='-1'>",
    },
    {
      title: "Date",
      id: "date",
      width: "100px",
      classes: "wb-helper-end",
      // "html": '<input type=date tabindex="-1">',
    },
    {
      title: "Status",
      id: "state",
      width: "70px",
      classes: "wb-helper-center",
      // "html": `<select tabindex="-1">
      //     <option value="h">Happy</option>
      //     <option value="s">Sad</option>
      //     </select>`
    },
    {
      title: "Avail.",
      id: "avail",
      width: "80px",
      classes: "wb-helper-center",
      // "html": '<input type=checkbox tabindex="-1">',
    },
    {
      title: "Remarks",
      id: "remarks",
      width: "*",
      // "html": "<input type=text tabindex='-1'>",

      menu: true,
    },
  ],
  columnsResizable: true,
  columnsSortable: true,

  edit: {
    trigger: ["clickActive", "F2"], // "macEnter"],
    select: true,
    beforeEdit: function (e) {
      // console.log(e.type, e);
      // return e.node.type === "person";
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
    // noData: "No matching nodes",
  },
  init: (e) => {},
  // load: function (e) {
  // },
  buttonClick: function (e) {
    console.log(e.type, e);
    if (e.command === "sort") {
      e.tree.sortByProperty({ colId: e.info.colId, updateColInfo: true });
    }
  },
  change: function (e) {
    const util = e.util;
    const node = e.node;
    const info = e.info;
    const colId = info.colId;

    this.logDebug(`change(${colId})`, util.getValueFromElem(e.inputElem, true));
    // For demo purposes, simulate a backend delay:
    return util.setTimeoutPromise(() => {
      // Assumption: we named column.id === node.data.NAME

      // We can hand-code and customize it like so:
      // switch (colId) {
      //   case "author":
      //   case "details":
      //   case "price":
      //   case "qty":
      //   case "sale": // checkbox control
      //   case "avail": // checkbox control
      //   case "state": // dropdown
      //   case "year":
      //     // e.node.data[colId] = e.inputValue;
      //     // ... but this helper should work in most cases:
      //     e.node.data[colId] = util.getValueFromElem(e.inputElem, true);
      //     break;
      // }

      // ... but this helper should work in most cases:
      node.data[colId] = util.getValueFromElem(e.inputElem, true);
    }, 500);
  },
  render: function (e) {
    // console.log(e.type, e.isNew, e);
    const node = e.node;
    const util = e.util;

    // Render embedded input controls for all data columns
    for (const col of Object.values(e.renderColInfosById)) {
      // Assumption: we named column.id === node.data.NAME
      const val = node.data[col.id];

      switch (col.id) {
        case "author":
          if (e.isNew) {
            col.elem.innerHTML = '<input type="text" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        case "remarks": // text control
          if (e.isNew) {
            col.elem.innerHTML = '<input type="text" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        // case "details": // text control
        //   if (e.isNew) {
        //     col.elem.innerHTML = '<input type="text" tabindex="-1">';
        //   }
        //   util.setValueToElem(col.elem, node.data.details);
        //   break;
        // case "price":
        //   if (e.isNew) {
        //     col.elem.innerHTML = '<input type="number" min="0.00" step="0.01" tabindex="-1">';
        //   }
        //   util.setValueToElem(col.elem, node.data.price.toFixed(2));
        //   break;
        case "age":
          if (e.isNew) {
            col.elem.innerHTML = '<input type="number" min="0" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        case "state":
          if (e.isNew) {
            col.elem.innerHTML = `<select tabindex="-1">
                <option value="h">Happy</option>
                <option value="s">Sad</option>
                </select>`;
          }
          util.setValueToElem(col.elem, val);
          break;
        case "avail":
          if (e.isNew) {
            col.elem.innerHTML = '<input type="checkbox" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        // case "qty":
        //   if (e.isNew) {
        //     col.elem.innerHTML = '<input type="number" min="0" tabindex="-1">';
        //   }
        //   util.setValueToElem(col.elem, val);
        //   break;
        // case "sale": // checkbox control
        //   if (e.isNew) {
        //     col.elem.innerHTML = '<input type="checkbox" tabindex="-1">';
        //   }
        //   // Cast value to bool, since we don't want tri-state behavior
        //   util.setValueToElem(col.elem, !!val);
        //   break;
        case "date":
          if (e.isNew) {
            col.elem.innerHTML = '<input type="date" tabindex="-1">';
          }
          util.setValueToElem(col.elem, val);
          break;
        // case "year":
        //   if (e.isNew) {
        //     col.elem.innerHTML = '<input type="number" max="9999" tabindex="-1">';
        //   }
        //   util.setValueToElem(col.elem, node.data.year);
        //   break;
        default:
          // Assumption: we named column.id === node.data.NAME
          col.elem.textContent = node.data[col.id];
          break;
      }
    }
  },
});
