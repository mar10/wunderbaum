/*!
 * Wunderbaum - common
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { Wunderbaum } from "./wunderbaum";
import { WunderbaumNode } from "./wb_node";
import { escapeRegExp, extend } from "./util";

export type WunderbaumOptions = any;
export type MatcherType = (node: WunderbaumNode) => boolean;

export const DEFAULT_DEBUGLEVEL = 2; // Replaced by rollup script
export const ROW_HEIGHT = 24;
export const RENDER_PREFETCH = 5;
export const TEST_IMG = new RegExp(/\.|\//); // strings are considered image urls if they contain '.' or '/'
export const RECURSIVE_REQUEST_ERROR = "$recursive_request";
export const INVALID_REQUEST_TARGET_ERROR = "$request_target_invalid";

export type FunctionType = (...args: any[]) => any;

export type NodeAnyCallback = (node: WunderbaumNode) => any;

export type NodeVisitResponse = "skip" | boolean | void;
export type NodeVisitCallback = (node: WunderbaumNode) => NodeVisitResponse;

export type FilterModeType = null | "dimm" | "hide";
export type NodeFilterResponse = "skip" | "branch" | boolean | void;
export type NodeFilterCallback = (node: WunderbaumNode) => NodeFilterResponse;

export type ExtensionsDict = { [key: string]: WunderbaumExtension };

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
  nodata = "nodata",
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
  public enabled = true;
  readonly name: string;
  readonly tree: Wunderbaum;
  readonly treeOpts: any;
  readonly extensionOpts: any;

  constructor(tree: Wunderbaum, name: string, defaults: any) {
    this.tree = tree;
    this.name = name;
    this.treeOpts = tree.options;
    // Merge extension default and explicit options into `tree.options.EXTNAME`
    // tree.options[name] ??= {};
    if (this.treeOpts[name] === undefined) {
      this.treeOpts[name] = this.extensionOpts = extend({}, defaults);
    } else {
      // TODO: do we break existing object instance references here?
      this.extensionOpts = extend({}, defaults, tree.options[name]);
      tree.options[name] = this.extensionOpts;
    }
    this.enabled = !!this.getOption("enabled");
  }

  /** Called on tree (re)init after all extensions are added, but before loading.*/
  init() {
    this.tree.element.classList.add("wb-ext-" + this.name);
  }

  protected callEvent(name: string, extra?: any): any {
    let func = this.extensionOpts[name];
    if (func) {
      return func.call(
        this.tree,
        extend(
          {
            event: this.name + "." + name,
          },
          extra
        )
      );
    }
  }

  getOption(name: string): any {
    return this.extensionOpts[name];
  }

  setOption(name: string, value: any): void {
    this.extensionOpts[name] = value;
  }

  setEnabled(flag = true) {
    this.enabled = !!flag;
  }

  onKeyEvent(data: any): boolean | undefined {
    return;
  }

  onRender(data: any): boolean | undefined {
    return;
  }
}

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
  s = escapeRegExp(s.toLowerCase());
  return function (node: WunderbaumNode) {
    return node.title.toLowerCase().indexOf(s) >= 0;
  };
}

/** */
export function makeNodeTitleStartMatcher(s: string): MatcherType {
  s = escapeRegExp(s);
  const reMatch = new RegExp("^" + s, "i");
  return function (node: WunderbaumNode) {
    return reMatch.test(node.title);
  };
}

/*******************************************************************************
 *
 */

// let reNumUnit = /^([+-]?(?:\d+|\d*\.\d+))([a-z]*|%)$/; // split "1.5em" to ["1.5", "em"]

/* Create a global embedded CSS style for the tree. */
// export function defineHeadStyleElement(id: string, cssText: string) {
//   id = "wunderbaum-style-" + id;
//   let $headStyle = $("#" + id);

//   if (!cssText) {
//     $headStyle.remove();
//     return null;
//   }
//   if (!$headStyle.length) {
//     $headStyle = $("<style />")
//       .attr("id", id)
//       .addClass("fancytree-style")
//       .prop("type", "text/css")
//       .appendTo("head");
//   }
//   try {
//     $headStyle.html(cssText);
//   } catch (e) {
//     // fix for IE 6-8
//     $headStyle[0].styleSheet.cssText = cssText;
//   }
//   return $headStyle;
// }

/* Calculate the CSS rules that indent title spans. */
// function renderLevelCss(
//   containerId,
//   depth,
//   levelOfs,
//   lineOfs,
//   labelOfs,
//   measureUnit
// ) {
//   let i,
//     prefix = "#" + containerId + " span.fancytree-level-",
//     rules = [];

//   for (i = 0; i < depth; i++) {
//     rules.push(
//       prefix +
//       (i + 1) +
//       " span.fancytree-title { padding-left: " +
//       (i * levelOfs + lineOfs) +
//       measureUnit +
//       "; }"
//     );
//   }
//   // Some UI animations wrap the UL inside a DIV and set position:relative on both.
//   // This breaks the left:0 and padding-left:nn settings of the title
//   rules.push(
//     "#" +
//     containerId +
//     " div.ui-effects-wrapper ul li span.fancytree-title, " +
//     "#" +
//     containerId +
//     " li.fancytree-animating span.fancytree-title " + // #716
//     "{ padding-left: " +
//     labelOfs +
//     measureUnit +
//     "; position: static; width: auto; }"
//   );
//   return rules.join("\n");
// }
