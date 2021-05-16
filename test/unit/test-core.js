(function (window, document, undefined) {
  /*globals QUnit */
  /*globals mar10 */

  let Wunderbaum = mar10.Wunderbaum;

  /* Setup */
  QUnit.testStart(function () {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  /* Tear Down */
  QUnit.testDone(function () {});

  QUnit.module("Functional tests");

  QUnit.test("Access core data (storage = null)", function (assert) {
    assert.expect(2);

    assert.true(Wunderbaum.version != null, "Statics defined");

    assert.throws(
      function () {
        let _dummy = Wunderbaum();
      },
      /TypeError/,
      "Fail if 'new' keyword is missing"
    );

    // let tree = new Wunderbaum({
    //   element: "#tree",
    // });
    // assert.ok(tree, "Can initialize");
  });
})(window, document);
