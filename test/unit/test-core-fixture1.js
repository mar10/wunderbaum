/*!
 * Wunderbaum - Unit Test
 * Copyright (c) 2021-2024, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

const { test } = QUnit;
const Wunderbaum = mar10.Wunderbaum;

const FIXTURE_1 = [
  {
    title: "Node 1",
    expanded: true,
    children: [{ title: "Node 1.1" }, { title: "Node 1.2" }],
  },
  { title: "Node 2", lazy: true },
];

QUnit.module("Fixture-1 tests", (hooks) => {
  let tree;

  hooks.beforeEach(() => {
    tree = new Wunderbaum({
      element: "#tree",
      source: FIXTURE_1,
    });
  });
  hooks.afterEach(() => {
    tree.destroy();
    tree = null;
  });

  test("fixture ok", (assert) => {
    assert.expect(1);
    assert.equal(tree.count(), 4);
  });
});
