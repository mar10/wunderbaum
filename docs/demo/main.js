document.addEventListener("DOMContentLoaded", function (event) {
  let tree = new mar10.Wunderbaum({
    // element: document.querySelector("#demo-tree"),
    element: document.querySelector(".wunderbaum"),
    source:
      "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json",
    debugLevel: 5,
    types: {},
    columns: [
      { id: "*", title: "Name", width: "300px" },
      { id: "id1", title: "a", width: 2 },
      { id: "id2", title: "b" },
    ],

    change: function (data) {
      console.log("change", arguments);
    },
    render: function (data) {
      console.log("render", this, arguments);
      document.querySelector("#tree-info").textContent = "todo";
    },
    update: function (data) {
      console.log("update", arguments);
      showStatus(this);
    },
  });
});

document.querySelector("a#expand-all").addEventListener("click", (event) => {
  let tree = mar10.Wunderbaum.getTree();
  console.time("expandAll");
  tree.expandAll();
  console.timeEnd("expandAll");
  // tree.expandAll().done(()=>{
  //   console.timeEnd("expandAll")
  // })
});

document.querySelector("a#collapse-all").addEventListener("click", (event) => {
  let tree = mar10.Wunderbaum.getTree();
  console.time("collapseAll");
  tree.expandAll(false);
  console.timeEnd("collapseAll");
});

function showStatus(tree, options) {
  const info = document.querySelector("#tree-info");
  const elemCount = document.querySelector(".wb-node-list").childElementCount;
  const msg = `Nodes: ${tree.count().toLocaleString()}, rows: ${tree.count(true).toLocaleString()}, rendered: ${elemCount}`
    + `, `;
  // console.info(
  //   info,
  //   msg,
  // );
  info.textContent = msg;
  tree._check()
}
