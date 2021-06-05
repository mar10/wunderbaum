/*!
 * Wunderbaum - ext-filter
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { elemFromSelector, onEvent } from "./util";
import { Wunderbaum } from "./wunderbaum";
// import { WunderbaumNode } from "./wb_node";
import { WunderbaumExtension } from "./common";

export class FilterExtension extends WunderbaumExtension {
  name = "filter";
  queryInput?: HTMLInputElement;

  constructor(tree: Wunderbaum) {
    super(tree);

    this.attachQueryInput();
  }

  protected attachQueryInput() {
    this.queryInput = elemFromSelector("input#filterQuery") as HTMLInputElement;
    onEvent(this.queryInput, "input", null, (e) => {
      this.tree.log("query", e);
    });
  }
}
