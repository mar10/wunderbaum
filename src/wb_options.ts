/*!
 * Wunderbaum - utils
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import {
  BoolOptionResolver,
  NavigationModeOption,
  WbNodeEventType,
  WbTreeEventType,
} from "./common";
import { DndOptionsType } from "./wb_ext_dnd";

export interface WbNodeData {
  title: string;
  key?: string;
  refKey?: string;
  expanded?: boolean;
  selected?: boolean;
  checkbox?: boolean | string;
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
  types?: any; //[key: string]: any;
  /**
   * A list of maps that define column headers. If this option is set,
   * Wunderbaum becomes a treegrid control instead of a plain tree.
   * Column definitions can be passed as tree option, or be part of a `source`
   * response.
   * Default: `[]` meaning this is a plain tree.
   */
  columns?: Array<any>;
  /**
   * If true, add a `wb-skeleton` class to all nodes, that will result in a
   * 'glow' effect. Typically used with initial dummy nodes, while loading the
   * real data.
   * Default: false.
   */
  skeleton?: false;
  /**
   * Translation map for some system messages.
   */
  strings?: any; //[key: string] string;
  /**
   * 0:quiet, 1:errors, 2:warnings, 3:info, 4:verbose
   * Default: 3 (4 in local debug environment)
   */
  debugLevel: number;
  /**
   * Number of levels that are forced to be expanded, and have no expander icon.
   *  Default: 0
   */
  minExpandLevel?: number;
  // escapeTitles: boolean;
  /**
   * Height of the header row div.
   * Default: 22
   */
  headerHeightPx: number;
  /**
   * Height of a node row div.
   * Default: 22
   */
  rowHeightPx?: number;
  /**
   * Collapse siblings when a node is expanded.
   * Default: false
   */
  autoCollapse?: boolean;
  /**
   * Default:  NavigationModeOption.startRow
   */
  navigationMode?: NavigationModeOption;
  /**
   * Show/hide header (pass bool or string)
   */
  header?: boolean | string | null;
  /**
   *
   */
  showSpinner?: boolean;
  /**
   * Default: true
   */
  checkbox?: boolean | "radio" | BoolOptionResolver;
  /**
   * Default: 200
   */
  updateThrottleWait?: number;
  // --- KeyNav ---
  /**
   * Default: true
   */
  quicksearch?: boolean;

  // --- Extensions ---
  dnd?: DndOptionsType; // = {};
  filter: any; // = {};
  grid: any; // = {};
  // --- Events ---
  /**
   * Called after initial data was loaded and tree markup was rendered.
   * Check `e.error` for status.
   * @category Callback
   */
  init?: (e: WbTreeEventType) => void;
  /**
   *
   * @category Callback
   */
  update?: (e: WbTreeEventType) => void;
  /**
   *
   * @category Callback
   */
  activate?: (e: WbNodeEventType) => void;
  /**
   *
   * @category Callback
   */
  deactivate?: (e: WbNodeEventType) => void;
  /**
   *
   * @category Callback
   */
  change?: (e: WbNodeEventType) => void;
  /**
   *
   * @category Callback
   */
  click?: (e: WbTreeEventType) => void;
  /**
   *
   * @category Callback
   */
  discard?: (e: WbNodeEventType) => void;
  /**
   *
   * @category Callback
   */
  error?: (e: WbTreeEventType) => void;
  /**
   *
   * @category Callback
   */
  enhanceTitle?: (e: WbNodeEventType) => void;
  /**
   *
   * Check `e.flag` for status.
   * @category Callback
   */
  focus?: (e: WbTreeEventType) => void;
  /**
   *
   * @category Callback
   */
  keydown?: (e: WbNodeEventType) => void;
  /**
   * Called after data was loaded from local storage.
   */
  load?: (e: WbNodeEventType) => void;
  /**
   * @category Callback
   */
  modifyChild?: (e: WbNodeEventType) => void;
  /**
   *
   * @category Callback
   */
  receive?: (e: WbNodeEventType) => void;
  /**
   *
   * @category Callback
   */
  render?: (e: WbNodeEventType) => void;
  /**
   *
   * @category Callback
   */
  renderStatusNode?: (e: WbNodeEventType) => void;
  /**
   *
   * Check `e.flag` for status.
   * @category Callback
   */
  select?: (e: WbNodeEventType) => void;
}
