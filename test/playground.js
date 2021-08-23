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

function setTimeoutPromise(callback, ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(callback.apply(self));
      } catch (err) {
        reject(err);
      }
    }, ms);
  });
}

const ModeElemTemplate = `<select>
  <option value='1'>O1</option>
  <option value='2'>O2</option>
</select>`;

const tree = new Wunderbaum({
  element: "#tree",
  id: "Playground",
  // header: "Playground",
  columns: [
    { title: "test", id: "*" },
    { title: "Fav", id: "favorite", width: "30px" },
    { title: "Mode", id: "mode", width: "150px" },
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
    // Simulate delayed behavior
    return setTimeoutPromise(() => {
      tree.log(e.name, e);
    }, 1500);
  },
  renderNode: (e) => {
    e.node.log(e.name, e);
    //
    if (e.isNew) {
      e.colElems[1].appendChild(elementFromHtml(`<input type=checkbox>`));
      e.colElems[2].appendChild(elementFromHtml(ModeElemTemplate));
    }
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
