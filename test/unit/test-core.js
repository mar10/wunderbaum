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

QUnit.module("Multi-row nodes (rowSpan)", (hooks) => {
  let tree = null;
  const treeElem = () => document.querySelector("#tree");

  hooks.beforeEach(() => {
    treeElem().style.height = "300px";
  });
  hooks.afterEach(() => {
    tree.destroy();
    tree = null;
    treeElem().style.height = "";
  });

  test("Layout and navigation", (assert) => {
    assert.expect(10);
    const done = assert.async();

    tree = new Wunderbaum({
      element: "#tree",
      columns: [
        { id: "*", title: "Name", width: "200px" },
        { id: "size", title: "Size", width: "50px" },
      ],
      source: [
        { title: "Node 1", key: "1" },
        { title: "Detail", key: "d", rowSpan: 3, colspan: true },
        { title: "Node 2", key: "2", rowSpan: 2.7 },
        { title: "Node 3", key: "3", rowSpan: 0 },
      ],
      init: (e) => {
        tree.update("any", { immediate: true });
        const rowHeight = tree.options.rowHeightPx;
        const detail = tree.findKey("d");

        assert.equal(detail.rowSpan, 3);
        assert.equal(tree.findKey("2").rowSpan, 2, "rounded down");
        assert.equal(tree.findKey("3").rowSpan, 1, "at least 1");
        assert.equal(tree.count(true), 4, "count(true) counts nodes");
        assert.equal(tree.findKey("2")._rowIdx, 4, "slots before Node 2");
        assert.equal(detail._rowElem.style.height, 3 * rowHeight + "px");
        assert.true(detail._rowElem.classList.contains("wb-multirow"));
        assert.equal(
          tree.nodeListElement.style.height,
          7 * rowHeight + "px",
          "list height covers all slots"
        );
        assert.equal(tree._getNodeByRowIdx(3), detail, "slot 3 is the detail");

        tree.findKey("1").setActive();
        tree.element.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
        );
        assert.equal(tree.getActiveNode(), detail, "ArrowDown");
        done();
      },
    });
  });

  test("Virtual rendering, scrollTo and runtime changes", (assert) => {
    assert.expect(5);
    const done = assert.async();
    const source = [];
    for (let i = 0; i < 30; i++) {
      source.push({ title: "Node " + i, key: "a" + i });
    }
    source.push({ title: "Detail", key: "d", rowSpan: 40 });
    for (let i = 0; i < 30; i++) {
      source.push({ title: "Node " + i, key: "b" + i });
    }

    tree = new Wunderbaum({
      element: "#tree",
      source: source,
      init: (e) => {
        const rowHeight = tree.options.rowHeightPx;
        const detail = tree.findKey("d");

        // Detail uses slots 30..69: scroll so that its first slot is above
        // the rendered window, but the rest is visible
        tree.element.scrollTop = 50 * rowHeight;
        tree.update("any", { immediate: true });
        assert.ok(detail._rowElem, "partly visible multi-row node is rendered");
        assert.notOk(tree.findKey("a0")._rowElem, "rows far above are not");

        // Scrolling to a node that is higher than the viewport shows its top
        tree.element.scrollTop = 0;
        tree.scrollTo(detail);
        const scrollTop = tree.element.scrollTop;
        assert.true(
          scrollTop <= 30 * rowHeight && scrollTop > 29 * rowHeight,
          `scrollTo shows the top (scrollTop: ${scrollTop})`
        );

        detail.rowSpan = 2;
        tree.update("any", { immediate: true });
        assert.equal(detail._rowElem.style.height, 2 * rowHeight + "px");
        assert.equal(tree.findKey("b0")._rowIdx, 32, "slots were updated");
        done();
      },
    });
  });
});
