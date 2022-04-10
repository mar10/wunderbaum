/*!
 * Wunderbaum - utils
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import {
  BoolOptionResolver,
  NavigationModeOption,
  WbEventType,
} from "./common";

export interface WbNodeData {
  title: string;
  key?: string;
  refKey?: string;
  expanded?: boolean;
  selected?: boolean;
  checkbox?: boolean | "radio" | BoolOptionResolver;
  children?: Array<WbNodeData>;
  // ...any?: Any;
}

/**
 * Available options for [[Wunderbaum]].
 *
 * Options are passed to the constructor as plain object:
 *
 * ```js
 * const tree = new mar10.Wunderbaum({
 *   id: "demo",
 *   element: document.querySelector("#demo-tree"),
 *   source: "url/of/data/request",
 *   ...
 * });
 * ```
 */
export interface WunderbaumOptions {
  /**
   * The target `div` element (or selector) that shall become a Wunderbaum.
   */
  element: string | HTMLDivElement;
  /**
   * The identifier of this tree. Used to reference the instance, especially
   * when multiple trees are present (e.g. `tree = mar10.Wunderbaum.getTree("demo")`).
   *
   * Default: `"wb_" + COUNTER`.
   */
  id?: string;
  /**
   * Define the initial tree data. Typically a URL of an endpoint that serves
   * a JSON formatted structure, but also a callback, Promise, or static data
   * is allowed.
   *
   * Default: `{}`.
   */
  source?: string | Array<WbNodeData>;
  /**
   * Define shared attributes for multiple nodes of the same type.
   * This allows for more compact data models. Type definitions can be passed
   * as tree option, or be part of a `source` response.
   *
   * Default: `{}`.
   */
  types: any; //[key: string]: any;
  /**
   * A list of maps that define column headers. If this option is set,
   * Wunderbaum becomes a tree-grid control instead of a plain tree.
   * Column definitions can be passed as tree option, or be part of a `source`
   * response.
   * Default: `[]` meaning this is a plain tree.
   */
  columns?: Array<any>;
  /**
   *
   * Default: false.
   */
  skeleton: false;
  /**
   *
   * Default: false.
   */
  strings: any; //[key: string] string;
  /**
   */
  debugLevel: number;
  minExpandLevel: 0;
  escapeTitles: true;
  headerHeightPx: 22;
  autoCollapse: false;
  // --- Extensions ---
  dnd: any; // = {};
  filter: any; // = {};
  grid: any; // = {};
  /**
   * A list of maps that define column headers. If this option is set,
   * Wunderbaum becomes a tree grid control instead of a plain tree.
   * Column definitions can be passed as tree option, or be part of a `source`
   * response.
   */
  navigationMode?: NavigationModeOption;
  // --- Events ---
  /**
   * Called after initial data was loaded and tree markup was rendered.
   * @category Callback
   */
  init?: (e: WbEventType) => void;
  /**
   * Called after data was loaded from local storage.
   * @category Callback
   */
  update?: (e: WbEventType) => void;
  /**
   * Called after data was loaded from local storage.
   * @category Callback
   */
  modifyChild?: (e: WbEventType) => void;
}
