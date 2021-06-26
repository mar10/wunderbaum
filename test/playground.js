/*
 * Note: import as module:
 *     `<script defer type="module" src="playground.js"></script>`
 */

import { Wunderbaum } from "../dist/wunderbaum.esm.js";

function elementFromHtml(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

const tree = new Wunderbaum({
  element: "#tree",
  id: "Playground",
  // header: "Playground",
  columns: [
    { title: "test", id: "*" },
    { title: "Fav", id: "favorite", width: "30px" },
  ],
  types: {
    book: { icon: "bi bi-book", classes: "extra-book-class" },
  },
  // showSpinner: true,
  // source: "https://hurz",
  source: {
    children: [
      { title: "Node 1", expanded: true, children: [{ title: "Node 1.1" }] },
      {
        title: "Node 2",
        selected: true,
        icon: "../docs/assets/favicon/favicon-16x16.png",
        children: [
          { title: "book2", type: "book" },
          { title: "book2", type: "book" },
        ],
      },
      { title: "Node 3", type: "book" },
    ],
  },
  activate: (e) => {},
  click: (e) => {},
  deactivate: (e) => {},
  discard: (e) => {},
  renderColumns: (e) => {
    this.log(e.name, e)
    e.colElems[1].appendChild(elementFromHtml(`<input type=checkbox>`));
  },
});

console.log(`Created  ${tree}`);

tree.ready
  .then(() => {
    console.log(`${tree} is ready.`);
    // tree.root.setStatus("loading")
  })
  .catch((err) => {
    console.error(`${tree} init failed.`, err);
  });
