/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */
/* global mar10, addCssImport */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-info").innerHTML = `
Hierarchical selection demo (<code>selectMode: 'hier'</code>) .
Uses icons from <a href="https://fontawesome.com/">Font Awesome</a>.<br>
Collapse nodes to test select counter badges.
`;

// document.getElementById("selectMode").classList.remove("hidden");

addCssImport(
  "fontawesome6",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
);

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  header: "Select Tree",
  // selectMode: "single",
  iconMap: "fontawesome6",
  selectMode: "hier",
  checkbox: true,
  // minExpandLevel: 1,
  types: {},

  source: [
    {
      title: "n1",
      expanded: true,
      children: [
        { title: "n1.1" },
        { title: "n1.2" },
        { title: "n1.3", lazy: true },
      ],
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

  init: (e) => {
    // Tree was loaded and rendered. Now set focus:
    e.tree.setFocus();
  },
  lazyLoad: function (e) {
    return e.util.setTimeoutPromise(() => {
      return { url: "../assets/json/ajax-lazy-products.json" };
    }, 4000);
  },
  iconBadge: (e) => {
    const node = e.node;
    if (node.expanded || !node.children) {
      return;
    }
    const count = node.children && node.getSelectedNodes()?.length;
    return {
      badge: count,
      badgeTooltip: `${count} selected`,
      badgeClass: "selection-count",
    };
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
