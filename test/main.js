document.addEventListener("DOMContentLoaded", function (event) {
  let tree = new mar10.Wunderbaum({
    element: document.querySelector("#demo-tree"),
    source:
      "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json",
    debugLevel: 5,
    types: {},
    columns: [
      { id: "id1", header: "a" },
      { id: "id2", header: "b" },
    ],

    change: function () {
      console.log("change", arguments);
    },
    render: function () {
      console.log("render", this, arguments);
    },
  });
});
