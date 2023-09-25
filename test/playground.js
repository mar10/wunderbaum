/*
 * Note: This file must be import as module:
 *     `<script defer type="module" src="playground.js"></script>`
 */

import { Wunderbaum } from "../build/wunderbaum.esm.min.js";

const util = Wunderbaum.util;
// const ModeElemTemplate = `<select tabindex='-1'>
//   <option value='1'>O1</option>
//   <option value='2'>O2</option>
// </select>`;
let sequence = 1;
const tree = new Wunderbaum({
  element: "#tree",
  // checkbox: (node) => "radio",
  // checkbox: "radio",
  // checkbox: true,
  id: "Playground",
  // enabled: false,
  fixedCol: true,
  debugLevel: 4,
  // minExpandLevel: 1,
  emptyChildListExpandable: true,
  // autoCollapse: true,
  header: true, //"Playground",
  // navigationModeOption: "cell",
  // scrollIntoViewOnExpandClick: false,
  // showSpinner: true,

  columns: [
    { title: "test", id: "*", width: "200px" },
    // {
    //   title: "Fav",
    //   id: "favorite",
    //   width: "30px",
    //   classes: "wb-helper-center",
    //   html: "<input type=checkbox tabindex='-1'>",
    // },
    {
      title: "Details",
      id: "details",
      width: "100px",
      html: "<input type=text tabindex='-1'>",
      headerClasses: "wb-helper-center",
      // headerClasses: "",
      classes: "wb-helper-end",
    },
    // { title: "Mode", id: "mode", width: "100px" },
    {
      title: "Date",
      id: "date",
      width: "100px",
      html: "<input type=date tabindex='-1'>",
    },
  ],
  types: {
    book: { icon: "bi bi-book", classes: "extra-book-class" },
    folder: {
      icon: "bi bi-folder",
      classes: "extra-book-class",
      checkbox: "radio",
    },
  },
  // source: "generator/ajax_1k_3_54 t_c.json",
  // source: "generator/fixture_department_1k_3_6_flat_comp.json",
  // source: "generator/fixture_department_1k_3_6_comp.json",
  // source: "../docs/assets/ajax-tree-products.json",
  source: "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/fixture_store_104k_3_7_flat_comp.json",
  // source:
  //   "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/ajax_100k_3_1_6.json",
  // source: "generator/fixture.json",
  // source: (e)=>{
  //   console.info("SOURCE", e.type, e)
  //   return util.setTimeoutPromise(() => {
  //     return {url: "../docs/assets/ajax-tree-products.json"};
  //   }, 5000);
  // },
  // source: {
  //   children: [
  //     { title: "a", type: "book", details: "A book", children: [] },
  //     {
  //       title: "b",
  //       children: [
  //         {
  //           title: "ba",
  //         },
  //       ],
  //     },
  //     { title: "c", children: null },
  //     { title: "d", children: false },
  //     { title: "e" },
  //   ],
  // },

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
  lazyLoad: (e) => {
    // return {url: "../docs/assets/ajax-lazy-products.json"};
    return util.setTimeoutPromise(() => {
      return { url: "../docs/assets/ajax-lazy-products.json" };
    }, 1000);
  },
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

    node.log(e.type, e, value, node.data);

    // Simulate a async/delayed behavior:
    return util.setTimeoutPromise(() => {
      // Simulate a validation error
      if (value === "x") {
        throw new Error("No 'x' please");
      }
      // Read the value from the input control that triggered the change event:
      node.data[e.info.colId] = value;
    }, 500);
  },
  render: (e) => {
    // e.node.log(e.type, e, e.node.data);

    for (const col of Object.values(e.renderColInfosById)) {
      switch (col.id) {
        default:
          // Assumption: we named column.id === node.data.NAME
          util.setValueToElem(col.elem, e.node.data[col.id]);
          break;
      }
    }
  },
  iconBadge: (e) => {
    const count = e.node.children?.length || 0;
    const subMatch = e.node.subMatch || 0;
    if (subMatch > 0) {
      return { badge: subMatch, badgeTooltip: `${subMatch} matches` };
    } else if (count > 0 && !e.node.expanded) {
      if (count > 99) {
        return { badge: "99+", badgeTooltip: `${count} children` };
      }

      // return { badge: count };
      // return { badge: count, classes: "badge-primary" };
      // return "" + count;
      return count;
      // return `<span class="badge badge-pill badge-primary">${count}</span>`;
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

// document.body.style.setProperty("--wb-node-text-color", "#ff8080");
document
  .querySelector("div.wunderbaum")
  .style.setProperty("--wb-font-stack", "monospace");
// document.querySelector("div.wunderbaum").style.setProperty("--wb-font-stack", "monospace");

document.querySelectorAll(".demo-btn").forEach((elem) => {
  elem.addEventListener("click", (e) => {
    const action = e.target.dataset.action;

    switch (action) {
      case "collapseAll":
        tree.logTime("iter");
        let count = 0;
        // for (const node of tree) {
        //   count++;
        // }
        tree.visit((node) => {
          count++;
        });

        tree.logTimeEnd("iter");
        tree.log(`count: ${count}`);
        tree.expandAll(false, {
          // force: true,
          depth: 2,
        });
        break;
      case "expandAll":
        tree.expandAll(true, {
          loadLazy: true,
          depth: 5,
        });
        break;
      case "test1":
        // console.info(tree.getActiveNode()._format_line(tree.root));
        // console.info((tree.getActiveNode() || tree.root).format((n)=>n.title));
        // tree.sortChildren(null, true)
        tree.getActiveNode().setIcon("bi bi-diagram-3");
        // tree.columns.push(
        //   { title: "Mode", id: "mode_" + sequence++, width: "100px" }
        // )
        // tree.update("colStructure")
        break;
    }
  });
});
