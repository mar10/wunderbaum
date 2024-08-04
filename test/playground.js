/*
 * Note: This file must be import as module:
 *     `<script defer type="module" src="playground.js"></script>`
 */
/* eslint-env browser */
/* eslint-disable no-console */
import { Wunderbaum } from "../build/wunderbaum.esm.js";
// import { Wunderbaum } from "../build/wunderbaum.esm.min.js";

const util = Wunderbaum.util;
// const ModeElemTemplate = `<select tabindex='-1'>
//   <option value='1'>O1</option>
//   <option value='2'>O2</option>
// </select>`;
// let sequence = 1;
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
  // tooltip: (e) => {
  //   return `${e.node.title} (${e.node.children?.length || 0})`;
  // },
  // autoCollapse: true,
  header: true, //"Playground",
  // iconMap: "fontawesome6",
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
      html: "<input type=text tabindex='-1' autocomplete=off>",
      headerClasses: "wb-helper-center",
      sortable: true,
      filterable: true,
      menu: true,
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
      // icon: "bi bi-folder",
      // checkbox: "radio",
    },
  },
  // source: "generator/ajax_1k_3_54 t_c.json",
  // source: "generator/fixture_department_1k_3_6_flat_comp.json",
  // source: "generator/fixture_department_1k_3_6_comp.json",
  columnsResizable: true,

  // source: "../docs/assets/ajax-tree-products.json",
  // source:
  //   "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/fixture_store_104k_3_7_flat_comp.json",
  // source:
  //   "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/ajax_100k_3_1_6.json",
  // source: "generator/fixture.json",
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
    effectAllowed: "all",
    dropEffectDefault: "move",
    guessDropEffect: true,
    dragStart: (e) => {
      // if (e.node.type === "folder") {
      //   return false;
      // }
      return true;
    },
    dragEnter: (e) => {
      // console.log(`DragEnter ${e.event.dataTransfer.dropEffect} ${e.node}`, e);
      // We can only drop 'over' a folder, so the source node becomes a child.
      // We can drop 'before' or 'after' a non-folder, so the source node becomes a sibling.
      if (e.node.type === "folder") {
        // e.event.dataTransfer.dropEffect = "link";
        return "over";
      }
      return ["before", "after"];
    },
    drag: (e) => {
      // e.tree.log(e.type, e);
    },
    drop: (e) => {
      console.log(
        `Drop ${e.sourceNode} => ${e.suggestedDropEffect} ${e.suggestedDropMode} ${e.node}`,
        e
      );
      switch (e.suggestedDropEffect) {
        case "copy":
          e.node.addNode(
            { title: `Copy of ${e.sourceNodeData.title}` },
            e.suggestedDropMode
          );
          break;
        case "link":
          e.node.addNode(
            { title: `Link to ${e.sourceNodeData.title}` },
            e.suggestedDropMode
          );
          break;
        default:
          e.sourceNode.moveTo(e.node, e.suggestedDropMode);
      }
    },
  },
  edit: {
    trigger: ["F2", "macEnter"],
    minlength: 2,
    maxlength: 10,
    edit: (e) => {
      e.node.log(`${e.type}`);
    },
    apply: (e) => {
      e.node.log(`${e.type}`);
      if (e.newValue.indexOf("x") >= 0) {
        throw new util.ValidationError("No 'x' please");
      }
    },
  },
  filter: {
    // mode: "hide",
  },
  lazyLoad: (e) => {
    // return {url: "../docs/assets/ajax-lazy-products.json"};
    return util.setTimeoutPromise(() => {
      return { url: "../docs/assets/ajax-lazy-products.json" };
    }, 1000);
  },
  activate: (e) => {
    tree.log(e.type, e);
  },
  click: (e) => {
    tree.log(e.type, e);
  },
  buttonClick: (e) => {
    tree.log(e.type, e);

    if (e.command === "filter") {
      // ... <open a filter dialog or toggle the filter mode> ...

      // Update the button state
      e.info.colDef.filterActive = !e.info.colDef.filterActive;
      tree.update("colStructure");
    }
    if (e.command === "sort") {
      e.tree.sortByProperty({ colId: e.info.colId, updateColInfo: true });
    } else if (e.command === "menu") {
      // eslint-disable-next-line no-alert
      alert("Open menu...");
    }
  },
  deactivate: (e) => {},
  discard: (e) => {},
  change: (e) => {
    const node = e.node;
    const value = e.inputValue;

    node.log(e.type, e, value, node.data);

    // Simulate a validation error from the client:
    switch (e.info.colId) {
      case "age":
        if (e.inputValue > 20) {
          throw new util.ValidationError("Age must be <= 20");
        }
        break;
      case "date":
        if (e.inputElem.valueAsDate > new Date()) {
          // throw new util.ValidationError("Date must be in the past");
          e.inputElem.setCustomValidity("Date must be in the past");
        }
        break;
    }

    // Simulate a async/delayed behavior:
    return util.setTimeoutPromise(() => {
      node.log(
        `Change '${e.info.colId}': '${node.data[e.info.colId]}' -> '${value}'`
      );
      // Simulate a validation error from the server:
      if (("" + value).indexOf("x") >= 0) {
        throw new util.ValidationError("No 'x' please");
      }
      // Read the value from the input control that triggered the change event:
      node.data[e.info.colId] = value;
    }, 500);
  },
  render: (e) => {
    const node = e.node;
    // node.log(e.type, e, node, e.nodeElem.querySelector("span.wb-title"));

    // e.nodeElem.querySelector( "span.wb-title" ).innerHTML = `<u>${node.title}</u>`;
    for (const col of Object.values(e.renderColInfosById)) {
      switch (col.id) {
        default:
          // Assumption: we named column.id === node.data.NAME
          util.setValueToElem(col.elem, node.data[col.id]);
          break;
      }
    }
  },
  // iconBadge: (e) => {
  //   const count = e.node.children?.length || 0;
  //   const subMatch = e.node.subMatch || 0;
  //   if (subMatch > 0) {
  //     return { badge: subMatch, badgeTooltip: `${subMatch} matches` };
  //   } else if (count > 0 && !e.node.expanded) {
  //     if (count > 99) {
  //       return { badge: "99+", badgeTooltip: `${count} children` };
  //     }

  //     // return { badge: count };
  //     // return { badge: count, classes: "badge-primary" };
  //     // return "" + count;
  //     return count;
  //     // return `<span class="badge badge-pill badge-primary">${count}</span>`;
  //   }
  // },
  init: (e) => {
    // e.tree.findFirst("Anthony Ross")?.setActive(true, {
    //   colIdx: "*",
    //   edit: true,
    //   focusTree: true,
    // });
    // e.tree.findFirst("Observe")?.setTooltip("This is a tooltip");
    const res = e.tree.filterNodes(/^jo[eh]/i, {
      mode: "hide",
      hideExpanders: true,
      // matchBranch: true,
      // leavesOnly: true,
      // fuzzy: true,
      autoExpand: true,
    });
    e.tree.log("matches", e.tree.countMatches(), res);
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
// document.querySelector("div.wunderbaum").style.setProperty("--wb-font-stack", "monospace");

document.querySelectorAll(".demo-btn").forEach((elem) => {
  elem.addEventListener("click", (e) => {
    const action = e.target.dataset.action;

    switch (action) {
      case "collapseAll":
        {
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
        }
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
