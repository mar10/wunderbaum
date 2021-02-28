document.addEventListener("DOMContentLoaded", function(event) {
  let tree = new mar10.Wunderbaum({
    element: document.querySelector("#tree"),
      source: "https://cdn.jsdelivr.net/gh/mar10/assets@master/fancytree/ajax_101k.json",
      change: function() {
        console.log("persisto.change", arguments)
      }
    });
});
