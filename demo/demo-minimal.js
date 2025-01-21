/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */
/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-info").innerHTML = `
A simple tree, no frills (filter will not work).
Source node list is inlined, instead of using Ajax.
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  source: [
    {
      title: "Node 1",
      expanded: true,
      children: [{ title: "Node 1.1" }, { title: "Node 1.2" }],
    },
    { title: "Node 2" },
  ],
  activate: (e) => {
    alert(`Thank you for activating ${e.node}.`); // eslint-disable-line no-alert
  },
});
