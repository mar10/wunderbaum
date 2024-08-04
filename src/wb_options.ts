/*!
 * Wunderbaum - utils
 * Copyright (c) 2021-2024, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import {
  ColumnDefinitionList,
  DndOptionsType,
  DynamicBoolOption,
  DynamicBoolOrStringOption,
  DynamicCheckboxOption,
  DynamicIconOption,
  EditOptionsType,
  FilterOptionsType,
  // GridOptionsType,
  // KeynavOptionsType,
  // LoggerOptionsType,
  NavModeEnum,
  NodeTypeDefinitionMap,
  SelectModeType,
  WbActivateEventType,
  WbButtonClickEventType,
  WbCancelableEventResultType,
  WbChangeEventType,
  WbClickEventType,
  WbDeactivateEventType,
  WbErrorEventType,
  WbExpandEventType,
  WbIconBadgeCallback,
  WbIconBadgeEventResultType,
  WbInitEventType,
  WbKeydownEventType,
  WbNodeData,
  WbNodeEventType,
  WbReceiveEventType,
  WbRenderEventType,
  WbSelectEventType,
  WbTreeEventType,
} from "./types";

/**
 * Available options for {@link wunderbaum.Wunderbaum}.
 *
 * Options are passed to the constructor as plain object:
 *
 * ```js
 * const tree = new mar10.Wunderbaum({
 *   id: "demo",
 *   element: document.getElementById("demo-tree"),
 *   source: "url/of/data/request",
 *   ...
 * });
 * ```
 *
 * Event handlers are also passed as callbacks
 *
 * ```js
 * const tree = new mar10.Wunderbaum({
 *   ...
 *   init: (e) => {
 *     console.log(`Tree ${e.tree} was initialized and loaded.`)
 *   },
 *   activate: (e) => {
 *     console.log(`Node ${e.node} was activated.`)
 *   },
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
  types?: NodeTypeDefinitionMap;
  /**
   * A list of maps that define column headers. If this option is set,
   * Wunderbaum becomes a treegrid control instead of a plain tree.
   * Column definitions can be passed as tree option, or be part of a `source`
   * response.
   * Default: `[]` meaning this is a plain tree.
   */
  columns?: ColumnDefinitionList;
  /**
   * If true, add a `wb-skeleton` class to all nodes, that will result in a
   * 'glow' effect. Typically used with initial dummy nodes, while loading the
   * real data.
   * Default: false.
   */
  skeleton?: boolean;
  /**
   * Translation map for some system messages.
   */
  strings?: any; //[key: string] string;
  /**
   * 0:quiet, 1:errors, 2:warnings, 3:info, 4:verbose
   * Default: 3 (4 in local debug environment)
   */
  debugLevel?: number;
  /**
   * Number of levels that are forced to be expanded, and have no expander icon.
   * E.g. 1 would keep all toplevel nodes expanded.
   * Default: 0
   */
  minExpandLevel?: number;
  /**
   * If true, allow to expand parent nodes, even if `node.children` conatains
   * an empty array (`[]`). This is the the behavior of macOS Finder, for example.
   * Default: false
   */
  emptyChildListExpandable?: boolean;
  // escapeTitles: boolean;
  // /**
  //  * Height of the header row div.
  //  * Default: 22
  //  */
  // headerHeightPx: number;
  /**
   * Height of a node row div.
   * Default: 22
   */
  rowHeightPx?: number;
  /**
   * Icon font definition. May be a string (e.g. "fontawesome6" or "bootstrap")
   * or a map of `iconName: iconClass` pairs.
   * Note: the icon font must be loaded separately.
   * Default: "bootstrap"
   */
  iconMap?: string | { [key: string]: string };
  /**
   * Collapse siblings when a node is expanded.
   * Default: false
   */
  autoCollapse?: boolean;
  /**
   * If true, the tree will automatically adjust its height to fit the parent
   * container. This is useful when the tree is embedded in a container with
   * a fixed or calculated sized.
   * If the parent container is unsized (e.g. grows with its content, `height: auto`),
   * then we can define a `height: ...` or `max_height: ...` style on the parent.
   * To avoid a recursive resize-loop, it may be helpful to set `overflow: hidden`
   * on the parent container.
   *
   * Set this option to `false` will disable auto-resizing.
   *
   * @default: true
   */
  adjustHeight?: boolean;
  /**
   * HTMLElement that receives the top nodes breadcrumb.
   * Default: undefined
   */
  connectTopBreadcrumb?: HTMLElement;
  /**
   * Default:  NavModeEnum.startRow
   */
  navigationModeOption?: NavModeEnum;
  /**
   * Show/hide header (default: null)
   * null: assume false for plain tree and true for grids.
   * string: use text as header (only for plain trees)
   * true: display a header (use tree's id as text for plain trees)
   * false: do not display a header
   */
  header?: boolean | string | null;
  /**
   *
   */
  showSpinner?: boolean;
  /**
   * If true, render a checkbox before the node tile to allow selection with the
   * mouse. Pass `"radio"` to render a radio button instead.
   * Default: false.
   */
  checkbox?: DynamicCheckboxOption;
  /** Optional callback to render icons per node. */
  icon?: DynamicIconOption;
  /** Optional callback to render a tooltip for the icon. */
  iconTooltip?: DynamicBoolOrStringOption;
  /** Optional callback to render a tooltip for the node title.
   * Pass `true` to use the node's `title` property as tooltip.
   */
  tooltip?: DynamicBoolOrStringOption;
  /** Optional callback to make a node unselectable. */
  unselectable?: DynamicBoolOption;
  // /**
  //  * Default: 200
  //  */
  // updateThrottleWait?: number;
  /**
   * Default: true
   */
  enabled?: boolean;
  /**
   * Default: false
   */
  fixedCol?: boolean;
  /**
   * Default value for ColumnDefinition.filterable option.
   * Default: false
   * @since 0.11.0
   */
  columnsFilterable?: boolean;
  /**
   * Default value for ColumnDefinition.menu option.
   * Default: false
   * @since 0.11.0
   */
  columnsMenu?: boolean;
  /**
   * Default value for ColumnDefinition.resizable option.
   * Default: false
   * @since 0.10.0
   */
  columnsResizable?: boolean;
  /**
   * Default value for ColumnDefinition.sortable option.
   * Default: false
   * @since 0.11.0
   */
  columnsSortable?: boolean;

  // --- Selection ---
  /**
   * Default: "multi"
   */
  selectMode?: SelectModeType;

  // --- KeyNav ---
  /**
   * Default: true
   */
  quicksearch?: boolean;

  /**
   * Scroll Node into view on Expand Click
   * @default true
   */
  scrollIntoViewOnExpandClick?: boolean;

  // --- Extensions ------------------------------------------------------------

  dnd?: DndOptionsType;
  edit?: EditOptionsType;
  filter?: FilterOptionsType;
  // grid?: GridOptionsType;
  // keynav?: KeynavOptionsType;
  // logger?: LoggerOptionsType;

  // --- Events ----------------------------------------------------------------

  /**
   * `e.node` was activated.
   * @category Callback
   */
  activate?: (e: WbActivateEventType) => void;
  /**
   * `e.node` is about to be activated.
   * Return `false` to prevent default handling, i.e. activating the node.
   * See also `deactivate` event.
   * @category Callback
   */
  beforeActivate?: (e: WbActivateEventType) => WbCancelableEventResultType;
  /**
   * `e.node` is about to be expanded/collapsed.
   * Return `false` to prevent default handling, i.e. expanding/collapsing the node.
   * @category Callback
   */
  beforeExpand?: (e: WbExpandEventType) => WbCancelableEventResultType;
  /**
   * Return `false` to prevent default handling, i.e. (de)selecting the node.
   * @category Callback
   */
  beforeSelect?: (e: WbSelectEventType) => WbCancelableEventResultType;
  /**
   * Return `false` to prevent default handling, i.e. (de)selecting the node.
   * @category Callback
   */
  buttonClick?: (e: WbButtonClickEventType) => void;
  /**
   *
   * @category Callback
   */
  change?: (e: WbChangeEventType) => void;
  /**
   *
   * Return `false` to prevent default behavior, e.g. expand/collapse, (de)selection, or activation.
   * @category Callback
   */
  click?: (e: WbClickEventType) => WbCancelableEventResultType;
  /**
   * Return `false` to prevent default behavior, e.g. expand/collapse.
   * @category Callback
   */
  dblclick?: (e: WbClickEventType) => WbCancelableEventResultType;
  /**
   * `e.node` was deactivated.
   *
   * Return `false` to prevent default handling, e.g. deactivating the node
   * and activating the next.
   * See also `activate` event.
   * @category Callback
   */
  deactivate?: (e: WbDeactivateEventType) => WbCancelableEventResultType;
  /**
   * `e.node` was discarded from the viewport and its HTML markup removed.
   * @category Callback
   */
  discard?: (e: WbNodeEventType) => void;
  /**
   * `e.node` is about to be rendered. We can add a badge to the icon cell here.
   * @category Callback
   */
  iconBadge?: (e: WbIconBadgeCallback) => WbIconBadgeEventResultType;
  /**
   * An error occurred, e.g. during initialization or lazy loading.
   * @category Callback
   */
  error?: (e: WbErrorEventType) => void;
  /**
   * `e.node` was expanded (`e.flag === true`) or collapsed (`e.flag === false`)
   * @category Callback
   */
  expand?: (e: WbTreeEventType) => void;
  /**
   * The tree received or lost focus.
   * Check `e.flag` for status.
   * @category Callback
   */
  focus?: (e: WbTreeEventType) => void;
  /**
   * Fires when the tree markup was created and the initial source data was loaded.
   * Typical use cases would be activating a node, setting focus, enabling other
   * controls on the page, etc.<br>
   *  Also sent if an error occured during initialization (check `e.error` for status).
   * @category Callback
   */
  init?: (e: WbInitEventType) => void;
  /**
   * Fires when a key was pressed while the tree has focus.
   * `e.node` is set if a node is currently active.
   * Return `false` to prevent default navigation.
   * @category Callback
   */
  keydown?: (e: WbKeydownEventType) => WbCancelableEventResultType;
  /**
   * Fires when a node that was marked 'lazy', is expanded for the first time.
   * Typically we return an endpoint URL or the Promise of a fetch request that
   * provides a (potentially nested) list of child nodes.
   * @category Callback
   */
  lazyLoad?: (e: WbNodeEventType) => void;
  /**
   * Fires when data was loaded (initial request, reload, or lazy loading),
   * after the data is applied and rendered.
   * @category Callback
   */
  load?: (e: WbNodeEventType) => void;
  /**
   * @category Callback
   */
  modifyChild?: (e: WbNodeEventType) => void;
  /**
   * Fires when data was fetched (initial request, reload, or lazy loading),
   * but before the data is applied and rendered.
   * Here we can modify and adjust the received data, for example to convert an
   * external response to native Wunderbaum syntax.
   * @category Callback
   */
  receive?: (e: WbReceiveEventType) => void;
  /**
   * Fires when a node is about to be displayed.
   * The default HTML markup is already created, but not yet added to the DOM.
   * Now we can tweak the markup, create HTML elements in this node's column
   * cells, etc.
   * See also `Custom Rendering` for details.
   * @category Callback
   */
  render?: (e: WbRenderEventType) => void;
  /**
   * Same as `render(e)`, but for the status nodes, i.e. `e.node.statusNodeType`.
   * @category Callback
   */
  renderStatusNode?: (e: WbRenderEventType) => void;
  /**
   *`e.node` was selected (`e.flag === true`) or deselected (`e.flag === false`)
   * @category Callback
   */
  select?: (e: WbNodeEventType) => void;
  /**
   * Fires when the viewport content was updated, after scroling, expanding etc.
   * @category Callback
   */
  update?: (e: WbTreeEventType) => void;
}
