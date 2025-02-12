/*!
 * Wunderbaum - common
 * Copyright (c) 2021-2024, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { MatcherCallback, SourceListType, SourceObjectType } from "./types";
import * as util from "./util";
import { WunderbaumNode } from "./wb_node";

export const DEFAULT_DEBUGLEVEL = 4; // Replaced by rollup script
/**
 * Fixed height of a row in pixel. Must match the SCSS variable `$row-outer-height`.
 */
export const DEFAULT_ROW_HEIGHT = 22;
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
/** Minimum column width if not set otherwise. */
export const DEFAULT_MIN_COL_WIDTH = 4;
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
export const iconMaps: { [key: string]: { [key: string]: string } } = {
  bootstrap: {
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
    colSortable: "bi bi-chevron-expand",
    // colSortable: "bi bi-arrow-down-up",
    // colSortAsc: "bi bi-chevron-down",
    // colSortDesc: "bi bi-chevron-up",
    colSortAsc: "bi bi-arrow-down",
    colSortDesc: "bi bi-arrow-up",
    colFilter: "bi bi-filter-circle",
    colFilterActive: "bi bi-filter-circle-fill wb-helper-invalid",
    colMenu: "bi bi-three-dots-vertical",
  },
  fontawesome6: {
    error: "fa-solid fa-triangle-exclamation",
    loading: "fa-solid fa-chevron-right fa-beat",
    noData: "fa-solid fa-circle-question",
    expanderExpanded: "fa-solid fa-chevron-down",
    expanderCollapsed: "fa-solid fa-chevron-right",
    expanderLazy: "fa-solid fa-chevron-right wb-helper-lazy-expander",
    checkChecked: "fa-regular fa-square-check",
    checkUnchecked: "fa-regular fa-square",
    checkUnknown: "fa-regular fa-square-minus",
    radioChecked: "fa-solid fa-circle",
    radioUnchecked: "fa-regular fa-circle",
    radioUnknown: "fa-regular fa-circle-question",
    folder: "fa-solid fa-folder-closed",
    folderOpen: "fa-regular fa-folder-open",
    folderLazy: "fa-solid fa-folder-plus",
    doc: "fa-regular fa-file",
    colSortable: "fa-solid fa-fw fa-sort",
    colSortAsc: "fa-solid fa-fw fa-sort-up",
    colSortDesc: "fa-solid fa-fw fa-sort-down",
    colFilter: "fa-solid fa-fw fa-filter",
    colFilterActive: "fa-solid fa-fw fa-filter wb-helper-invalid",
    colMenu: "fa-solid fa-fw fa-ellipsis-v",
  },
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
  "_keyMap", // Used for compressed data format
  "_positional", // Used for compressed data format
  "_typeList", // Used for compressed data format @deprecated
  "_valueMap", // Used for compressed data format
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
  util.assert(
    typeof match === "string",
    `Expected a string or RegExp: ${match}`
  );

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

/**
 * Convert 'flat' to 'nested' format.
 *
 *  Flat node entry format:
 *    [PARENT_ID, [POSITIONAL_ARGS]]
 *  or
 *    [PARENT_ID, [POSITIONAL_ARGS], {KEY_VALUE_ARGS}]
 *
 * 1. Parent-referencing list is converted to a list of nested dicts with
 *    optional `children` properties.
 * 2. `[POSITIONAL_ARGS]` are added as dict attributes.
 */
function unflattenSource(source: SourceObjectType): void {
  const { _format, _keyMap = {}, _positional = [], children } = source;

  if (_format !== "flat") {
    throw new Error(`Expected source._format: "flat", but got ${_format}`);
  }
  if (_positional && _positional.includes("children")) {
    throw new Error(
      `source._positional must not include "children": ${_positional}`
    );
  }
  let longToShort = _keyMap;
  if (_keyMap.t) {
    // Inverse keyMap was used (pre 0.7.0)
    // TODO: raise Error on final 1.x release
    const msg = `source._keyMap maps from long to short since v0.7.0. Flip key/value!`;
    console.warn(msg); // eslint-disable-line no-console
    longToShort = {};
    for (const [key, value] of Object.entries(_keyMap)) {
      longToShort[value] = key;
    }
  }
  const positionalShort = _positional.map((e: string) => longToShort[e]);
  const newChildren: SourceListType = [];
  const keyToNodeMap: { [key: string]: number } = {};
  const indexToNodeMap: { [key: number]: any } = {};
  const keyAttrName = longToShort["key"] ?? "key";
  const childrenAttrName = longToShort["children"] ?? "children";

  for (const [index, nodeTuple] of children.entries()) {
    // Node entry format:
    //   [PARENT_ID, [POSITIONAL_ARGS]]
    // or
    //   [PARENT_ID, [POSITIONAL_ARGS], {KEY_VALUE_ARGS}]
    const [parentId, args, kwargs = {}] = <any>nodeTuple;

    // Free up some memory as we go
    nodeTuple[1] = null;
    if (nodeTuple[2] != null) {
      nodeTuple[2] = null;
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
  source.children = newChildren;
}

/**
 * Decompresses the source data by
 * - converting from 'flat' to 'nested' format
 * - expanding short alias names to long names (if defined in _keyMap)
 * - resolving value indexes to value strings (if defined in _valueMap)
 *
 * @param source - The source object to be decompressed.
 * @returns void
 */
export function decompressSourceData(source: SourceObjectType): void {
  let { _format, _version = 1, _keyMap, _valueMap } = source;

  util.assert(_version === 1, `Expected file version 1 instead of ${_version}`);

  let longToShort = _keyMap;
  let shortToLong: { [key: string]: string } = {};

  if (longToShort) {
    for (const [key, value] of Object.entries(longToShort)) {
      shortToLong[value] = key;
    }
  }

  // Fallback for old format (pre 0.7.0, using _keyMap in reverse direction)
  // TODO: raise Error on final 1.x release
  if (longToShort && longToShort.t) {
    const msg = `source._keyMap maps from long to short since v0.7.0. Flip key/value!`;
    console.warn(msg); // eslint-disable-line no-console
    [longToShort, shortToLong] = [shortToLong, longToShort];
  }

  // Fallback for old format (pre 0.7.0, using _typeList instead of _valueMap)
  // TODO: raise Error on final 1.x release
  if ((<any>source)._typeList != null) {
    const msg = `source._typeList is deprecated since v0.7.0: use source._valueMap: {"type": [...]} instead.`;
    if (_valueMap != null) {
      throw new Error(msg);
    } else {
      console.warn(msg); // eslint-disable-line no-console
      _valueMap = { type: (<any>source)._typeList };
      delete (<any>source)._typeList;
    }
  }

  if (_format === "flat") {
    unflattenSource(source);
  }
  delete source._format;
  delete source._version;
  delete source._keyMap;
  delete source._valueMap;
  delete source._positional;

  function _iter(childList: SourceListType) {
    for (const node of childList) {
      // Iterate over a list of names, because we modify inside the loop
      // (for ... of ... does not allow this)
      Object.getOwnPropertyNames(node).forEach((propName) => {
        const value: any = node[propName];

        // Replace short names with long names if defined in _keyMap
        let longName = propName;
        if (_keyMap && shortToLong[propName] != null) {
          longName = shortToLong[propName];
          if (longName !== propName) {
            node[longName] = value;
            delete node[propName];
          }
        }
        // Replace type index with type name if defined in _valueMap
        if (
          _valueMap &&
          typeof value === "number" &&
          _valueMap[longName] != null
        ) {
          const newValue = _valueMap[longName][value];
          if (newValue == null) {
            throw new Error(
              `Expected valueMap[${longName}][${value}] entry in [${_valueMap[longName]}]`
            );
          }
          node[longName] = newValue;
        }
      });

      // Recursion
      if (node.children) {
        _iter(node.children);
      }
    }
  }
  if (_keyMap || _valueMap) {
    _iter(source.children);
  }
}
