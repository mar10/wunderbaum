/*!
 * Wunderbaum - ext-logger
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { eventToString, overrideMethod } from "./util";
import { WunderbaumExtension } from "./wb_extension_base";
import { Wunderbaum } from "./wunderbaum";

export class LoggerExtension extends WunderbaumExtension {
  readonly prefix: string;

  constructor(tree: Wunderbaum) {
    super(tree, "logger", {});
    this.prefix = tree + ".ext-logger";
  }

  init() {
    let tree = this.tree;
    let prefix = this.prefix;
    overrideMethod(tree, "callEvent", function (name, extra) {
      let start = Date.now();
      (<any>tree)._superApply(arguments);
      console.info(
        `${prefix}: callEvent('${name}') took ${Date.now() - start} ms.`
      );
    });
  }

  onKeyEvent(data: any): boolean | undefined {
    // this.tree.logInfo("onKeyEvent", eventToString(data.event), data);
    console.info(`${this.prefix}: onKeyEvent()`, data);
    return;
  }
}
