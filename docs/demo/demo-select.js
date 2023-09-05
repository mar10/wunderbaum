/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2023, Martin Wendt (https://wwWendt.de).
 */

document.getElementById("demo-info").innerHTML = `
Hierarchical selection demo (<code>selectMode: 'hier'</code>).<br>
100k nodes: click <i class="bi bi-plus-slash-minus"></i> to expand them all.
`;

// document.getElementById("selectMode").classList.remove("hidden");

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  header: "Select Tree",
  // selectMode: "single",
  selectMode: "hier",
  source: [
    {
      title: "n1",
      expanded: true,
      children: [{ title: "n1.1" }, { title: "n1.2" }, { title: "n1.3" }],
    },
    {
      title: "n2",
      expanded: true,
      children: [
        { title: "n2.1 (selected)", selected: true },
        { title: "n2.2", selected: false },
        { title: "n2.3", selected: null },
      ],
    },
    {
      title: "n3",
      expanded: true,
      children: [
        {
          title: "n3.1",
          expanded: true,
          children: [
            { title: "n3.1.1 (unselectable)", unselectable: true },
            { title: "n3.1.2 (unselectable)", unselectable: true },
            { title: "n3.1.3" },
          ],
        },
        {
          title: "n3.3",
          expanded: true,
          children: [
            { title: "n3.2.1 (unselectable)", unselectable: true },
            {
              title: "n3.2.2 (unselectable, selected)",
              unselectable: true,
              selected: true,
            },
            { title: "n3.2.3" },
            { title: "n3.2.4 (selected)", selected: true },
          ],
        },
        {
          title: "n3.4 (radiogroup)",
          expanded: true,
          radiogroup: true,
          checkbox: false,
          children: [
            {
              title: "n3.4.1 (unselectable: true)",
              unselectable: true,
            },
            {
              title: "n3.4.2 (selected)",
              selected: true,
            },
            { title: "n3.4.3" },
          ],
        },
      ],
    },
  ],
  debugLevel: 5,
  connectTopBreadcrumb: document.getElementById("parentPath"),
  checkbox: true,
  // minExpandLevel: 1,
  types: {},
  // dnd: {
  //   dragStart: (e) => {
  //     if (e.node.type === "folder") {
  //       return false;
  //     }
  //     e.event.dataTransfer.effectAllowed = "all";
  //     return true;
  //   },
  //   dragEnter: (e) => {
  //     if (e.node.type === "folder") {
  //       e.event.dataTransfer.dropEffect = "copy";
  //       return "over";
  //     }
  //     return ["before", "after"];
  //   },
  //   drop: (e) => {
  //     console.log("Drop " + e.sourceNode + " => " + e.region + " " + e.node, e);
  //     e.sourceNode.moveTo(e.node, e.defaultDropMode)
  //   },
  // },
  init: (e) => {
    // Tree was loaded and rendered. Now set focus:
    e.tree.setFocus();
  },
  lazyLoad: function (e) {
    return { url: "../assets/ajax-lazy-products.json" };
  },
  beforeSelect: function (e) {
    console.log(e.type, e);
  },
  select: function (e) {
    console.log(e.type, e, e.tree.getSelectedNodes());
    document.getElementById(
      "tree-info-custom"
    ).textContent = `Selected: ${e.tree.getSelectedNodes(true)}`;
  },
});
