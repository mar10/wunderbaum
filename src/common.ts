/*!
 * Wunderbaum - common
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { escapeRegex } from "./util";
import { WunderbaumNode } from "./wb_node";

export type WunderbaumOptions = any;
export type MatcherType = (node: WunderbaumNode) => boolean;

export const DEFAULT_DEBUGLEVEL = 4; // Replaced by rollup script
export const ROW_HEIGHT = 22;
export const ICON_WIDTH = 20;
export const ROW_EXTRA_PAD = 7; // 2x $col-padding-x + 3px rounding errors
export const RENDER_MIN_PREFETCH = 5;
export const RENDER_MAX_PREFETCH = 5;
export const TEST_IMG = new RegExp(/\.|\//); // strings are considered image urls if they contain '.' or '/'
// export const RECURSIVE_REQUEST_ERROR = "$recursive_request";
// export const INVALID_REQUEST_TARGET_ERROR = "$request_target_invalid";

export type NodeAnyCallback = (node: WunderbaumNode) => any;

export type NodeVisitResponse = "skip" | boolean | void;
export type NodeVisitCallback = (node: WunderbaumNode) => NodeVisitResponse;

export type FilterModeType = null | "dim" | "hide";
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
  // loading: '<div class="spinner-border spinner-border-sm" role="status"> <span class="visually-hidden">Loading...</span> </div>',
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

/** Lookup key codes that trigger grid navigation, even when inside an input element. */
export const TAG_NAME_ALLOWED_KEYS: { [key: string]: string[] } = {
  SPAN: ["ArrowDown", "ArrowUp"],
};

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
