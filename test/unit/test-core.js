/*!
 * Wunderbaum - Unit Test
 * Copyright (c) 2021-2025, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */
/* global mar10, QUnit */
/* eslint-disable no-console */

const { test } = QUnit;
const Wunderbaum = mar10.Wunderbaum;
const util = Wunderbaum.util;
const FIXTURE_1 = [
  {
    title: "Node 1",
    expanded: true,
    children: [{ title: "Node 1.1" }, { title: "Node 1.2" }],
  },
  { title: "Node 2", lazy: true },
];

/* Setup */
QUnit.testStart(function () {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

/* Tear Down */
QUnit.testDone(function () {});

QUnit.module("Utility tests", (hooks) => {
  test("Static utility functions", (assert) => {
    assert.expect(2);

    assert.equal(util.type([]), "array", "type([])");
    assert.equal(util.type({}), "object", "type({})");
  });
});

QUnit.module("Static tests", (hooks) => {
  test("Access static properties", (assert) => {
    assert.expect(4);

    assert.true(Wunderbaum.version != null, "Statics defined");

    assert.throws(
      function () {
        const _dummy = Wunderbaum();
      },
      /TypeError/,
      "Fail if 'new' keyword is missing"
    );
    assert.throws(
      function () {
        const _dummy = new Wunderbaum();
      },
      /Error: Invalid 'element' option: null/,
      "Fail if option is missing"
    );
    assert.throws(
      function () {
        const _dummy = new Wunderbaum({});
      },
      /Error: Invalid 'element' option: null/,
      "Fail if 'element' option is missing"
    );
  });
});

QUnit.module("Instance tests", (hooks) => {
  let tree = null;

  hooks.beforeEach(() => {});
  hooks.afterEach(() => {
    tree.destroy();
    tree = null;
  });

  test("Initial event sequence (fetch)", (assert) => {
    assert.expect(5);
    assert.timeout(1000); // Timeout after 1 second
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: "ajax-simple.json",
      // source: FIXTURE_1,
      receive: (e) => {
        assert.step("receive");
        assert.equal(
          e.response[0].title,
          "Node 1",
          "receive(e) passes e.response"
        );
      },
      load: (e) => {
        assert.step("load");
      },
      // render: (e) => {
      //   assert.step("render");
      // },
      init: (e) => {
        assert.step("init");
        assert.verifySteps(["receive", "load", "init"], "Event sequence");
        done();
      },
    });
  });

  test("Lazy load (fetch)", (assert) => {
    assert.expect(8);
    assert.timeout(1000); // Timeout after 1 second
    const done = assert.async();
    let initComplete = false;

    tree = new Wunderbaum({
      element: "#tree",
      source: "ajax-simple.json",
      lazyLoad: (e) => {
        if (initComplete) {
          assert.step("lazyLoad");
          assert.equal(
            e.node.title,
            "Node 2",
            "lazyLoad(e) passes parent node"
          );
          return { url: "ajax-simple-sub.json" };
        }
      },
      receive: (e) => {
        if (initComplete) {
          assert.step("receive");
          assert.equal(
            e.response[0].title,
            "SubNode 1",
            "receive(e) passes e.response"
          );
        }
      },
      load: (e) => {
        if (initComplete) {
          assert.step("load");
          assert.verifySteps(
            ["init", "lazyLoad", "receive", "load"],
            "Event sequence"
          );
          done();
        }
      },
      // render: (e) => {
      //   assert.step("render");
      // },
      init: (e) => {
        initComplete = true;
        assert.step("init");
        const lazyNode = tree.findFirst("Node 2");
        assert.equal(lazyNode.title, "Node 2", "Find node by name");

        // We need the markup, to issue a click event
        // tree.updateViewport(true);
        // assert.true(lazyNode.isRendered(), "Node is rendered");
        // lazyNode.colspan.click();
        lazyNode.setExpanded();
      },
    });
  });

  test("applyCommand", (assert) => {
    assert.expect(2);
    assert.timeout(1000); // Timeout after 1 second
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: FIXTURE_1,
      init: (e) => {
        const node1 = tree.findFirst("Node 1");
        const node2 = tree.findFirst("Node 2");
        assert.equal(node1.getPrevSibling(), null);

        node1.applyCommand("moveDown");
        assert.equal(node1.getPrevSibling(), node2);
        // Avoid errors reported by ResizeObserver
        done();
      },
    });
  });
  test("clones", (assert) => {
    assert.expect(11);
    assert.timeout(1000); // Timeout after 1 second
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: [
        { title: "Node 1", key: "1", refKey: "n1" },
        { title: "Node 2", key: "2", refKey: "nX" },
        { title: "Node 3", key: "3", refKey: "nX" },
      ],
      init: (e) => {
        const n1 = tree.findKey("1");
        const n2 = tree.findKey("2");
        const n3 = tree.findKey("3");

        // console.warn(`tree.findByRefKey('nX'): >${tree.findByRefKey("nX")}<`);

        assert.deepEqual(tree.findByRefKey("x"), []);
        assert.deepEqual(tree.findByRefKey("n1"), [n1]);
        assert.equal(tree.findByRefKey("nX").length, 2);

        assert.false(n1.isClone());
        assert.true(n2.isClone());
        assert.true(n3.isClone());

        assert.deepEqual(n1.getCloneList(), []);
        assert.deepEqual(n1.getCloneList(true), [n1]);
        assert.equal(n2.getCloneList().length, 1);
        assert.equal(n2.getCloneList(false).length, 1);
        assert.equal(n2.getCloneList(true).length, 2);

        done();
      },
    });
  });
});

QUnit.module("ARIA tree grid", (hooks) => {
  let tree = null;
  const treeElem = () => document.querySelector("#tree");
  const SOURCE = [
    {
      title: "Folder",
      key: "f",
      expanded: true,
      children: [
        { title: "Doc 1", key: "d1", size: 1 },
        { title: "Doc 2", key: "d2", size: 2 },
      ],
    },
    { title: "Lazy", key: "l", lazy: true },
  ];
  const COLUMNS = [
    { id: "*", title: "Name", width: "200px" },
    { id: "size", title: "Size", width: "50px", sortable: true },
  ];

  hooks.beforeEach(() => {
    treeElem().style.height = "300px";
  });
  hooks.afterEach(() => {
    tree.destroy();
    tree = null;
    treeElem().style.height = "";
  });

  test("Roles and row attributes (grid)", (assert) => {
    assert.expect(16);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: SOURCE,
      columns: COLUMNS,
      init: (e) => {
        tree.update("any", { immediate: true });
        const elem = tree.element;
        assert.equal(elem.getAttribute("role"), "treegrid");
        assert.equal(
          elem.getAttribute("aria-rowcount"),
          "5",
          "4 rows + header"
        );
        assert.false(elem.hasAttribute("aria-multiselectable"));

        const headers = elem.querySelectorAll(
          "div.wb-header [role=columnheader]"
        );
        assert.equal(headers.length, 2, "column headers");
        assert.equal(headers[1].getAttribute("aria-sort"), "none");

        const folder = tree.findKey("f")._rowElem;
        assert.equal(folder.getAttribute("role"), "row");
        assert.equal(folder.getAttribute("aria-rowindex"), "2");
        assert.equal(folder.getAttribute("aria-level"), "1");
        assert.equal(folder.getAttribute("aria-expanded"), "true");
        assert.equal(folder.getAttribute("aria-posinset"), "1");
        assert.equal(folder.getAttribute("aria-setsize"), "2");
        assert.false(folder.hasAttribute("aria-selected"), "no selection");

        const doc2 = tree.findKey("d2")._rowElem;
        assert.equal(doc2.getAttribute("aria-level"), "2");
        assert.false(doc2.hasAttribute("aria-expanded"), "leaf");
        assert.deepEqual(
          [...doc2.querySelectorAll("[role=gridcell]")].map((c) =>
            c.getAttribute("aria-colindex")
          ),
          ["1", "2"],
          "cells"
        );
        assert.equal(
          tree.findKey("l")._rowElem.getAttribute("aria-expanded"),
          "false",
          "lazy node is expandable"
        );
        done();
      },
    });
  });

  test("Header row from columns in the source", (assert) => {
    assert.expect(2);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: { columns: COLUMNS, children: SOURCE },
      init: (e) => {
        tree.update("any", { immediate: true });
        assert.equal(tree.element.getAttribute("aria-rowcount"), "5");
        assert.equal(
          tree.findKey("f")._rowElem.getAttribute("aria-rowindex"),
          "2",
          "first row follows the header row"
        );
        done();
      },
    });
  });

  test("Plain tree, selection and active descendant", (assert) => {
    assert.expect(7);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: SOURCE,
      checkbox: true,
      init: async (e) => {
        tree.update("any", { immediate: true });
        const elem = tree.element;
        assert.equal(elem.getAttribute("aria-rowcount"), "4", "no header");
        assert.equal(elem.getAttribute("aria-multiselectable"), "true");

        const doc1 = tree.findKey("d1");
        assert.equal(doc1._rowElem.getAttribute("aria-rowindex"), "2");
        assert.equal(doc1._rowElem.getAttribute("aria-selected"), "false");

        doc1.setSelected(true);
        doc1.setFocus();
        tree.update("any", { immediate: true });
        assert.equal(doc1._rowElem.getAttribute("aria-selected"), "true");
        assert.equal(
          elem.getAttribute("aria-activedescendant"),
          doc1._rowElem.id,
          "active descendant is the focused row"
        );

        await tree.findKey("f").setExpanded(false);
        tree.update("any", { immediate: true });
        assert.equal(elem.getAttribute("aria-rowcount"), "2", "collapsed");
        done();
      },
    });
  });
});

QUnit.module("Keyboard and focus", (hooks) => {
  let tree = null;
  const SOURCE = [
    { title: "Alpha", key: "a" },
    { title: "Lab A", key: "la" },
    { title: "Lab C", key: "lc", children: [{ title: "Leaf", key: "leaf" }] },
    { title: "Omega", key: "o" },
  ];
  const treeElem = () => document.querySelector("#tree");
  const press = (key) => {
    tree.element.dispatchEvent(
      new KeyboardEvent("keydown", { key: key, bubbles: true })
    );
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clickTitle = (node) => {
    node.getColElem(0).querySelector("span.wb-title").click();
  };

  hooks.beforeEach(() => {
    treeElem().style.height = "300px";
  });
  hooks.afterEach(() => {
    tree.destroy();
    tree = null;
    treeElem().style.height = "";
  });

  test("Home/End move to first/last row in row mode", (assert) => {
    assert.expect(4);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: SOURCE,
      init: (e) => {
        tree.findKey("la").setActive();

        press("End");
        assert.equal(tree.getActiveNode().key, "o", "End: last row active");
        assert.equal(tree.getFocusNode().key, "o", "End: last row focused");

        press("Home");
        assert.equal(tree.getActiveNode().key, "a", "Home: first row active");
        assert.equal(tree.getFocusNode().key, "a", "Home: first row focused");
        done();
      },
    });
  });

  test("Quick search moves the focus and continues after a space", (assert) => {
    assert.expect(2);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: SOURCE,
      quicksearch: true,
      init: (e) => {
        tree.findKey("a").setActive();

        for (const key of ["l", "a", "b", " ", "c"]) {
          press(key);
        }
        assert.equal(tree.getActiveNode().key, "lc", "'lab c' matches");
        assert.equal(tree.getFocusNode().key, "lc", "focus follows the match");
        done();
      },
    });
  });

  test("Space after quick search toggles if no title matches", (assert) => {
    assert.expect(2);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: SOURCE,
      quicksearch: true,
      checkbox: true,
      init: (e) => {
        tree.findKey("o").setActive();

        press("a");
        assert.equal(tree.getFocusNode().key, "a", "'a' matches Alpha");
        press(" "); // no title starts with "a "
        assert.true(tree.findKey("a").isSelected(), "Space toggled Alpha");
        done();
      },
    });
  });

  test("Click moves the focus node", (assert) => {
    assert.expect(2);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: SOURCE,
      init: (e) => {
        tree.update("any", { immediate: true });
        tree.findKey("a").setActive();
        press("ArrowDown");
        assert.equal(tree.getFocusNode().key, "la", "keyboard moved focus");

        clickTitle(tree.findKey("o"));
        assert.equal(tree.getFocusNode().key, "o", "click moved focus");
        done();
      },
    });
  });

  test("Click on active title still starts editing (clickActive)", (assert) => {
    assert.expect(2);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: SOURCE,
      edit: { trigger: ["clickActive"] },
      init: async (e) => {
        tree.update("any", { immediate: true });
        const node = tree.findKey("la");
        node.setActive();
        await sleep(100); // let pending (throttled) updates run

        clickTitle(node);
        clickTitle(node);
        await sleep(100);
        assert.true(tree.isEditingTitle(), "title edit is active");
        assert.ok(
          node.getColElem(0).querySelector("input.wb-input-edit"),
          "title input is still rendered"
        );
        tree._callMethod("edit.stopEditTitle", false);
        done();
      },
    });
  });
});

QUnit.module("Paging nodes", (hooks) => {
  let tree = null;
  const treeElem = () => document.querySelector("#tree");
  const press = (key) => {
    tree.element.dispatchEvent(
      new KeyboardEvent("keydown", { key: key, bubbles: true })
    );
  };
  const makeSource = () => [
    {
      title: "Parent",
      key: "p",
      expanded: true,
      children: [
        { title: "Child 1", key: "c1" },
        { title: "Child 2", key: "c2" },
      ],
    },
  ];

  hooks.beforeEach(() => {
    treeElem().style.height = "300px";
  });
  hooks.afterEach(() => {
    tree.destroy();
    tree = null;
    treeElem().style.height = "";
  });

  test("addPagingNode", (assert) => {
    assert.expect(7);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: makeSource(),
      init: (e) => {
        const parent = tree.findKey("p");
        const paging = parent.addPagingNode();

        assert.true(paging.isPagingNode(), "is a paging node");
        assert.true(paging.isStatusNode(), "is a status node");
        assert.equal(paging.title, "More...", "default title");
        assert.true(paging.isColspan(), "spans all columns");
        assert.equal(parent.children[2], paging, "appended after children");

        const paging2 = parent.addPagingNode("Show 100 more");
        assert.deepEqual(
          parent.children.map((n) => n.title),
          ["Child 1", "Child 2", "Show 100 more"],
          "replaces the existing paging node"
        );
        assert.equal(paging2.parent, parent);
        done();
      },
    });
  });

  test("Enter and click fire clickPaging", (assert) => {
    assert.expect(4);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: makeSource(),
      clickPaging: (e) => {
        assert.step(`clickPaging(${e.node.parent.key})`);
      },
      activate: (e) => {
        if (e.node.isPagingNode()) {
          assert.step("activate(paging)");
        }
      },
      init: (e) => {
        tree.update("any", { immediate: true });
        const paging = tree.findKey("p").addPagingNode();
        tree.update("any", { immediate: true });

        paging.setFocus();
        press("Enter");
        press(" ");
        paging.getColElem(0).querySelector("span.wb-title").click();

        assert.verifySteps(
          ["clickPaging(p)", "clickPaging(p)", "clickPaging(p)"],
          "Enter, Space and click fire clickPaging, but don't activate"
        );
        done();
      },
    });
  });

  test("Enter fires clickPaging in cell mode", (assert) => {
    assert.expect(2);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: makeSource(),
      columns: [
        { id: "*", title: "Name", width: "200px" },
        { id: "size", title: "Size", width: "50px" },
      ],
      navigationModeOption: "cell",
      clickPaging: (e) => {
        assert.step("clickPaging");
      },
      init: (e) => {
        const paging = tree.findKey("p").addPagingNode();
        paging.setFocus();
        press("Enter");
        assert.verifySteps(["clickPaging"]);
        done();
      },
    });
  });

  test("Ignore clicks while an async clickPaging handler runs", (assert) => {
    assert.expect(6);
    const done = assert.async();
    let resolvePage;

    tree = new Wunderbaum({
      element: "#tree",
      source: makeSource(),
      clickPaging: (e) => {
        assert.step("clickPaging");
        return new Promise((resolve) => {
          resolvePage = resolve;
        });
      },
      init: async (e) => {
        const paging = tree.findKey("p").addPagingNode();
        paging.setFocus();
        press("Enter");
        press("Enter");
        assert.verifySteps(["clickPaging"], "second Enter was ignored");
        assert.true(paging._isLoading, "shows loading state");

        resolvePage();
        await Promise.resolve();
        await Promise.resolve();
        assert.false(paging._isLoading, "loading state reset");
        press("Enter");
        assert.verifySteps(["clickPaging"], "can be clicked again");
        done();
      },
    });
  });

  test("sort() keeps the paging node last", (assert) => {
    assert.expect(1);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: makeSource(),
      init: (e) => {
        const parent = tree.findKey("p");
        parent.addPagingNode("Aaa more");
        parent.sort({ key: (n) => n.title });
        assert.deepEqual(
          parent.children.map((n) => n.title),
          ["Child 1", "Child 2", "Aaa more"]
        );
        done();
      },
    });
  });

  test("Replacing a focused paging node clears the focus", (assert) => {
    assert.expect(3);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      source: makeSource(),
      clickPaging: (e) => {
        const parent = e.node.parent;
        e.node.remove();
        parent.addChildren([{ title: "Child 3", key: "c3" }]);
      },
      init: (e) => {
        const parent = tree.findKey("p");
        const paging = parent.addPagingNode();
        paging.setActive();
        paging.setFocus();
        press("Enter");

        assert.equal(tree.getFocusNode(), null, "focus node was reset");
        assert.equal(tree.getActiveNode(), null, "active node was reset");
        assert.deepEqual(
          parent.children.map((n) => n.key),
          ["c1", "c2", "c3"],
          "next page was added"
        );
        done();
      },
    });
  });
});
