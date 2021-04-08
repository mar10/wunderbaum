/*!
 * Wunderbaum - common
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { Wunderbaum } from "./wunderbaum";
import { WunderbaumNode } from "./wb_node";

export type WunderbaumOptions = any;

export const default_debuglevel = 2; // Replaced by rollup script
export const ROW_HEIGHT = 24;
export const RENDER_PREFETCH = 5;

export type NodeAnyCallback = (node: WunderbaumNode) => any;

export enum ChangeType {
  any = "any",
  structure = "structure",
  status = "status",
}

export enum TargetType {
  unknown = "",
  checkbox = "checkbox",
  column = "column",
  expander = "expander",
  icon = "icon",
  prefix = "prefix",
  title = "title",
}

export let iconMap = {
  expanderExpanded: "bi bi-chevron-down",
  // expanderExpanded: "bi bi-dash-square",
  expanderCollapsed: "bi bi-chevron-right",
  // expanderCollapsed: "bi bi-plus-square",
  expanderLazy: "bi bi-x-square",
  checkChecked: "bi bi-check-square",
  checkUnchecked: "bi bi-square",
  checkUnknown: "bi dash-square-dotted",
  radioChecked: "bi bi-circle-fill",
  radioUnchecked: "bi bi-circle",
  radioUnknown: "bi bi-circle-dotted",
  folder: "bi bi-folder2",
  folderOpen: "bi bi-folder2-open",
  doc: "bi bi-file-earmark",
};


export abstract class WunderbaumExtension {
  abstract name: string;
  readonly tree: Wunderbaum;

  constructor(tree: Wunderbaum) {
    this.tree = tree;
  }

  // init(tree: Wunderbaum) {
  //   super(tree)
  // }
  onKeyEvent(data: any): boolean | undefined { return; }
  onRender(data: any): boolean | undefined { return; }

}

/** Map `KeyEvent.key` to navigation action. */
export const KEY_TO_ACTION_MAP: { [key: string]: string; } = {
  " ": "toggleSelect",
  "Add": "expand",
  "ArrowDown": "down",
  "ArrowLeft": "left",
  "ArrowRight": "right",
  "ArrowUp": "up",
  "Backspace": "parent",
  "Divide": "collapseAll",
  "End": "last",
  "Home": "first",
  "Multiply": "expandAll",
  "Subtract": "collapse",
};

/** Return an option value that has a default, but may be overridden by a
 * callback or a node instance attribute.
 *
 * Evaluation sequence:
 *
 * If `tree.options.<optionName>` is a callback that returns something, use that.
 * Else if `node.<optionName>` is defined, use that.
 * Else if `tree.options.<optionName>` is a value, use that.
 * Else use `defaultValue`.
 *
 * @param optionName name of the option property (on node and tree)
 * @param node passed to the callback
 * @param nodeObject where to look for the local option property, e.g. `node` or `node.data`
 * @param treeOption where to look for the tree option, e.g. `tree.options` or `tree.options.dnd`
 * @param [defaultValue]
 *
 * @example
 * // Check for node.foo, tree,options.foo(), and tree.options.foo:
 * evalOption("foo", node, node, tree.options);
 * // Check for node.data.bar, tree,options.qux.bar(), and tree.options.qux.bar:
 * evalOption("bar", node, node.data, tree.options.qux);
 */
export function evalOption(
  optionName: string,
  node: WunderbaumNode,
  nodeObject: any,
  treeOptions: any,
  defaultValue: any
): any {
  var ctx,
    res,
    tree = node.tree,
    treeOpt = treeOptions[optionName],
    nodeOpt = nodeObject[optionName];

  if (typeof treeOpt === "function") {
    ctx = {
      node: node,
      tree: tree,
      // widget: tree.widget,
      options: tree.options,
      typeInfo: node.type ? tree.types[node.type] : {},
    };
    res = treeOpt.call(tree, { type: optionName }, ctx);
    if (res == null) {
      res = nodeOpt;
    }
  } else {
    res = nodeOpt == null ? treeOpt : nodeOpt;
  }
  if (res == null) {
    res = defaultValue; // no option set at all: return default
  }
  return res;
}