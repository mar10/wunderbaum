/*
 * Note: import as module:
 *     `<script defer type="module" src="playground.js"></script>`
 */

import { Wunderbaum } from "../build/wunderbaum.esm.js";

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

const ModeElemTemplate = `<select  tabindex='-1'>
  <option value='1'>O1</option>
  <option value='2'>O2</option>
</select>`;
// const CommentElemTemplate = `<input type=text>`;

const tree = new Wunderbaum({
  element: "#tree",
  // checkbox: false,
  id: "Playground",
  // header: "Playground",
  columns: [
    { title: "test", id: "*" },
    {
      title: "Fav",
      id: "favorite",
      width: "30px",
      classes: "wb-helper-center",
      html: "<input type=checkbox tabindex='-1'>",
    },
    { title: "tag", id: "tag", width: "100px", html: "<input type=text tabindex='-1'>"},
    { title: "Mode", id: "mode", width: "100px" },
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
  // edit: {
  //   validate: (e) => {
  //     e.node.log(`${e.type}`);
  //   },
  // },
  activate: (e) => {
    tree.log(
      e.name,
      e,
      e.node.toDict(false, (d) => {
        d._org_key = d.key;
        delete d.key;
      })
    );
  },
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
    // let value = Wunderbaum.util.getValueFromElem(e.info.colElem);
    let value = e.inputValue;
    // e.inputElem.checked = false
    e.node.log(e.name, e, value);

    // TODO: We could validate `inputValue` and call on error:
    // Wunderbaum.util.setValueToElem( e.inputElem, prevValue);

    return setTimeoutPromise(() => {
      // Read the value from the input control that triggered the change event:
      //
      e.node.data[e.info.colId] = value;
      // tree.log(e.name, e);
    }, 1500);
  },
  render: (e) => {
    e.node.log(e.name, e);
    //
    if (e.isNew) {
      // e.colInfosById["favorite"].elem.appendChild(
      //   elementFromHtml(`<input type=checkbox>`)
      // );
      e.colInfosById["mode"].elem.appendChild(
        elementFromHtml(ModeElemTemplate)
      );
    }
    // Wunderbaum.util.setValueToElem(
    //   e.colInfosById.favorite.elem,
    //   true //e.node.data.favorite
    // );
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
