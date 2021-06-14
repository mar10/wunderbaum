/*
 * Note: import as module:
 *     `<script defer type="module" src="playground.js"></script>`
 */

import { Wunderbaum } from "../dist/wunderbaum.esm.js";

const tree = new Wunderbaum({
  element: "#tree",
  // columns: [{title: "test"}],
  name: "Playground",
  // showSpinner: true,
  source: {
    children: [
      { title: "Node 1", children: [{ title: "Node 1.1" }] },
      { title: "Node 2" },
    ],
  },
});

console.log(`Created  ${tree}`);

tree.ready.then(() => {
  console.log(`${tree} is ready.`);
}).catch((err)=>{
  console.error(`${tree} init failed.`, err);
});
