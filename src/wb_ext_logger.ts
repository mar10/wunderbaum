/*!
 * Wunderbaum - ext-logger
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { overrideMethod } from "./util";
import { WunderbaumExtension } from "./wb_extension_base";
import { Wunderbaum } from "./wunderbaum";

export class LoggerExtension extends WunderbaumExtension {
  readonly prefix: string;
  protected ignoreEvents = new Set<string>([
    "enhanceTitle",
    "renderNode",
    "discard",
  ]);

  constructor(tree: Wunderbaum) {
    super(tree, "logger", {});
    this.prefix = tree + ".ext-logger";
  }

  init() {
    const tree = this.tree;

    // this.ignoreEvents.add();

    if (tree.getOption("debugLevel") >= 4) {
      // const self = this;
      const ignoreEvents = this.ignoreEvents;
      const prefix = this.prefix;

      overrideMethod(tree, "callEvent", function (name, extra) {
        if (ignoreEvents.has(name)) {
          return (<any>tree)._superApply(arguments);
        }
        let start = Date.now();
        const res = (<any>tree)._superApply(arguments);
        console.debug(
          `${prefix}: callEvent('${name}') took ${Date.now() - start} ms.`,
          arguments[1]
        );
        return res;
      });
    }
  }

  onKeyEvent(data: any): boolean | undefined {
    // this.tree.logInfo("onKeyEvent", eventToString(data.event), data);
    console.debug(`${this.prefix}: onKeyEvent()`, data);
    return;
  }
}
