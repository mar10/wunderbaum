(function (window, document, undefined) {
  /*globals QUnit */
  /*globals mar10 */

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

  QUnit.module("Utility tests");

  QUnit.test("Static utility functions", function (assert) {
    assert.expect(2);

    assert.equal(util.type([]), "array", "type([])");
    assert.equal(util.type({}), "object", "type({})");
  });

  QUnit.module("Static tests");

  QUnit.test("Access static properties", function (assert) {
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

  QUnit.module("Instance tests");

  QUnit.test("Initial event sequence (fetch)", function (assert) {
    assert.expect(5);
    assert.timeout(1000); // Timeout after 1 second
    const done = assert.async();

    const tree = new Wunderbaum({
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

  QUnit.test("Lazy load (fetch)", function (assert) {
    assert.expect(8);
    assert.timeout(1000); // Timeout after 1 second
    const done = assert.async();
    let initComplete = false;

    const tree = new Wunderbaum({
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

  QUnit.test("applyCommand", function (assert) {
    assert.expect(5);
    assert.timeout(1000); // Timeout after 1 second
    const done = assert.async();

    const tree = new Wunderbaum({
      element: "#tree",
      source: FIXTURE_1,
      init: (e) => {
        const node1 = tree.findFirst("Node 1");
        const node2 = tree.findFirst("Node 2");
        node1.applyCommand("copy")
        node2.applyCommand("paste")
        done();
      },
    });
  });
})(window, document);
