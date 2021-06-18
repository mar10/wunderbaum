/*!
 * Wunderbaum - common
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { escapeRegex } from "./util";
import { WunderbaumNode } from "./wb_node";

export type WunderbaumOptions = any;
export type MatcherType = (node: WunderbaumNode) => boolean;

export const DEFAULT_DEBUGLEVEL = 2; // Replaced by rollup script
export const ROW_HEIGHT = 20;
export const RENDER_MIN_PREFETCH = 5;
export const RENDER_MAX_PREFETCH = 5;
export const TEST_IMG = new RegExp(/\.|\//); // strings are considered image urls if they contain '.' or '/'
export const RECURSIVE_REQUEST_ERROR = "$recursive_request";
export const INVALID_REQUEST_TARGET_ERROR = "$request_target_invalid";

export type NodeAnyCallback = (node: WunderbaumNode) => any;

export type NodeVisitResponse = "skip" | boolean | void;
export type NodeVisitCallback = (node: WunderbaumNode) => NodeVisitResponse;

export type FilterModeType = null | "dimm" | "hide";
export type NodeFilterResponse = "skip" | "branch" | boolean | void;
export type NodeFilterCallback = (node: WunderbaumNode) => NodeFilterResponse;

export type DndModeType = "before" | "after" | "over";

export enum ChangeType {
  any = "any",
  row = "row",
  structure = "structure",
  status = "status",
}

export enum NodeStatusType {
  ok = "ok",
  loading = "loading",
  error = "error",
  noData = "noData",
  // paging = "paging",
}

export enum NavigationMode {
  allow = "allow",
  force = "force",
  start = "start",
  off = "off",
}
export enum CellNavigationMode {
  row = "row",
  cellNav = "cellNav",
  cellEdit = "cellEdit",
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

// Define which keys are handled by embedded <input> control, and should
// *not* be passed to tree navigation handler in cell-edit mode:
export const INPUT_KEYS = {
  text: ["left", "right", "home", "end", "backspace"],
  number: ["up", "down", "left", "right", "home", "end", "backspace"],
  checkbox: [],
  link: [],
  radiobutton: ["up", "down"],
  "select-one": ["up", "down"],
  "select-multiple": ["up", "down"],
};

export let iconMap = {
  error: "bi bi-exclamation-triangle",
  // loading: "bi bi-hourglass-split",
  loading: "bi bi-arrow-repeat wb-spin",
  // noData: "bi bi-search",
  noData: "bi bi-question-circle",
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

export const KEY_NODATA = "__not_found__";

/** Map `KeyEvent.key` to navigation action. */
export const KEY_TO_ACTION_DICT: { [key: string]: string } = {
  " ": "toggleSelect",
  "+": "expand",
  Add: "expand",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  Backspace: "parent",
  "/": "collapseAll",
  Divide: "collapseAll",
  End: "lastCol",
  Home: "firstCol",
  "Control+End": "last",
  "Control+Home": "first",
  "*": "expandAll",
  Multiply: "expandAll",
  PageDown: "pageDown",
  PageUp: "pageUp",
  "-": "collapse",
  Subtract: "collapse",
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
 * @param defaultValue return this if nothing else matched
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
  let data,
    res,
    tree = node.tree,
    treeOpt = treeOptions[optionName],
    nodeOpt = nodeObject[optionName];

  if (typeof treeOpt === "function") {
    data = {
      node: node,
      tree: tree,
      options: tree.options,
      typeInfo: node.type ? tree.types[node.type] : {},
    };
    res = treeOpt.call(tree, { type: optionName }, data);
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

/** */
export function makeNodeTitleMatcher(s: string): MatcherType {
  s = escapeRegex(s.toLowerCase());
  return function (node: WunderbaumNode) {
    return node.title.toLowerCase().indexOf(s) >= 0;
  };
}

/** */
export function makeNodeTitleStartMatcher(s: string): MatcherType {
  s = escapeRegex(s);
  const reMatch = new RegExp("^" + s, "i");
  return function (node: WunderbaumNode) {
    return reMatch.test(node.title);
  };
}
