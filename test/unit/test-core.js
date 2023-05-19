/*!
 * Wunderbaum - Unit Test
 * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

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
        let _dummy = Wunderbaum();
      },
      /TypeError/,
      "Fail if 'new' keyword is missing"
    );
    assert.throws(
      function () {
        let _dummy = new Wunderbaum();
      },
      /Error: Invalid 'element' option: null/,
      "Fail if option is missing"
    );
    assert.throws(
      function () {
        let _dummy = new Wunderbaum({});
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
});
