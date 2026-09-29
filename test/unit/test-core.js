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
