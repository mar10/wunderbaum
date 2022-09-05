/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2022, Martin Wendt (https://wwWendt.de).
 */

document.getElementById("demo-info").innerHTML = `
A simple tree, no frills (filter will not work).
Node list is inlined, instead of using ajax.
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
    alert(`Thank you for activating ${e.node}.`)
  },
});
