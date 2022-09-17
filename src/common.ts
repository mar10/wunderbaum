/*!
 * Wunderbaum - common
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
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
  checkUnknown: "bi dash-square-dotted",
  radioChecked: "bi bi-circle-fill",
  radioUnchecked: "bi bi-circle",
  radioUnknown: "bi bi-circle-dotted",
  folder: "bi bi-folder2",
  folderOpen: "bi bi-folder2-open",
  folderLazy: "bi bi-folder-symlink",
  doc: "bi bi-file-earmark",
};

export const KEY_NODATA = "__not_found__";

/** Define which keys are handled by embedded <input> control, and should
 * *not* be passed to tree navigation handler in cell-edit mode. */
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
  "children",
  "columns",
  "format", // reserved for future use
  "keyMap", // reserved for future use
  "positional", // reserved for future use
  "typeList", // reserved for future use
  "types",
  "version", // reserved for future use
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
