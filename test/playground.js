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
  dnd: {
    dragStart: (e) => {
      return true;
    },
    dragEnter: (e) => {
      return true;
    },
  },
  activate: (e) => {},
  click: (e) => {
    tree.log(
      e.name,
      e,
      e.node.toDict(false, (d) => {
        d._org_key = d.key;
        delete d.key;
      })
    );
  },
  deactivate: (e) => {},
  discard: (e) => {},
  change: (e) => {
    tree.log(e.name, e);
  },
  renderColumns: (e) => {
    tree.log(e.name, e);
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

async function test() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.info("in test()");
      // throw new Error("fail");
      reject("fail");
      // resolve("res");
    }, 1000);
  });
}

console.info("before test()");
test()
  .then((res) => {
    console.info("after test(): " + res);
  })
  .catch((err) => {
    console.error("after test(): " + err);
  });

  console.info(5, 5%2, 6%2)
