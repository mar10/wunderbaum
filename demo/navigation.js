/* global mar10 */
/* eslint-env browser */
/* eslint-disable no-console */

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
        href: is_local
          ? "../../test/unit/test-dev.html"
          : "../unittest/test-dist.html",
      },
      {
        title: "Demo",
        type: "folder",
        expanded: true,
        children: [
          {
            title: "Welcome",
            type: "show",
            key: "demo-welcome",
            icon: "bi bi-info-square",
          },
          { title: "Minimal", type: "show", key: "demo-minimal" },
          { title: "Plain", type: "show", key: "demo-plain" },
          { title: "Select", type: "show", key: "demo-select" },
          { title: "Treegrid", type: "show", key: "demo-grid" },
          { title: "Large Grid", type: "show", key: "demo-large" },
          { title: "Readonly", type: "show", key: "demo-readonly" },
          { title: "Editable", type: "show", key: "demo-editable" },
          { title: "Fixed Column", type: "show", key: "demo-fixedcol" },
          { title: "Custom Data", type: "show", key: "demo-custom" },
        ],
      },
    ],
    init: (e) => {
      // We do not get a 'hashchange' event on page load, so we call directly:
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
          // Trigger a 'hashchange' event:
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

  document.querySelectorAll("output.tree-version").forEach((elem) => {
    elem.textContent = mar10.Wunderbaum.version;
  });

  /**
   * Handle checkboxes that set global modifier classes, e.g. `wb-rainbow`, ...
   */
  util.onEvent(document, "change", "input.auto-class-setter", (e) => {
    document
      .getElementById("demo-tree")
      .classList.toggle(e.target.dataset.classname, e.target.checked);
  });

  toggleButtonCreate("#filter-hide", (e, flag) => {
    const tree = mar10.Wunderbaum.getTree("demo");
    tree.setOption("filter.mode", flag ? "hide" : "dim");
  });
  toggleButtonCreate("#show-checkboxes", (e, flag) => {
    const tree = mar10.Wunderbaum.getTree("demo");
    tree.setOption("checkbox", !!flag);
  });
  toggleButtonCreate("#disable-tree", (e, flag) => {
    const tree = mar10.Wunderbaum.getTree("demo");
    tree.setOption("enabled", !flag);
  });
  toggleButtonCreate("#enable-cellnav", (e, flag) => {
    const tree = mar10.Wunderbaum.getTree("demo");
    if (tree.isRowNav() && tree.isGrid()) {
      tree.setCellNav();
    } else {
      tree.setCellNav(false);
    }
    return tree.isCellNav();
  });
  document
    .querySelector("#toggle-expand-all")
    .addEventListener("click", (e) => {
      const tree = mar10.Wunderbaum.getTree("demo");
      tree.expandAll(!tree.getFirstChild().isExpanded());
    });
  document
    .querySelector("#toggle-select-all")
    .addEventListener("click", (e) => {
      const tree = mar10.Wunderbaum.getTree("demo");
      const label = tree.logTime(`selectAll()`);
      tree.toggleSelect();
      // tree.selectAll(!tree.getFirstChild().isSelected());
      tree.logTimeEnd(label);
    });
  /* Update info pane every second. This is fast and we handle exceptions, so
     'evil' setInterval() should be Ok here. */
  const STATUS_UPDATE_INTERVAL = 1_000;
  setInterval(() => {
    try {
      const demoTree = mar10.Wunderbaum.getTree("demo");
      showStatus(demoTree);
    } catch (error) {
      console.error("showStatus() failed", error);
    }
  }, STATUS_UPDATE_INTERVAL);
});

/** */
function addCssImport(tag, url) {
  let linkElem = document.querySelector(`link[data-tag="${tag}"]`);
  if (!linkElem) {
    linkElem = document.createElement("link");
    linkElem.setAttribute("rel", "stylesheet");
    linkElem.setAttribute("href", url);
    linkElem.setAttribute("data-tag", tag);
    document.head.appendChild(linkElem);
  }
  return linkElem;
}

/**
 * Toggle button
 */
function toggleButtonCreate(selector, onChange) {
  const buttonElem = document.querySelector(selector);
  buttonElem.classList.add("toggle-button");
  buttonElem.addEventListener("click", (e) => {
    buttonElem.classList.toggle("checked");
    const res = onChange(e, buttonElem.classList.contains("checked"));
    if (typeof res === "boolean") {
      buttonElem.classList.toggle("checked", res);
    }
  });
}

/**
 *
 */
function loadScript(
  url,
  async = true,
  module = true,
  type = "text/javascript",
  destroyExisting = true
) {
  return new Promise((resolve, reject) => {
    console.log(`Loading script ${url}...`);
    // Update address of 'View Source Code' link:
    const sourceLink = document.getElementById("sourceLink");
    sourceLink.setAttribute("href", url);
    // Remove previously loaded demo scripts and event listeners:
    if (destroyExisting) {
      document.querySelectorAll("script.demo-case-handler").forEach((elem) => {
        console.log("Remove old script:", elem);
        elem.remove();
      });
    }
    // const scriptElem = document.querySelector("#demo-tree-script");
    const scriptElem = document.createElement("script");
    if (module) {
      scriptElem.setAttribute("type", "module");
    }
    scriptElem.setAttribute("type", type);
    scriptElem.setAttribute("async", async);
    scriptElem.classList.add("demo-case-handler");
    document.body.appendChild(scriptElem);

    scriptElem.setAttribute("src", url);

    scriptElem.addEventListener("load", (e) => {
      console.log(`Loading script ${url} done.`);
      resolve(e);
    });
    scriptElem.addEventListener("error", (e) => {
      console.error("Loading script %s... ERROR:", url, e);
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

  console.info("reconfigureTree(%s), tree=%s", tag, demoTree, demoTree);

  if (tag == null) {
    tag = window.location.hash;
  }
  tag = tag.replace(/^#/, "");
  tag = tag || "demo-welcome";
  const isWelcome = tag === "demo-welcome";
  const label = `reconfigureTree(${tag})`;
  console.time(label);

  window.location.hash = tag;

  detailsElem.classList.remove("error");
  detailsElem.textContent = `Loading demo '${tag}'...`;
  // Elements that are hidden from the initial welcome page:
  document.querySelectorAll(".hide-on-welcome").forEach((elem) => {
    elem.classList.toggle("hidden", isWelcome);
  });
  // Elements that are hidden on every page change (need to explicitly show by demo code):
  document.querySelectorAll(".hide-on-init").forEach((elem) => {
    elem.classList.add("hidden");
  });
  document.querySelectorAll(".clear-on-init").forEach((elem) => {
    elem.innerHTML = "";
  });

  demoTree?.destroy();

  demoTree?.element.classList.add("wb-initializing");

  const url = `./${tag}.js`;
  navTree.setActiveNode(tag);

  loadScript(url)
    .then(() => {
      demoTree = mar10.Wunderbaum.getTree("demo");
      console.debug("Script %s was run. tree:", url, demoTree);
      if (!demoTree) {
        detailsElem.innerHTML = "&nbsp;";
        console.timeEnd(label);
        return;
      }

      // Update GUI controls from current tree settings.
      demoTree.ready.then(() => {
        console.timeEnd(label);
        // console.info("Reloaded tree is initialized!")
        document
          .getElementById("show-checkboxes")
          .classList.toggle("checked", !!demoTree.getOption("checkbox"));
        document
          .getElementById("filter-hide")
          .classList.toggle(
            "checked",
            demoTree.getOption("filter.mode") === "hide"
          );
        document
          .getElementById("enable-cellnav")
          .classList.toggle(
            "checked",
            demoTree.isGrid() && demoTree.isRowNav()
          );
      });
    })
    .catch((e) => {
      detailsElem.classList.add("error");
      detailsElem.innerHTML = `${e}`;
    });
}

/**
 *
 * @param {*} tree
 * @param {*} options
 */
function showStatus(tree) {
  // const tree = mar10.Wunderbaum.getTree("demo");
  const info = document.querySelector("#tree-info");
  const nodeListElem = document.querySelector("#demo-tree .wb-node-list");
  if (!tree || !nodeListElem) {
    info.textContent = "n.a.";
    return;
  }
  const elemCount = nodeListElem.childElementCount;
  const activeNode = tree.getActiveNode();
  const focusNode = tree.getFocusNode();
  const focusNodeInfo =
    activeNode && focusNode === activeNode
      ? " (has focus)"
      : ", Focus: " + focusNode;
  const msg = `Nodes: ${tree.count().toLocaleString()}, rows: ${tree
    .count(true)
    .toLocaleString()}, rendered: ${elemCount}.
      Active: ${activeNode}${focusNodeInfo}
      `;

  info.textContent = msg;
  tree._check();
}
