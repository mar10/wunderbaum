/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */
/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-info").innerHTML = `
A simple tree with filter, rename, drag'n'drop, lazy-loading. Auto-focus on init.<br>
100k nodes: click <i class="bi bi-plus-slash-minus"></i> to expand them all.
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  // header: "Plain Tree",
  source:
    // "../../test/fixtures/tree_fmea_XL_t_flat_comp.json",
    "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/tree_fmea_XL_t_flat_comp.json",
  debugLevel: 5,
  connectTopBreadcrumb: document.getElementById("parentPath"),
  checkbox: true,
  // minExpandLevel: 1,
  types: {},
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
      console.log(
        `Drop ${e.sourceNode} => ${e.suggestedDropEffect} ${e.suggestedDropMode} ${e.node}`,
        e
      );
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
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          e.inputElem.setCustomValidity("");
          if (e.newValue.match(/.*\d.*/)) {
            e.inputElem.setCustomValidity("No numbers please.");
            reject();
          } else {
            resolve();
          }
        }, 500);
      });
      // return new e.util.setTimeoutPromise(() => {
      //   e.inputElem.setCustomValidity("");
      //   if (e.newValue.match(/.*\d.*/)) {
      //     e.inputElem.setCustomValidity("No numbers please.");
      //     return false;
      //   }
      // }, 500);
    },
  },
  filter: {
    connectInput: "input#filterQuery",
    mode: "hide",
  },
  iconBadge: (e) => {
    const node = e.node;
    if (node.children?.length > 0 && !node.expanded && node.subMatchCount > 0) {
      return {
        badge: node.subMatchCount,
        badgeTooltip: `${node.subMatchCount} matches`,
        badgeClass: "match-count",
      };
    }
  },
  init: (e) => {
    // Tree was loaded and rendered. Now set focus:
    const node = e.tree.findFirst("Jumping dopily");
    node.setActive();
    e.tree.setFocus();
  },
  lazyLoad: function (e) {
    // User expanded a lazy node for the first time.
    console.log(e.type, e);
    // A typical handler would return a URL that should be fetched:
    // return { url: "../assets/json/ajax-lazy-products.json" };
    // ... Simulate a long-running request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject("Epic fail");
        // resolve({ url: "../assets/json/ajax-lazy-products.json" });
      }, 1500);
    });
  },
});
