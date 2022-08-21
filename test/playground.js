/*
 * Note: This file must be import as module:
 *     `<script defer type="module" src="playground.js"></script>`
 */

import { Wunderbaum } from "../build/wunderbaum.esm.js";

const util = Wunderbaum.util;
const ModeElemTemplate = `<select tabindex='-1'>
  <option value='1'>O1</option>
  <option value='2'>O2</option>
</select>`;

const tree = new Wunderbaum({
  element: "#tree",
  // checkbox: false,
  id: "Playground",
  // enabled: false,
  fixedCol: true,
  debugLevel: 4,

  header: true, //"Playground", 

  // columns: [
  //   { title: "test", id: "*", width: "200px" },
  //   // {
  //   //   title: "Fav",
  //   //   id: "favorite",
  //   //   width: "30px",
  //   //   classes: "wb-helper-center",
  //   //   html: "<input type=checkbox tabindex='-1'>",
  //   // },
  //   {
  //     title: "Details",
  //     id: "details",
  //     width: "*",
  //     html: "<input type=text tabindex='-1'>",
  //   },
  //   // { title: "Mode", id: "mode", width: "100px" },
  //   {
  //     title: "Date",
  //     id: "date",
  //     width: "100px",
  //     html: "<input type=date tabindex='-1'>",
  //   },
  // ],
  // types: {
  //   book: { icon: "bi bi-book", classes: "extra-book-class" },
  // },
  // showSpinner: true,
  // source: {
  //   children: [
  //     { title: "Node 1", expanded: true, children: [{ title: "Node 1.1" }] },
  //     {
  //       title: "Node 2",
  //       selected: true,
  //       icon: "../docs/assets/favicon/favicon-16x16.png",
  //       children: [
  //         { title: "book2", type: "book" },
  //         { title: "book2", type: "book" },
  //       ],
  //     },
  //     { title: "Node 3", type: "book" },
  //   ],
  // },

  source: "generator/fixture.json",

  dnd: {
    dragStart: (e) => {
      return true;
    },
    dragEnter: (e) => {
      return true;
    },
  },
  // edit: {
  //   validate: (e) => {
  //     e.node.log(`${e.type}`);
  //   },
  // },
  activate: (e) => {
    tree.log(
      e.type,
      e,
      e.node.toDict(false, (d) => {
        d._org_key = d.key;
        delete d.key;
      })
    );
  },
  click: (e) => {
    tree.log(
      e.type,
      e,
      e.node.toDict(false, (d) => {
        d._org_key = d.key;
        delete d.key;
      })
    );
  },
  deactivate: (e) => { },
  discard: (e) => { },
  change: (e) => {
    const node = e.node;
    const value = e.inputValue;

    node.log(e.type, e, value);

    // Simulate a async/delayed behavior:
    return util.setTimeoutPromise(() => {
      // Simulate a validation error
      if (value === "x") {
        throw new Error("No 'x' please");
      }
      // Read the value from the input control that triggered the change event:
      node.data[e.info.colId] = value;
    }, 1500);
  },
  render: (e) => {
    e.node.log(e.type, e);

    if (e.isNew) {
      // Most columns are automatically handled using the `tree.columns.ID.html`
      // setting, but here - for demo purpose - we do it explicitly:
      e.colInfosById["mode"].elem.appendChild(
        util.elemFromHtml(ModeElemTemplate)
      );
    }
    for (const col of Object.values(e.colInfosById)) {
      if (col.id === "*") {
        // The node title is handled by the framework.
        continue;
      }
      switch (col.id) {
        // case "favorite": // checkbox
        // case "mode":
        // case "date":
        // case "details":
        default:
          // Assumption: we named column.id === node.data.NAME
          util.setValueToElem(col.elem, e.node.data[col.id]);
          break;
      }
    }
  },
});

console.log(`Created  ${tree}`);

tree.ready
  .then(() => {
    console.log(`${tree} is ready.`);
  })
  .catch((err) => {
    console.error(`${tree} init failed.`, err);
  });
