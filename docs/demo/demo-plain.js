/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2022, Martin Wendt (https://wwWendt.de).
 */

document.getElementById("demo-info").innerHTML = `
A simple tree with filter, rename, drag'n'drop, lazy-loading. Auto-focus on init.<br>
100k nodes: click <i class="bi bi-plus-slash-minus"></i> to expand them all.
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.querySelector("#demo-tree"),
  // header: "Plain Tree",
  source:
    "https://cdn.jsdelivr.net/gh/mar10/assets@master/wunderbaum/ajax_99k_3_1.json",
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
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          e.inputElem.setCustomValidity("");
          if (e.newValue.match(/.*\d.*/)) {
            e.inputElem.setCustomValidity("No numbers please.");
            reject();
          }else{
            resolve()
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
  init: (e) => {
    // Tree was loaded and rendered. Now set focus:
    const node = e.tree.findFirst("Jumping dopily")
    node.setActive()
    e.tree.setFocus();
  },
  lazyLoad: function (e) {
    // User expanded a lazy node for the first time.
    console.log(e.type, e);
    // A typical handler would return a URL that should be fetched:
    // return { url: "../assets/ajax-lazy-sample.json" };
    // ... Simulate a long-running request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject("Epic fail")
        // resolve({ url: "../assets/ajax-lazy-sample.json" });
      }, 1500);
    });
  },
  update: function (e) {
    // Only used for the demo app (display some stats in the bottom pane):
    showStatus(this);
  },
});
