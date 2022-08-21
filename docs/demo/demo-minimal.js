/**
 * Demo code for wunderbaum.ts
 *
 * Copyright (c) 2021-2022, Martin Wendt (https://wwWendt.de).
 * https://github.com/mar10/wunderbaum
 */

document.getElementById("demo-info").innerHTML = `
A simple tree, static node list, no frills (filter will not work).
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.querySelector("#demo-tree"),
  source: [
    {
      title: "Node 1", expanded: true, children: [
        { title: "Node 1.1" },
        { title: "Node 1.2" },
      ]
    },
    { title: "Node 2" },
  ],
  activate: (e) => {
    alert(`Thank you for clicking ${e.node}.`)
  },
});
