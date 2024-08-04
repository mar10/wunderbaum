/**
 * Demo code for Wunderbaum (https://github.com/mar10/wunderbaum).
 *
 * Copyright (c) 2021-2024, Martin Wendt (https://wwWendt.de).
 */

/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

document.getElementById("demo-info").innerHTML = `
Convert and consume data from a custom endpoint 
(<a href="https://fakestoreapi.com/" target="_blank">Fake Store API</a>).
`;

new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  source: { url: "https://fakestoreapi.com/products/categories" },
  columns: [
    { id: "*", title: "Product", width: "250px" },
    {
      id: "price",
      title: "Price ($)",
      width: "80px",
      classes: "wb-helper-end",
    },
    { id: "description", title: "Details", width: "*" },
  ],
  columnsResizable: true,
  types: {
    category: { colspan: true },
    electronics: { icon: "bi bi-cpu" },
    jewelery: { icon: "bi bi-gem" },
    "men's clothing": { icon: "bi bi-gender-male" },
    "women's clothing": { icon: "bi bi-gender-female" },
  },
  receive: (e) => {
    const parent = e.node;
    const parentType = parent.isRootNode() ? "root" : parent.type;

    switch (parentType) {
      case "root":
        // Initial request: we received the list of category names
        return e.response.map((elem) => {
          return {
            title: elem,
            type: "category",
            refKey: elem,
            lazy: true,
          };
        });
      case "category":
        // Lazy-load a category node:
        return e.response.map((elem) => {
          return {
            title: elem.title,
            type: parent.refKey,
            price: elem.price,
            description: elem.description,
          };
        });
    }
  },
  lazyLoad: (e) => {
    return {
      url: `https://fakestoreapi.com/products/category/${e.node.refKey}`,
    };
  },
  render: function (e) {
    const node = e.node;

    for (const col of Object.values(e.renderColInfosById)) {
      switch (col.id) {
        default:
          // Assumption: we named column.id === node.data.NAME
          col.elem.textContent = node.data[col.id];
          break;
      }
    }
  },
});
