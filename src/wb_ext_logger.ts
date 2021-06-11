/*!
 * Wunderbaum - ext-logger
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { WunderbaumExtension } from "./common";
import { eventToString, overrideMethod } from "./util";
import { Wunderbaum } from "./wunderbaum";

export class LoggerExtension extends WunderbaumExtension {
  constructor(tree: Wunderbaum) {
    super(tree, "logger", {});
  }

  init() {
    let tree = this.tree;
    overrideMethod(tree, "callEvent", function (name, extra) {
      let start = Date.now();
      (<any>tree)._superApply(arguments);
      tree.log(
        "wb-ext-logger: callEvent('" +
          name +
          "') took " +
          (Date.now() - start) +
          "ms"
      );
    });
  }

  onKeyEvent(data: any): boolean | undefined {
    this.tree.log("onKeyEvent", eventToString(data.event), data);
    return;
  }
}
