/**
 * Demo code for wunderbaum.ts
 *
 * Copyright (c) 2021-2022, Martin Wendt (https://wwWendt.de).
 * https://github.com/mar10/wunderbaum
 */

document.getElementById("demo-info").innerHTML = `
A simple tree with filter, rename, drag'n'drop, lazy-loading.<br>
100k nodes: click <i class="bi bi-plus-slash-minus"></i> to expand them all.
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.querySelector("#demo-tree"),
  source:
    "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json",
  // source: "../assets/ajax-tree-products.json",
  debugLevel: 5,
  attachBreadcrumb: document.getElementById("parentPath"),
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
      console.log("Drop " + e.sourceNode + " => " + e.region + " " + e.node);
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
    attachInput: "input#filterQuery",
    mode: "hide",
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
  render: function (e) {
    // console.log(e.type, e.isNew, e);
  },
  update: function (e) {
    // Only used for the demo app (display some stats in the bottom pane):
    showStatus(this);
  },
});
