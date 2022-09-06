/*!
 * Wunderbaum - common
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { MatcherType } from "./types";
import { escapeRegex } from "./util";
import { WunderbaumNode } from "./wb_node";

export const DEFAULT_DEBUGLEVEL = 4; // Replaced by rollup script
export const ROW_HEIGHT = 22;
export const ICON_WIDTH = 20;
export const ROW_EXTRA_PAD = 7; // 2x $col-padding-x + 3px rounding errors
export const RENDER_MIN_PREFETCH = 5;
export const RENDER_MAX_PREFETCH = 5;
export const TEST_IMG = new RegExp(/\.|\//); // strings are considered image urls if they contain '.' or '/'
// export const RECURSIVE_REQUEST_ERROR = "$recursive_request";
// export const INVALID_REQUEST_TARGET_ERROR = "$request_target_invalid";

export let iconMap = {
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
  doc: "bi bi-file-earmark",
};

export const KEY_NODATA = "__not_found__";

/** Define which keys are handled by embedded <input> control, and should
 * *not* be passed to tree navigation handler in cell-edit mode. */
export const INPUT_KEYS = {
  text: ["left", "right", "home", "end", "backspace"],
  number: ["up", "down", "left", "right", "home", "end", "backspace"],
  checkbox: [],
  link: [],
  radiobutton: ["up", "down"],
  "select-one": ["up", "down"],
  "select-multiple": ["up", "down"],
};

/** Key codes that trigger grid navigation, even when inside an input element. */
export const NAVIGATE_IN_INPUT_KEYS: Set<string> = new Set([
  "ArrowDown",
  "ArrowUp",
  "Enter",
  "Escape",
]);

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

/** Return a callback that returns true if the node title contains a substring (case-insensitive). */
export function makeNodeTitleMatcher(s: string): MatcherType {
  s = escapeRegex(s.toLowerCase());
  return function (node: WunderbaumNode) {
    return node.title.toLowerCase().indexOf(s) >= 0;
  };
}

/** Return a callback that returns true if the node title starts with a string (case-insensitive). */
export function makeNodeTitleStartMatcher(s: string): MatcherType {
  s = escapeRegex(s);
  const reMatch = new RegExp("^" + s, "i");
  return function (node: WunderbaumNode) {
    return reMatch.test(node.title);
  };
}
