/*!
 * Wunderbaum - wb_extension_base
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import * as util from "./util";
import { Wunderbaum } from "./wunderbaum";

export type ExtensionsDict = { [key: string]: WunderbaumExtension };

export abstract class WunderbaumExtension {
  public enabled = true;
  readonly id: string;
  readonly tree: Wunderbaum;
  readonly treeOpts: any;
  readonly extensionOpts: any;

  constructor(tree: Wunderbaum, id: string, defaults: any) {
    this.tree = tree;
    this.id = id;
    this.treeOpts = tree.options;

    if (this.treeOpts[id] === undefined) {
      this.treeOpts[id] = this.extensionOpts = util.extend({}, defaults);
    } else {
      // TODO: do we break existing object instance references here?
      this.extensionOpts = util.extend({}, defaults, tree.options[id]);
      tree.options[id] = this.extensionOpts;
    }
    this.enabled = this.getPluginOption("enabled", true);
  }

  /** Called on tree (re)init after all extensions are added, but before loading.*/
  init() {
    this.tree.element.classList.add("wb-ext-" + this.id);
  }

  // protected callEvent(name: string, extra?: any): any {
  //   let func = this.extensionOpts[name];
  //   if (func) {
  //     return func.call(
  //       this.tree,
  //       util.extend(
  //         {
  //           event: this.id + "." + name,
  //         },
  //         extra
  //       )
  //     );
  //   }
  // }

  getPluginOption(name: string, defaultValue?: any): any {
    return this.extensionOpts[name] ?? defaultValue;
  }

  setPluginOption(name: string, value: any): void {
    this.extensionOpts[name] = value;
  }

  setEnabled(flag = true) {
    return this.setPluginOption("enabled", !!flag);
    // this.enabled = !!flag;
  }

  onKeyEvent(data: any): boolean | undefined {
    return;
  }

  onRender(data: any): boolean | undefined {
    return;
  }
}
