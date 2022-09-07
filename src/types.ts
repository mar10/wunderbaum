/*!
 * Wunderbaum - types
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { WunderbaumNode } from "./wb_node";
import { Wunderbaum } from "./wunderbaum";

// export type WunderbaumOptions = any;
export type MatcherType = (node: WunderbaumNode) => boolean;
export type BoolOptionResolver = (node: WunderbaumNode) => boolean;

export type NodeAnyCallback = (node: WunderbaumNode) => any;

export type NodeVisitResponse = "skip" | boolean | void;
export type NodeVisitCallback = (node: WunderbaumNode) => NodeVisitResponse;

// type WithWildcards<T> = T & { [key: string]: unknown };
export interface WbTreeEventType {
  /** Name of the event. */
  type: string;
  /** The affected tree. */
  tree: Wunderbaum;
  /** Originating HTML event, e.g. `click` if any. */
  event?: Event;
  // [key: string]: unknown;
}

export interface WbNodeEventType extends WbTreeEventType {
  /** The affected target node. */
  node: WunderbaumNode;
  /**
   * Contains the node's type information, i.e. `tree.types[node.type]` if
   * defined. Set to `{}` otherwise. @see {@link Wunderbaum.types}
   */
  typeInfo: NodeTypeInfo;
}

export interface WbRenderEventType extends WbNodeEventType {
  /**
   * True if the node's markup was not yet created. In this case the render
   * event should create embeddeb input controls (in addition to update the
   * values according to to current node data).
   */
  isNew: boolean;
  /** True if the node only displays the title and is stretched over all remaining columns. */
  isColspan: boolean;
  // /** */
  // isDataChange: boolean;
  /** The node's `<span class='wb-node'>` element. */
  nodeElem: HTMLSpanElement;
  /**
   * Array of node's `<span class='wb-col'>` elements.
   * The first element is `<span class='wb-node wb-col'>`, which contains the
   * node title and icon (`idx: 0`, id: '*'`).
   */
  allColInfosById: ColumnEventInfos;
  /**
   * Array of node's `<span class='wb-node'>` elements, *that should be rendered*.
   * In contrast to `allColInfosById`, the node title is not part of this array.
   * If node.isColspan() is true, this array is empty (`[]`).
   */
  renderColInfosById: ColumnEventInfos;
}

/**
 * Contains the node's type information, i.e. `tree.types[node.type]` if
 * defined. @see {@link Wunderbaum.types}
 */
export type NodeTypeInfo = {
  icon?: string;
  classes?: string;
  // and more
  [key: string]: unknown;
};
export type NodeTypeInfos = { [type: string]: NodeTypeInfo };

/**
 * @see {@link `Wunderbaum.columns`}
 */
export interface ColumnDefinition {
  /** Column ID as defined in `tree.columns` definition ("*" for title column). */
  id: string;
  // /** */
  // idx: number;
  /** */
  title: string;
  /** e.g. '75px' or '*'. */
  width: string;
  /** e.g. '75px' or '*'. */
  minWidth?: string;
  /** Optional classes that are added to the column span. */
  classes?: string;
  /** Optional HTML code  that is rendered into the cell span. */
  html?: string;
  // Internal use:
  _weight?: number;
  _widthPx?: number;
  _ofsPx?: number;
}
export type ColumnDefinitions = Array<ColumnDefinition>;

export interface ColumnEventInfo {
  /** Column ID as defined in `tree.columns` definition ("*" for title column). */
  id: string;
  /** Column index (0: leftmost title column). */
  idx: number;
  /** The cell's `<span class='wb-col'>` element (null for plain trees). */
  elem: HTMLSpanElement | null;
  /** The value of `tree.columns[]` for the current index. */
  info: ColumnDefinition;
}
export type ColumnEventInfos = { [colId: string]: ColumnEventInfo };

export type WbTreeCallbackType = (e: WbTreeEventType) => any;
export type WbNodeCallbackType = (e: WbNodeEventType) => any;
export type WbRenderCallbackType = (e: WbRenderEventType) => void;

export type FilterModeType = null | "dim" | "hide";
export type ApplyCommandType =
  | "moveUp"
  | "moveDown"
  | "indent"
  | "outdent"
  | "remove"
  | "rename"
  | "addChild"
  | "addSibling"
  | "cut"
  | "copy"
  | "paste"
  | "down"
  | "first"
  | "last"
  | "left"
  | "pageDown"
  | "pageUp"
  | "parent"
  | "right"
  | "up";

export type NodeFilterResponse = "skip" | "branch" | boolean | void;
export type NodeFilterCallback = (node: WunderbaumNode) => NodeFilterResponse;
export type AddNodeType = "before" | "after" | "prependChild" | "appendChild";
export type DndModeType = "before" | "after" | "over";

/** Possible values for `setModified()`. */
export enum ChangeType {
  /** Re-render the whole viewport, headers, and all rows. */
  any = "any",
  /** Update current row title, icon, columns, and status. */
  data = "data",
  /** Redraw the header and update the width of all row columns. */
  header = "header",
  /** Re-render the whole current row. */
  row = "row",
  /** Alias for 'any'. */
  structure = "structure",
  /** Update current row's classes, to reflect active, selected, ... */
  status = "status",
  /** Update the 'top' property of all rows. */
  vscroll = "vscroll",
}

/** Possible values for `setStatus()`. */
export enum NodeStatusType {
  ok = "ok",
  loading = "loading",
  error = "error",
  noData = "noData",
  // paging = "paging",
}

/** Define the subregion of a node, where an event occurred. */
export enum TargetType {
  unknown = "",
  checkbox = "checkbox",
  column = "column",
  expander = "expander",
  icon = "icon",
  prefix = "prefix",
  title = "title",
}

/** Initial navigation mode and possible transition. */
export enum NavigationOptions {
  startRow = "startRow", // Start with row mode, but allow cell-nav mode
  cell = "cell", // Cell-nav mode only
  startCell = "startCell", // Start in cell-nav mode, but allow row mode
  row = "row", // Row mode only
}

// /** Tree's current navigation mode (see `tree.setNavigationMode()`). */
// export enum NavigationMode {
//   row = "row",
//   cellNav = "cellNav",
//   // cellEdit = "cellEdit",
// }

/** Possible values for `node.makeVisible()`. */
export interface MakeVisibleOptions {
  /** Do not animate expand (currently not implemented). @default false */
  noAnimation?: boolean;
  /** Scroll node into visible viewport area if required. @default true */
  scrollIntoView?: boolean;
  /** Do not send events. @default false */
  noEvents?: boolean;
}

/** Possible values for `node.scrollIntoView()`. */
export interface ScrollIntoViewOptions {
  /** Do not animate (currently not implemented). @default false */
  noAnimation?: boolean;
  /** Do not send events. @default false */
  noEvents?: boolean;
  /** Keep this node visible at the top in any case. */
  topNode?: WunderbaumNode;
}

/** Possible values for `tree.scrollTo()`. */
export interface ScrollToOptions extends ScrollIntoViewOptions {
  /** Which node to scroll into the viewport.*/
  node: WunderbaumNode;
}

/** Possible values for `node.setActive()`. */
export interface SetActiveOptions {
  /** Generate (de)activate event, even if node already has this status. */
  retrigger?: boolean;
  /** Do not generate (de)activate event. */
  noEvents?: boolean;
  /** Optional original event that will be passed to the (de)activate handler. */
  event?: Event;
  /** Call {@link setColumn}. */
  colIdx?: number;
}

/** Possible values for `node.setExpanded()`. */
export interface SetExpandedOptions {
  /** Ignore {@link minExpandLevel}. @default false */
  force?: boolean;
  /** Immediately update viewport (async otherwise). @default false */
  immediate?: boolean;
  /** Do not animate expand (currently not implemented). @default false */
  noAnimation?: boolean;
  /** Do not send events. @default false */
  noEvents?: boolean;
  /** Scroll up to bring expanded nodes into viewport. @default false */
  scrollIntoView?: boolean;
}

/** Possible values for `node.setSetModified()`. */
export interface SetModifiedOptions {
  /** Force immediate redraw instead of throttled/async mode. @default false */
  immediate?: boolean;
  /** Remove HTML markup of all rendered nodes before redraw. @default false */
  removeMarkup?: boolean;
}

/** Possible values for `node.setSelected()`. */
export interface SetSelectedOptions {
  /** Ignore restrictions. @default false */
  force?: boolean;
  /** Do not send events. @default false */
  noEvents?: boolean;
}

/** Possible values for `node.setSetModified()`. */
export interface SetStatusOptions {
  /** Displayed as status node title. */
  message?: string;
  /** Used as tooltip. */
  details?: string;
}

/* -----------------------------------------------------------------------------
 * wb_ext_dnd
 */
export type DropRegionType = "over" | "before" | "after";
export type DropRegionTypeSet = Set<DropRegionType>;
// type AllowedDropRegionType =
//   | "after"
//   | "afterBefore"
//   // | "afterBeforeOver" // == all == true
//   | "afterOver"
//   | "all" // == true
//   | "before"
//   | "beforeOver"
//   | "none" // == false == "" == null
//   | "over"; // == "child"

export type DndOptionsType = {
  /**
   * Expand nodes after n milliseconds of hovering
   * Default: 1500
   */
  autoExpandMS: 1500;
  // /**
  //  * Additional offset for drop-marker with hitMode = "before"/"after"
  //  * Default:
  //  */
  // dropMarkerInsertOffsetX: -16;
  // /**
  //  * Absolute position offset for .fancytree-drop-marker relatively to ..fancytree-title (icon/img near a node accepting drop)
  //  * Default:
  //  */
  // dropMarkerOffsetX: -24;
  // /**
  //  * Root Container used for drop marker (could be a shadow root)
  //  * (#1021 `document.body` is not available yet)
  //  * Default:
  //  */
  // dropMarkerParent: "body";
  /**
   * true: Drag multiple (i.e. selected) nodes. Also a callback() is allowed
   * Default: false
   */
  multiSource: false;
  /**
   * Restrict the possible cursor shapes and modifier operations (can also be set in the dragStart event)
   * Default: "all"
   */
  effectAllowed: "all";
  // /**
  //  * 'copy'|'link'|'move'|'auto'(calculate from `effectAllowed`+modifier keys) or callback(node, data) that returns such string.
  //  * Default:
  //  */
  // dropEffect: "auto";
  /**
   * Default dropEffect ('copy', 'link', or 'move') when no modifier is pressed (overide in dragDrag, dragOver).
   * Default: "move"
   */
  dropEffectDefault: string;
  /**
   * Prevent dropping nodes from different Wunderbaum trees
   * Default: false
   */
  preventForeignNodes: boolean;
  /**
   * Prevent dropping items on unloaded lazy Wunderbaum tree nodes
   * Default: true
   */
  preventLazyParents: boolean;
  /**
   * Prevent dropping items other than Wunderbaum tree nodes
   * Default: false
   */
  preventNonNodes: boolean;
  /**
   * Prevent dropping nodes on own descendants
   * Default: true
   */
  preventRecursion: boolean;
  /**
   * Prevent dropping nodes under same direct parent
   * Default: false
   */
  preventSameParent: false;
  /**
   * Prevent dropping nodes 'before self', etc. (move only)
   * Default: true
   */
  preventVoidMoves: boolean;
  /**
   * Enable auto-scrolling while dragging
   * Default: true
   */
  scroll: boolean;
  /**
   * Active top/bottom margin in pixel
   * Default: 20
   */
  scrollSensitivity: 20;
  /**
   * Pixel per event
   * Default: 5
   */
  scrollSpeed: 5;
  // /**
  //  * Allow dragging of nodes to different IE windows
  //  * Default: false
  //  */
  // setTextTypeJson: boolean;
  /**
   * Optional callback passed to `toDict` on dragStart @since 2.38
   * Default: null
   */
  sourceCopyHook: null;
  // Events (drag support)
  /**
   * Callback(sourceNode, data), return true, to enable dnd drag
   * Default: null
   */
  dragStart?: WbNodeEventType;
  /**
   * Callback(sourceNode, data)
   * Default: null
   */
  dragDrag: null;
  /**
   * Callback(sourceNode, data)
   * Default: null
   */
  dragEnd: null;
  // Events (drop support)
  /**
   * Callback(targetNode, data), return true, to enable dnd drop
   * Default: null
   */
  dragEnter: null;
  /**
   * Callback(targetNode, data)
   * Default: null
   */
  dragOver: null;
  /**
   * Callback(targetNode, data), return false to prevent autoExpand
   * Default: null
   */
  dragExpand: null;
  /**
   * Callback(targetNode, data)
   * Default: null
   */
  dragDrop: null;
  /**
   * Callback(targetNode, data)
   * Default: null
   */
  dragLeave: null;
};
