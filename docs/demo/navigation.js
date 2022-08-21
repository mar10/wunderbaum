document.addEventListener("DOMContentLoaded", (event) => {
  /* ---------------------------------------------------------------------------
   * Navigation
   */
  const is_local = !!window.location.hostname.match(/127.0.0.1/);
  const util = mar10.Wunderbaum.util;

  const navTree = new mar10.Wunderbaum({
    id: "navigation",
    header: "Wunderbaum",
    element: document.querySelector("#nav-tree"),
    // checkbox: false,
    minExpandLevel: 2,
    debugLevel: 2,
    types: {
      link: { icon: "bi bi-link-45deg", classes: "wb-helper-link" },
      show: { icon: "bi bi-file-code" },
    },
    source: [
      {
        title: "GitHub Project",
        type: "link",
        icon: "bi bi-github",
        href: "https://github.com/mar10/wunderbaum",
      },
      {
        title: "User Guide",
        type: "link",
        href: "../index.html",
      },
      {
        title: "API Reference",
        type: "link",
        href: "../api",
      },
      {
        title: "Unit Tests",
        type: "link",
        href: is_local ? "../../test/unit/test-dev.html" : "../unittest/test-dist.html",
      },
      {
        title: "Demo",
        type: "folder",
        expanded: true,
        children: [
          { title: "Welcome", type: "show", key: "demo-welcome", icon: "bi bi-info-square" },
          { title: "Minimal", type: "show", key: "demo-minimal" },
          { title: "Plain", type: "show", key: "demo-plain" },
          { title: "Treegrid", type: "show", key: "demo-grid" },
          { title: "Large Grid", type: "show", key: "demo-large", },
          { title: "Editable", type: "show", key: "demo-editable", },
          { title: "Fixed Column", type: "show", key: "demo-fixedcol", },
        ],
      },
    ],
    init: (e) => {
      reconfigureTree(window.location.hash || "demo-welcome");
    },
    keydown: (e) => {
      const node = e.tree.getActiveNode();

      if (e.eventName === "Enter" && node && node.type === "show") {
        window.location.hash = node.key;
      }
    },
    click: (e) => {
      switch (e.node.type) {
        case "link":
          window.open(e.node.data.href);
          break;
        case "show":
          window.location.hash = e.node.key;
          break;
      }
    },
  });

  /* ---------------------------------------------------------------------------
   * Demo Behavior
   */

  window.addEventListener("hashchange", (e) => {
    console.log(e.type, e);
    reconfigureTree(window.location.hash);
  });

  document.querySelectorAll("output.tree-version").forEach(elem => {
    elem.textContent = mar10.Wunderbaum.version;
  });

  /**
   * Handle checkboxes that set global modifier classes, e.g. `wb-rainbow`, ...
   */
  util.onEvent(document, "change", "input.auto-class-setter", (e) => {
    document.querySelector("#demo-tree").classList.toggle(e.target.dataset.classname, e.target.checked);
  })

  toggleButtonCreate("#filter-hide", (e, flag) => {
    const tree = mar10.Wunderbaum.getTree("demo");
    tree.setOption("filter.mode", flag ? "hide" : "dim");
  })
  toggleButtonCreate("#show-checkboxes", (e, flag) => {
    const tree = mar10.Wunderbaum.getTree("demo");
    tree.setOption("checkbox", !!flag);
  })
  toggleButtonCreate("#disable-tree", (e, flag) => {
    const tree = mar10.Wunderbaum.getTree("demo");
    tree.setOption("enabled", !flag);
  })
  document.querySelector("#toggle-expand-all").addEventListener("click", (e) => {
    const tree = mar10.Wunderbaum.getTree("demo");
    tree.expandAll(!tree.getFirstChild().isExpanded());
  });
  document.querySelector("#toggle-select-all").addEventListener("click", (e) => {
    const tree = mar10.Wunderbaum.getTree("demo");
    tree.selectAll(!tree.getFirstChild().isSelected());
  });
});

/**
 * 
 * @param {*} tree 
 * @param {*} options 
 */
function showStatus(tree, options) {
  const info = document.querySelector("#tree-info");
  const elemCount = document.querySelector("#demo-tree .wb-node-list")
    .childElementCount;
  const msg =
    `Nodes: ${tree.count().toLocaleString()}, rows: ${tree
      .count(true)
      .toLocaleString()}, rendered: ${elemCount}` + `.`;

  info.textContent = msg;
  tree._check();
}

/**
 * Toggle button
 */
function toggleButtonCreate(selector, onChange) {
  const buttonElem = document.querySelector(selector);
  buttonElem.classList.add("toggle-button")
  buttonElem.addEventListener("click", (e) => {
    buttonElem.classList.toggle("checked")
    onChange(e, buttonElem.classList.contains("checked"))
  })
}

/**
 * 
 */
function loadScript(url, async = true, module = true, type = "text/javascript", destroyExisting = true) {
  return new Promise((resolve, reject) => {
    const sourceLink = document.getElementById("sourceLink");

    console.log(`Loading script ${url}...`)
    sourceLink.setAttribute("href", url);

    if (destroyExisting) {
      document.querySelectorAll("script.demo-case-handler").forEach(elem => {
        console.log("Remove old script:", elem);
        elem.remove()
      });
    }
    // const scriptElem = document.querySelector("#demo-tree-script");
    let scriptElem = document.createElement("script");
    if (module) {
      scriptElem.setAttribute("type", "module")
    }
    scriptElem.setAttribute("type", type)
    scriptElem.setAttribute("async", async)
    scriptElem.classList.add("demo-case-handler")
    document.body.appendChild(scriptElem);

    scriptElem.setAttribute("src", url)

    scriptElem.addEventListener("load", (e) => {
      console.log(`Loading script ${url} done.`)
      resolve(e);
    });
    scriptElem.addEventListener("error", (e) => {
      console.error(`Loading script ${url}... ERROR.`, e)
      reject(e);
    });

  });
}

/**
 * 
 * @param {*} options 
 */
function reconfigureTree(tag = null) {
  const navTree = mar10.Wunderbaum.getTree("navigation");
  let demoTree = mar10.Wunderbaum.getTree("demo");
  const detailsElem = document.getElementById("demo-info");

  console.info(`reconfigureTree(${tag}), tree=${demoTree}`, demoTree);

  if (tag == null) {
    tag = window.location.hash;
  }
  tag = tag.replace(/^#/, "")
  tag = tag || "demo-welcome";
  const isWelcome = tag === "demo-welcome";

  window.location.hash = tag;

  detailsElem.classList.remove("error");
  detailsElem.innerHTML = `Loading demo '${tag}'&hellip;`;
  document.querySelectorAll(".hide-on-welcome").forEach(elem => {
    elem.classList.toggle("hidden", isWelcome)
  });

  demoTree?.destroy();

  const url = `./${tag}.js`;
  navTree.setActiveNode(tag)

  loadScript(url).then(() => {
    demoTree = mar10.Wunderbaum.getTree("demo");
    console.info(`Script ${url} was run. tree:`, demoTree, demoTree.options);

    // Update GUI controls from current tree settings.
    demoTree.ready.then(() => {
      console.info("Reloaded tree is initialized!")
      document.getElementById("show-checkboxes")
        .classList.toggle("checked", !!demoTree.getOption("checkbox"));
      document.getElementById("filter-hide")
        .classList.toggle("checked", demoTree.getOption("filter.mode") === "hide");
    })

  }).catch((e) => {
    detailsElem.classList.add("error");
    detailsElem.innerHTML = `${e}`;
  });
}
