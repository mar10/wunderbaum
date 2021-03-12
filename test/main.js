document.addEventListener("DOMContentLoaded", function (event) {
  let tree = new mar10.Wunderbaum({
    element: document.querySelector("#demo-tree"),
    source:
      "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json",
    debugLevel: 5,
    columns: [],

    change: function () {
      console.log("change", arguments);
    },
  });
});
