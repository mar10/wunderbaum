/*
 * Note: import as module:
 *     `<script defer type="module" src="playground.js"></script>`
 */

import { Wunderbaum } from "../dist/wunderbaum.esm.js"


const tree = new Wunderbaum({
  element: "#tree",
  // columns: [{title: "test"}],
  name: "Playground",
  // showSpinner: true,
  source: {
    children: [{title: "Node 1"}]
  }
})

console.log(`Created  ${tree}`)
