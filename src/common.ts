/*!
 * Wunderbaum - common
 * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { MatcherCallback } from "./types";
import * as util from "./util";
import { WunderbaumNode } from "./wb_node";

export const DEFAULT_DEBUGLEVEL = 4; // Replaced by rollup script
/**
 * Fixed height of a row in pixel. Must match the SCSS variable `$row-outer-height`.
 */
export const ROW_HEIGHT = 22;
/**
 * Fixed width of node icons in pixel. Must match the SCSS variable `$icon-outer-width`.
 */
export const ICON_WIDTH = 20;
/**
 * Adjust the width of the title span, so overflow ellipsis work.
 * (2 x `$col-padding-x` + 3px rounding errors).
 */
export const TITLE_SPAN_PAD_Y = 7;
/** Render row markup for N nodes above and below the visible viewport. */
export const RENDER_MAX_PREFETCH = 5;
/** Skip rendering new rows when we have at least N nodes rendeed above and below the viewport. */
export const RENDER_MIN_PREFETCH = 5;
/** Regular expression to detect if a string describes an image URL (in contrast
 * to a class name). Strings are considered image urls if they contain '.' or '/'.
 */
export const TEST_IMG = new RegExp(/\.|\//);
// export const RECURSIVE_REQUEST_ERROR = "$recursive_request";
// export const INVALID_REQUEST_TARGET_ERROR = "$request_target_invalid";

/**
 * Default node icons.
 * Requires bootstrap icons https://icons.getbootstrap.com
 */
export const iconMap = {
  error: "bi bi-exclamation-triangle",
  // loading: "bi bi-hourglass-split wb-busy",
  loading: "bi bi-chevron-right wb-busy",
  // loading: "bi bi-arrow-repeat wb-spin",
  // loading: '<div class="spinner-border spinner-border-sm" role="status"> <span class="visually-hidden">Loading...</span> </div>',
  // noData: "bi bi-search",
  noData: "bi bi-question-circle",
  expanderExpanded: "bi bi-chevron-down",
  // expanderExpanded: "bi bi-dash-square",
  expanderCollapsed: "bi bi-chevron-right",
  // expanderCollapsed: "bi bi-plus-square",
  expanderLazy: "bi bi-chevron-right wb-helper-lazy-expander",
  // expanderLazy: "bi bi-chevron-bar-right",
  checkChecked: "bi bi-check-square",
  checkUnchecked: "bi bi-square",
  checkUnknown: "bi bi-dash-square-dotted",
  radioChecked: "bi bi-circle-fill",
  radioUnchecked: "bi bi-circle",
  radioUnknown: "bi bi-record-circle",
  folder: "bi bi-folder2",
  folderOpen: "bi bi-folder2-open",
  folderLazy: "bi bi-folder-symlink",
  doc: "bi bi-file-earmark",
};

export const KEY_NODATA = "__not_found__";

/** Define which keys are handled by embedded <input> control, and should
 * *not* be passed to tree navigation handler in cell-edit mode.
 */
export const INPUT_KEYS: { [key: string]: Array<string> } = {
  text: ["left", "right", "home", "end", "backspace"],
  number: ["up", "down", "left", "right", "home", "end", "backspace"],
  checkbox: [],
  link: [],
  radiobutton: ["up", "down"],
  "select-one": ["up", "down"],
  "select-multiple": ["up", "down"],
};

/** Dict keys that are evaluated by source loader (others are added to `tree.data` instead). */
export const RESERVED_TREE_SOURCE_KEYS: Set<string> = new Set([
  "_format", // reserved for future use
  "_keyMap", // reserved for future use
  "_positional", // reserved for future use
  "_typeList", // reserved for future use
  "_version", // reserved for future use
  "children",
  "columns",
  "types",
]);

// /** Key codes that trigger grid navigation, even when inside an input element. */
// export const INPUT_BREAKOUT_KEYS: Set<string> = new Set([
//   // "ArrowDown",
//   // "ArrowUp",
//   "Enter",
//   "Escape",
// ]);

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
  "Meta+ArrowDown": "last", // macOs
  "Meta+ArrowUp": "first", // macOs
  "*": "expandAll",
  Multiply: "expandAll",
  PageDown: "pageDown",
  PageUp: "pageUp",
  "-": "collapse",
  Subtract: "collapse",
};

/** Return a callback that returns true if the node title matches the string
 * or regular expression.
 * @see {@link WunderbaumNode.findAll}
 */
export function makeNodeTitleMatcher(match: string | RegExp): MatcherCallback {
  if (match instanceof RegExp) {
    return function (node: WunderbaumNode) {
      return (<RegExp>match).test(node.title);
    };
  }
  util.assert(typeof match === "string");

  // s = escapeRegex(s.toLowerCase());
  return function (node: WunderbaumNode) {
    return node.title === match;
    // console.log("match " + node, node.title.toLowerCase().indexOf(match))
    // return node.title.toLowerCase().indexOf(match) >= 0;
  };
}

/** Return a callback that returns true if the node title starts with a string (case-insensitive). */
export function makeNodeTitleStartMatcher(s: string): MatcherCallback {
  s = util.escapeRegex(s);
  const reMatch = new RegExp("^" + s, "i");
  return function (node: WunderbaumNode) {
    return reMatch.test(node.title);
  };
}

/** Compare two nodes by title (case-insensitive). */
export function nodeTitleSorter(a: WunderbaumNode, b: WunderbaumNode): number {
  const x = a.title.toLowerCase();
  const y = b.title.toLowerCase();

  return x === y ? 0 : x > y ? 1 : -1;
}

function unflattenSource(source: any): void {
  const { _format, _keyMap, _positional, children } = source;

  if (_format !== "flat") {
    throw new Error(`Expected source._format: "flat", but got ${_format}`);
  }
  if (_positional && _positional.includes("children")) {
    throw new Error(
      `source._positional must not include "children": ${_positional}`
    );
  }
  // Inverse keyMap:
  let longToShort: any = {};
  if (_keyMap) {
    for (const [key, value] of Object.entries(_keyMap)) {
      longToShort[<string>value] = key;
    }
  }
  const positionalShort = _positional.map((e: string) => longToShort[e]);
  const newChildren: any[] = [];
  const keyToNodeMap: { [key: string]: number } = {};
  const indexToNodeMap: { [key: number]: any } = {};
  const keyAttrName = longToShort["key"] ?? "key";
  const childrenAttrName = longToShort["children"] ?? "children";

  for (const [index, node] of children.entries()) {
    // Node entry format:
    //   [PARENT_ID, [POSITIONAL_ARGS]]
    // or
    //   [PARENT_ID, [POSITIONAL_ARGS], {KEY_VALUE_ARGS}]
    const [parentId, args, kwargs = {}] = node;

    // Free up some memory as we go
    node[1] = null;
    if (node[2] != null) {
      node[2] = null;
    }
    // console.log("flatten", parentId, args, kwargs)

    // We keep `kwargs` as our new node definition. Then we add all positional
    // values to this object:
    args.forEach((val: string, positionalIdx: number) => {
      kwargs[positionalShort[positionalIdx]] = val;
    });

    // Find the parent node. `null` means 'toplevel'. PARENT_ID may be the numeric
    // index of the source.children list. If PARENT_ID is a string, we search
    // a parent with node.key of this value.
    indexToNodeMap[index] = kwargs;
    const key = kwargs[keyAttrName];
    if (key != null) {
      keyToNodeMap[key] = kwargs;
    }
    let parentNode = null;
    if (parentId === null) {
      // top-level node
    } else if (typeof parentId === "number") {
      parentNode = indexToNodeMap[parentId];
      if (parentNode === undefined) {
        throw new Error(
          `unflattenSource: Could not find parent node by index: ${parentId}.`
        );
      }
    } else {
      parentNode = keyToNodeMap[parentId];
      if (parentNode === undefined) {
        throw new Error(
          `unflattenSource: Could not find parent node by key: ${parentId}`
        );
      }
    }
    if (parentNode) {
      parentNode[childrenAttrName] ??= [];
      parentNode[childrenAttrName].push(kwargs);
    } else {
      newChildren.push(kwargs);
    }
  }

  delete source.children;
  source.children = newChildren;
}

export function inflateSourceData(source: any): void {
  const { _format, _keyMap, _typeList } = source;

  if (_format === "flat") {
    unflattenSource(source);
  }
  delete source._format;
  delete source._version;
  delete source._keyMap;
  delete source._typeList;
  delete source._positional;

  function _iter(childList: any[]) {
    for (let node of childList) {
      // Expand short alias names
      if (_keyMap) {
        // Iterate over a list of names, because we modify inside the loop:
        Object.getOwnPropertyNames(node).forEach((propName) => {
          const long = _keyMap[propName] ?? propName;
          if (long !== propName) {
            node[long] = node[propName];
            delete node[propName];
          }
        });
      }
      // `node` now has long attribute names

      // Resolve node type indexes
      const type = node.type;
      if (_typeList && type != null && typeof type === "number") {
        const newType = _typeList[type];
        if (newType == null) {
          throw new Error(`Expected typeList[${type}] entry in [${_typeList}]`);
        }
        node.type = newType;
      }

      // Recursion
      if (node.children) {
        _iter(node.children);
      }
    }
  }
  _iter(source.children);
}
