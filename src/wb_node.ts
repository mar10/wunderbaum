/*!
 * Wunderbaum - wunderbaum_node
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import "./wunderbaum.scss";
import * as util from "./util";

import { Wunderbaum } from "./wunderbaum";
import {
  NavigationMode,
  ChangeType,
  iconMap,
  ICON_WIDTH,
  KEY_TO_ACTION_DICT,
  makeNodeTitleMatcher,
  MatcherType,
  NodeAnyCallback,
  NodeStatusType,
  NodeVisitCallback,
  NodeVisitResponse,
  ROW_EXTRA_PAD,
  ROW_HEIGHT,
  TEST_IMG,
  ApplyCommandType,
  AddNodeType,
  SetActiveOptions,
  SetExpandedOptions,
  SetSelectedOptions,
} from "./common";
import { Deferred } from "./deferred";
import { WbNodeData } from "./wb_options";

/** Top-level properties that can be passed with `data`. */
const NODE_PROPS = new Set<string>([
  // TODO: use NODE_ATTRS instead?
  "classes",
  "expanded",
  "icon",
  "key",
  "lazy",
  "refKey",
  "selected",
  "title",
  "tooltip",
  "type",
]);

const NODE_ATTRS = new Set<string>([
  "checkbox",
  "expanded",
  "extraClasses", // TODO: rename to classes
  "folder",
  "icon",
  "iconTooltip",
  "key",
  "lazy",
  "partsel",
  "radiogroup",
  "refKey",
  "selected",
  "statusNodeType",
  "title",
  "tooltip",
  "type",
  "unselectable",
  "unselectableIgnore",
  "unselectableStatus",
]);

/**
 * A single tree node.
 *
 * **NOTE:** <br>
 * Generally you should not modify properties directly, since this may break
 * the internal bookkeeping.
 */
export class WunderbaumNode {
  static sequence = 0;

  /** Reference to owning tree. */
  public tree: Wunderbaum;
  /** Parent node (null for the invisible root node `tree.root`). */
  public parent: WunderbaumNode;
  /** Name of the node.
   * @see Use {@link setTitle} to modify. */
  public title: string;
  /** Unique key. Passed with constructor or defaults to `SEQUENCE`.
   * @see Use {@link setKey} to modify. */
  public readonly key: string;
  /** Reference key. Unlike {@link key}, a `refKey` may occur multiple
   * times within a tree (in this case we have 'clone nodes').
   * @see Use {@link setKey} to modify.
   */
  public readonly refKey: string | undefined = undefined;
  public children: WunderbaumNode[] | null = null;
  public checkbox?: boolean;
  public colspan?: boolean;
  public icon?: boolean | string;
  public lazy: boolean = false;
  /** Expansion state.
   * @see {@link isExpandable}, {@link isExpanded}, {@link setExpanded}. */
  public expanded: boolean = false;
  /** Selection state.
   * @see {@link isSelected}, {@link setSelected}. */
  public selected: boolean = false;
  public type?: string;
  public tooltip?: string;
  /** Additional classes added to `div.wb-row`.
   * @see {@link addClass}, {@link removeClass}, {@link toggleClass}. */
  public extraClasses = new Set<string>();
  /** Custom data that was passed to the constructor */
  public data: any = {};
  // --- Node Status ---
  public statusNodeType?: string;
  _isLoading = false;
  _requestId = 0;
  _errorInfo: any | null = null;
  _partsel = false;
  _partload = false;
  // --- FILTER ---
  public match?: boolean; // Added and removed by filter code
  public subMatchCount?: number = 0;
  public subMatchBadge?: HTMLElement;
  /** @internal */
  public titleWithHighlight?: string;
  public _filterAutoExpanded?: boolean;

  _rowIdx: number | undefined = 0;
  _rowElem: HTMLDivElement | undefined = undefined;

  constructor(tree: Wunderbaum, parent: WunderbaumNode, data: any) {
    util.assert(!parent || parent.tree === tree);
    util.assert(!data.children);
    this.tree = tree;
    this.parent = parent;
    this.key = "" + (data.key ?? ++WunderbaumNode.sequence);
    this.title = "" + (data.title ?? "<" + this.key + ">");

    data.refKey != null ? (this.refKey = "" + data.refKey) : 0;
    data.statusNodeType != null
      ? (this.statusNodeType = "" + data.statusNodeType)
      : 0;
    data.type != null ? (this.type = "" + data.type) : 0;
    data.checkbox != null ? (this.checkbox = !!data.checkbox) : 0;
    data.colspan != null ? (this.colspan = !!data.colspan) : 0;
    this.expanded = data.expanded === true;
    data.icon != null ? (this.icon = data.icon) : 0;
    this.lazy = data.lazy === true;
    this.selected = data.selected === true;
    if (data.classes) {
      for (const c of data.classes.split(" ")) {
        this.extraClasses.add(c.trim());
      }
    }
    // Store custom fields as `node.data`
    for (const [key, value] of Object.entries(data)) {
      if (!NODE_PROPS.has(key)) {
        this.data[key] = value;
      }
    }

    if (parent && !this.statusNodeType) {
      // Don't register root node or status nodes
      tree._registerNode(this);
    }
  }

  /**
   * Return readable string representation for this instance.
   * @internal
   */
  toString() {
    return `WunderbaumNode@${this.key}<'${this.title}'>`;
  }

  // /** Return an option value. */
  // protected _getOpt(
  //   name: string,
  //   nodeObject: any = null,
  //   treeOptions: any = null,
  //   defaultValue: any = null
  // ): any {
  //   return evalOption(
  //     name,
  //     this,
  //     nodeObject || this,
  //     treeOptions || this.tree.options,
  //     defaultValue
  //   );
  // }

  /** Call event handler if defined in tree.options.
   * Example:
   * ```js
   * node._callEvent("edit.beforeEdit", {foo: 42})
   * ```
   */
  _callEvent(type: string, extra?: any): any {
    return this.tree._callEvent(
      type,
      util.extend(
        {
          node: this,
          typeInfo: this.type ? this.tree.types[this.type] : {},
        },
        extra
      )
    );
  }

  /**
   * Append (or insert) a list of child nodes.
   *
   * Tip: pass `{ before: 0 }` to prepend children
   * @param {NodeData[]} nodeData array of child node definitions (also single child accepted)
   * @param  child node (or key or index of such).
   *     If omitted, the new children are appended.
   * @returns first child added
   */
  addChildren(nodeData: any, options?: any): WunderbaumNode {
    let insertBefore: WunderbaumNode | string | number = options
        ? options.before
        : null,
      // redraw = options ? options.redraw !== false : true,
      nodeList = [];

    try {
      this.tree.enableUpdate(false);

      if (util.isPlainObject(nodeData)) {
        nodeData = [nodeData];
      }
      for (let child of nodeData) {
        let subChildren = child.children;
        delete child.children;

        let n = new WunderbaumNode(this.tree, this, child);
        nodeList.push(n);
        if (subChildren) {
          n.addChildren(subChildren, { redraw: false });
        }
      }

      if (!this.children) {
        this.children = nodeList;
      } else if (insertBefore == null || this.children.length === 0) {
        this.children = this.children.concat(nodeList);
      } else {
        // Returns null if insertBefore is not a direct child:
        insertBefore = this.findDirectChild(insertBefore)!;
        let pos = this.children.indexOf(insertBefore);
        util.assert(pos >= 0, "insertBefore must be an existing child");
        // insert nodeList after children[pos]
        this.children.splice(pos, 0, ...nodeList);
      }
      // TODO:
      // if (this.tree.options.selectMode === 3) {
      //   this.fixSelection3FromEndNodes();
      // }
      // this.triggerModifyChild("add", nodeList.length === 1 ? nodeList[0] : null);
      this.tree.setModified(ChangeType.structure);
      return nodeList[0];
    } finally {
      this.tree.enableUpdate(true);
    }
  }

  /**
   * Append or prepend a node, or append a child node.
   *
   * This a convenience function that calls addChildren()
   *
   * @param {NodeData} node node definition
   * @param [mode=child] 'before', 'after', 'firstChild', or 'child' ('over' is a synonym for 'child')
   * @returns new node
   */
  addNode(nodeData: WbNodeData, mode = "child"): WunderbaumNode {
    if (mode === "over") {
      mode = "child"; // compatible with drop region
    }
    switch (mode) {
      case "after":
        return this.parent.addChildren(nodeData, {
          before: this.getNextSibling(),
        });
      case "before":
        return this.parent.addChildren(nodeData, { before: this });
      case "firstChild":
        // Insert before the first child if any
        // let insertBefore = this.children ? this.children[0] : undefined;
        return this.addChildren(nodeData, { before: 0 });
      case "child":
        return this.addChildren(nodeData);
    }
    util.assert(false, "Invalid mode: " + mode);
    return (<unknown>undefined) as WunderbaumNode;
  }

  /**
   * Apply a modification (or navigation) operation.
   *
   * @see {@link Wunderbaum.applyCommand}
   */
  applyCommand(cmd: ApplyCommandType, opts: any): any {
    return this.tree.applyCommand(cmd, this, opts);
  }

  addClass(className: string | string[] | Set<string>) {
    const cnSet = util.toSet(className);
    cnSet.forEach((cn) => {
      this.extraClasses.add(cn);
      this._rowElem?.classList.add(cn);
    });
  }

  removeClass(className: string | string[] | Set<string>) {
    const cnSet = util.toSet(className);
    cnSet.forEach((cn) => {
      this.extraClasses.delete(cn);
      this._rowElem?.classList.remove(cn);
    });
  }

  toggleClass(className: string | string[] | Set<string>, flag: boolean) {
    const cnSet = util.toSet(className);
    cnSet.forEach((cn) => {
      flag ? this.extraClasses.add(cn) : this.extraClasses.delete(cn);
      this._rowElem?.classList.toggle(cn, flag);
    });
  }

  /** */
  async expandAll(flag: boolean = true) {
    this.visit((node) => {
      node.setExpanded(flag);
    });
  }

  /**Find all nodes that match condition (excluding self).
   *
   * @param {string | function(node)} match title string to search for, or a
   *     callback function that returns `true` if a node is matched.
   */
  findAll(match: string | MatcherType): WunderbaumNode[] {
    const matcher = util.isFunction(match)
      ? <MatcherType>match
      : makeNodeTitleMatcher(<string>match);
    const res: WunderbaumNode[] = [];
    this.visit((n) => {
      if (matcher(n)) {
        res.push(n);
      }
    });
    return res;
  }

  /** Return the direct child with a given key, index or null. */
  findDirectChild(
    ptr: number | string | WunderbaumNode
  ): WunderbaumNode | null {
    let cl = this.children;

    if (!cl) return null;
    if (typeof ptr === "string") {
      for (let i = 0, l = cl.length; i < l; i++) {
        if (cl[i].key === ptr) {
          return cl[i];
        }
      }
    } else if (typeof ptr === "number") {
      return cl[ptr];
    } else if (ptr.parent === this) {
      // Return null if `ptr` is not a direct child
      return ptr;
    }
    return null;
  }

  /**Find first node that matches condition (excluding self).
   *
   * @param match title string to search for, or a
   *     callback function that returns `true` if a node is matched.
   */
  findFirst(match: string | MatcherType): WunderbaumNode | null {
    const matcher = util.isFunction(match)
      ? <MatcherType>match
      : makeNodeTitleMatcher(<string>match);
    let res = null;
    this.visit((n) => {
      if (matcher(n)) {
        res = n;
        return false;
      }
    });
    return res;
  }

  /** Find a node relative to self.
   *
   * @see {@link Wunderbaum.findRelatedNode|tree.findRelatedNode()}
   */
  findRelatedNode(where: string, includeHidden = false) {
    return this.tree.findRelatedNode(this, where, includeHidden);
  }

  /** Return the `<span class='wb-col'>` element with a given index or id.
   * @returns {WunderbaumNode | null}
   */
  getColElem(colIdx: number | string) {
    if (typeof colIdx === "string") {
      colIdx = this.tree.columns.findIndex((value) => value.id === colIdx);
    }
    const colElems = this._rowElem?.querySelectorAll("span.wb-col");
    return colElems ? (colElems[colIdx] as HTMLSpanElement) : null;
  }

  /** Return the first child node or null.
   * @returns {WunderbaumNode | null}
   */
  getFirstChild() {
    return this.children ? this.children[0] : null;
  }

  /** Return the last child node or null.
   * @returns {WunderbaumNode | null}
   */
  getLastChild() {
    return this.children ? this.children[this.children.length - 1] : null;
  }

  /** Return node depth (starting with 1 for top level nodes). */
  getLevel(): number {
    let i = 0,
      p = this.parent;

    while (p) {
      i++;
      p = p.parent;
    }
    return i;
  }

  /** Return the successive node (under the same parent) or null. */
  getNextSibling(): WunderbaumNode | null {
    let ac = this.parent.children!;
    let idx = ac.indexOf(this);
    return ac[idx + 1] || null;
  }

  /** Return the parent node (null for the system root node). */
  getParent(): WunderbaumNode | null {
    // TODO: return null for top-level nodes?
    return this.parent;
  }

  /** Return an array of all parent nodes (top-down).
   * @param includeRoot Include the invisible system root node.
   * @param includeSelf Include the node itself.
   */
  getParentList(includeRoot = false, includeSelf = false) {
    let l = [],
      dtn = includeSelf ? this : this.parent;
    while (dtn) {
      if (includeRoot || dtn.parent) {
        l.unshift(dtn);
      }
      dtn = dtn.parent;
    }
    return l;
  }
  /** Return a string representing the hierachical node path, e.g. "a/b/c".
   * @param includeSelf
   * @param node property name or callback
   * @param separator
   */
  getPath(
    includeSelf = true,
    part: keyof WunderbaumNode | NodeAnyCallback = "title",
    separator = "/"
  ) {
    // includeSelf = includeSelf !== false;
    // part = part || "title";
    // separator = separator || "/";

    let val,
      path: string[] = [],
      isFunc = typeof part === "function";

    this.visitParents((n) => {
      if (n.parent) {
        val = isFunc
          ? (<NodeAnyCallback>part)(n)
          : n[<keyof WunderbaumNode>part];
        path.unshift(val);
      }
      return undefined; // TODO remove this line
    }, includeSelf);
    return path.join(separator);
  }

  /** Return the preceeding node (under the same parent) or null. */
  getPrevSibling(): WunderbaumNode | null {
    let ac = this.parent.children!;
    let idx = ac.indexOf(this);
    return ac[idx - 1] || null;
  }

  /** Return true if node has children.
   * Return undefined if not sure, i.e. the node is lazy and not yet loaded.
   */
  hasChildren() {
    if (this.lazy) {
      if (this.children == null) {
        return undefined; // null or undefined: Not yet loaded
      } else if (this.children.length === 0) {
        return false; // Loaded, but response was empty
      } else if (
        this.children.length === 1 &&
        this.children[0].isStatusNode()
      ) {
        return undefined; // Currently loading or load error
      }
      return true; // One or more child nodes
    }
    return !!(this.children && this.children.length);
  }

  /** Return true if this node is the currently active tree node. */
  isActive() {
    return this.tree.activeNode === this;
  }

  /** Return true if this node is a *direct* child of `other`.
   * (See also [[isDescendantOf]].)
   */
  isChildOf(other: WunderbaumNode) {
    return this.parent && this.parent === other;
  }

  /** Return true if this node is a direct or indirect sub node of `other`.
   * (See also [[isChildOf]].)
   */
  isDescendantOf(other: WunderbaumNode) {
    if (!other || other.tree !== this.tree) {
      return false;
    }
    var p = this.parent;
    while (p) {
      if (p === other) {
        return true;
      }
      if (p === p.parent) {
        util.error("Recursive parent link: " + p);
      }
      p = p.parent;
    }
    return false;
  }

  /** Return true if this node has children, i.e. the node is generally expandable.
   * If `andCollapsed` is set, we also check if this node is collapsed, i.e.
   * an expand operation is currently possible.
   */
  isExpandable(andCollapsed = false): boolean {
    return !!this.children && (!this.expanded || !andCollapsed);
  }

  /** Return true if this node is currently in edit-title mode. */
  isEditing(): boolean {
    return this.tree._callMethod("edit.isEditingTitle", this);
  }

  /** Return true if this node is currently expanded. */
  isExpanded(): boolean {
    return !!this.expanded;
  }

  /** Return true if this node is the first node of its parent's children. */
  isFirstSibling(): boolean {
    var p = this.parent;
    return !p || p.children![0] === this;
  }

  /** Return true if this node is the last node of its parent's children. */
  isLastSibling(): boolean {
    var p = this.parent;
    return !p || p.children![p.children!.length - 1] === this;
  }

  /** Return true if this node is lazy (even if data was already loaded) */
  isLazy(): boolean {
    return !!this.lazy;
  }

  /** Return true if node is lazy and loaded. For non-lazy nodes always return true. */
  isLoaded(): boolean {
    return !this.lazy || this.hasChildren() !== undefined; // Also checks if the only child is a status node
  }

  /** Return true if node is currently loading, i.e. a GET request is pending. */
  isLoading(): boolean {
    return this._isLoading;
  }

  /** Return true if this node is a temporarily generated status node of type 'paging'. */
  isPagingNode(): boolean {
    return this.statusNodeType === "paging";
  }

  /** (experimental) Return true if this node is partially loaded. */
  isPartload(): boolean {
    return !!this._partload;
  }

  /** Return true if this node is partially selected (tri-state). */
  isPartsel(): boolean {
    return !this.selected && !!this._partsel;
  }

  /** Return true if this node has DOM representaion, i.e. is displayed in the viewport. */
  isRendered(): boolean {
    return !!this._rowElem;
  }

  /** Return true if this node is the (invisible) system root node.
   * (See also [[isTopLevel()]].)
   */
  isRootNode(): boolean {
    return this.tree.root === this;
  }

  /** Return true if this node is selected, i.e. the checkbox is set. */
  isSelected(): boolean {
    return !!this.selected;
  }

  /** Return true if this node is a temporarily generated system node like
   * 'loading', 'paging', or 'error' (node.statusNodeType contains the type).
   */
  isStatusNode(): boolean {
    return !!this.statusNodeType;
  }

  /** Return true if this a top level node, i.e. a direct child of the (invisible) system root node. */
  isTopLevel(): boolean {
    return this.tree.root === this.parent;
  }

  /** Return true if node is marked lazy but not yet loaded.
   * For non-lazy nodes always return false.
   */
  isUnloaded(): boolean {
    // Also checks if the only child is a status node:
    return this.hasChildren() === undefined;
  }

  /** Return true if all parent nodes are expanded. Note: this does not check
   * whether the node is scrolled into the visible part of the screen or viewport.
   */
  isVisible(): boolean {
    let i,
      l,
      n,
      hasFilter = this.tree.filterMode === "hide",
      parents = this.getParentList(false, false);

    // TODO: check $(n.span).is(":visible")
    // i.e. return false for nodes (but not parents) that are hidden
    // by a filter
    if (hasFilter && !this.match && !this.subMatchCount) {
      // this.debug( "isVisible: HIDDEN (" + hasFilter + ", " + this.match + ", " + this.match + ")" );
      return false;
    }

    for (i = 0, l = parents.length; i < l; i++) {
      n = parents[i];

      if (!n.expanded) {
        // this.debug("isVisible: HIDDEN (parent collapsed)");
        return false;
      }
      // if (hasFilter && !n.match && !n.subMatchCount) {
      // 	this.debug("isVisible: HIDDEN (" + hasFilter + ", " + this.match + ", " + this.match + ")");
      // 	return false;
      // }
    }
    // this.debug("isVisible: VISIBLE");
    return true;
  }

  protected _loadSourceObject(source: any) {
    const tree = this.tree;

    // Let caller modify the parsed JSON response:
    this._callEvent("receive", { response: source });

    if (util.isArray(source)) {
      source = { children: source };
    }
    util.assert(util.isPlainObject(source));
    util.assert(
      source.children,
      "If `source` is an object, it must have a `children` property"
    );
    if (source.types) {
      tree.setTypes(source.types, false);
    }
    if (source.columns) {
      tree.columns = source.columns;
      tree.updateColumns({ calculateCols: false });
    }

    this.addChildren(source.children);

    this._callEvent("load");
  }

  /** Download  data from the cloud, then call `.update()`. */
  async load(source: any) {
    const tree = this.tree;
    // const opts = tree.options;
    const requestId = Date.now();
    const prevParent = this.parent;
    const url = typeof source === "string" ? source : source.url;

    // Check for overlapping requests
    if (this._requestId) {
      this.logWarn(
        `Recursive load request #${requestId} while #${this._requestId} is pending.`
      );
      // 	node.debug("Send load request #" + requestId);
    }
    this._requestId = requestId;

    const timerLabel = tree.logTime(this + ".load()");

    try {
      if (!url) {
        this._loadSourceObject(source);
      } else {
        this.setStatus(NodeStatusType.loading);
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) {
          util.error(`GET ${url} returned ${response.status}, ${response}`);
        }
        const data = await response.json();

        if (this._requestId && this._requestId > requestId) {
          this.logWarn(
            `Ignored load response #${requestId} because #${this._requestId} is pending.`
          );
          return;
        } else {
          this.logDebug(`Received response for load request #${requestId}`);
        }
        if (this.parent === null && prevParent !== null) {
          this.logWarn(
            "Lazy parent node was removed while loading: discarding response."
          );
          return;
        }
        this.setStatus(NodeStatusType.ok);
        if (data.columns) {
          tree.logInfo("Re-define columns", data.columns);
          util.assert(!this.parent);
          tree.columns = data.columns;
          delete data.columns;
          tree.updateColumns({ calculateCols: false });
        }
        this._loadSourceObject(data);
      }
    } catch (error) {
      this.logError("Error during load()", source, error);
      this._callEvent("error", { error: error });
      this.setStatus(NodeStatusType.error, "" + error);
      throw error;
    } finally {
      this._requestId = 0;
      tree.logTimeEnd(timerLabel);
    }
  }

  /**Load content of a lazy node. */
  async loadLazy(forceReload = false) {
    const wasExpanded = this.expanded;

    util.assert(this.lazy, "load() requires a lazy node");
    // _assert( forceReload || this.isUndefined(), "Pass forceReload=true to re-load a lazy node" );
    if (!forceReload && !this.isUnloaded()) {
      return;
    }
    if (this.isLoaded()) {
      this.resetLazy(); // Also collapses if currently expanded
    }
    // `lazyLoad` may be long-running, so mark node as loading now. `this.load()`
    // will reset the status later.
    this.setStatus(NodeStatusType.loading);
    try {
      const source = await this._callEvent("lazyLoad");
      if (source === false) {
        this.setStatus(NodeStatusType.ok);
        return;
      }
      util.assert(
        util.isArray(source) || (source && source.url),
        "The lazyLoad event must return a node list, `{url: ...}`, or false."
      );

      await this.load(source); // also calls setStatus('ok')

      if (wasExpanded) {
        this.expanded = true;
        this.tree.setModified(ChangeType.structure);
      } else {
        this.setModified(); // Fix expander icon to 'loaded'
      }
    } catch (e) {
      this.logError("Error during loadLazy()", e);
      this._callEvent("error", { error: e });
      this.setStatus(NodeStatusType.error, "" + e);
    }
    return;
  }

  /** Alias for `logDebug` */
  log(...args: any[]) {
    this.logDebug.apply(this, args);
  }

  /* Log to console if opts.debugLevel >= 4 */
  logDebug(...args: any[]) {
    if (this.tree.options.debugLevel >= 4) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }

  /* Log error to console. */
  logError(...args: any[]) {
    if (this.tree.options.debugLevel >= 1) {
      Array.prototype.unshift.call(args, this.toString());
      console.error.apply(console, args);
    }
  }

  /* Log to console if opts.debugLevel >= 3 */
  logInfo(...args: any[]) {
    if (this.tree.options.debugLevel >= 3) {
      Array.prototype.unshift.call(args, this.toString());
      console.info.apply(console, args);
    }
  }

  /* Log warning to console if opts.debugLevel >= 2 */
  logWarn(...args: any[]) {
    if (this.tree.options.debugLevel >= 2) {
      Array.prototype.unshift.call(args, this.toString());
      console.warn.apply(console, args);
    }
  }

  /** Expand all parents and optionally scroll into visible area as neccessary.
   * Promise is resolved, when lazy loading and animations are done.
   * @param {object} [opts] passed to `setExpanded()`.
   *     Defaults to {noAnimation: false, noEvents: false, scrollIntoView: true}
   */
  async makeVisible(opts: any) {
    let i,
      dfd = new Deferred(),
      deferreds = [],
      parents = this.getParentList(false, false),
      len = parents.length,
      effects = !(opts && opts.noAnimation === true),
      scroll = !(opts && opts.scrollIntoView === false);

    // Expand bottom-up, so only the top node is animated
    for (i = len - 1; i >= 0; i--) {
      // self.debug("pushexpand" + parents[i]);
      deferreds.push(parents[i].setExpanded(true, opts));
    }
    Promise.all(deferreds).then(() => {
      // All expands have finished
      // self.debug("expand DONE", scroll);
      if (scroll) {
        this.scrollIntoView(effects).then(() => {
          // self.debug("scroll DONE");
          dfd.resolve();
        });
      } else {
        dfd.resolve();
      }
    });
    return dfd.promise();
  }

  /** Move this node to targetNode. */
  moveTo(
    targetNode: WunderbaumNode,
    mode: AddNodeType = "appendChild",
    map?: NodeAnyCallback
  ) {
    if (mode === "prependChild") {
      if (targetNode.children && targetNode.children.length) {
        mode = "before";
        targetNode = targetNode.children[0];
      } else {
        mode = "appendChild";
      }
    }
    let pos,
      tree = this.tree,
      prevParent = this.parent,
      targetParent = mode === "appendChild" ? targetNode : targetNode.parent;

    if (this === targetNode) {
      return;
    } else if (!this.parent) {
      util.error("Cannot move system root");
    } else if (targetParent.isDescendantOf(this)) {
      util.error("Cannot move a node to its own descendant");
    }
    if (targetParent !== prevParent) {
      prevParent.triggerModifyChild("remove", this);
    }
    // Unlink this node from current parent
    if (this.parent.children!.length === 1) {
      if (this.parent === targetParent) {
        return; // #258
      }
      this.parent.children = this.parent.lazy ? [] : null;
      this.parent.expanded = false;
    } else {
      pos = this.parent.children!.indexOf(this);
      util.assert(pos >= 0, "invalid source parent");
      this.parent.children!.splice(pos, 1);
    }

    // Insert this node to target parent's child list
    this.parent = targetParent;
    if (targetParent.hasChildren()) {
      switch (mode) {
        case "appendChild":
          // Append to existing target children
          targetParent.children!.push(this);
          break;
        case "before":
          // Insert this node before target node
          pos = targetParent.children!.indexOf(targetNode);
          util.assert(pos >= 0, "invalid target parent");
          targetParent.children!.splice(pos, 0, this);
          break;
        case "after":
          // Insert this node after target node
          pos = targetParent.children!.indexOf(targetNode);
          util.assert(pos >= 0, "invalid target parent");
          targetParent.children!.splice(pos + 1, 0, this);
          break;
        default:
          util.error("Invalid mode " + mode);
      }
    } else {
      targetParent.children = [this];
    }

    // Let caller modify the nodes
    if (map) {
      targetNode.visit(map, true);
    }
    if (targetParent === prevParent) {
      targetParent.triggerModifyChild("move", this);
    } else {
      // prevParent.triggerModifyChild("remove", this);
      targetParent.triggerModifyChild("add", this);
    }
    // Handle cross-tree moves
    if (tree !== targetNode.tree) {
      // Fix node.tree for all source nodes
      // 	util.assert(false, "Cross-tree move is not yet implemented.");
      this.logWarn("Cross-tree moveTo is experimental!");
      this.visit(function (n) {
        // TODO: fix selection state and activation, ...
        n.tree = targetNode.tree;
      }, true);
    }

    tree.setModified(ChangeType.structure);
    // TODO: fix selection state
    // TODO: fix active state
  }

  /** Set focus relative to this node and optionally activate.
   *
   * 'left' collapses the node if it is expanded, or move to the parent
   * otherwise.
   * 'right' expands the node if it is collapsed, or move to the first
   * child otherwise.
   *
   * @param where 'down', 'first', 'last', 'left', 'parent', 'right', or 'up'.
   *   (Alternatively the `event.key` that would normally trigger this move,
   *   e.g. `ArrowLeft` = 'left'.
   * @param options
   */
  async navigate(where: string, options?: any) {
    // Allow to pass 'ArrowLeft' instead of 'left'
    where = KEY_TO_ACTION_DICT[where] || where;

    // Otherwise activate or focus the related node
    const node = this.findRelatedNode(where);
    if (!node) {
      this.logWarn(`Could not find related node '${where}'.`);
      return Promise.resolve(this);
    }
    // setFocus/setActive will scroll later (if autoScroll is specified)
    try {
      node.makeVisible({ scrollIntoView: false });
    } catch (e) {} // #272
    node.setFocus();
    if (options?.activate === false) {
      return Promise.resolve(this);
    }
    return node.setActive(true, { event: options?.event });
  }

  /** Delete this node and all descendants. */
  remove() {
    const tree = this.tree;
    const pos = this.parent.children!.indexOf(this);
    this.triggerModify("remove");
    this.parent.children!.splice(pos, 1);
    this.visit((n) => {
      n.removeMarkup();
      tree._unregisterNode(n);
    }, true);
    tree.setModified(ChangeType.structure);
  }

  /** Remove all descendants of this node. */
  removeChildren() {
    const tree = this.tree;

    if (!this.children) {
      return;
    }
    if (tree.activeNode && tree.activeNode.isDescendantOf(this)) {
      tree.activeNode.setActive(false); // TODO: don't fire events
    }
    if (tree.focusNode && tree.focusNode.isDescendantOf(this)) {
      tree.focusNode = null;
    }
    // TODO: persist must take care to clear select and expand cookies
    // Unlink children to support GC
    // TODO: also delete this.children (not possible using visit())
    this.triggerModifyChild("remove", null);
    this.visit((n) => {
      tree._unregisterNode(n);
    });
    if (this.lazy) {
      // 'undefined' would be interpreted as 'not yet loaded' for lazy nodes
      this.children = [];
    } else {
      this.children = null;
    }
    // util.assert(this.parent); // don't call this for root node
    if (!this.isRootNode()) {
      this.expanded = false;
    }
    this.tree.setModified(ChangeType.structure);
  }

  /** Remove all HTML markup from the DOM. */
  removeMarkup() {
    if (this._rowElem) {
      delete (<any>this._rowElem)._wb_node;
      this._rowElem.remove();
      this._rowElem = undefined;
    }
  }

  protected _getRenderInfo() {
    let colInfosById: { [key: string]: any } = {};
    let idx = 0;
    let colElems = this._rowElem
      ? ((<unknown>(
          this._rowElem.querySelectorAll("span.wb-col")
        )) as HTMLElement[])
      : null;

    for (let col of this.tree.columns) {
      colInfosById[col.id] = {
        id: col.id,
        idx: idx,
        elem: colElems ? colElems[idx] : null,
        info: col,
      };
      idx++;
    }
    return colInfosById;
  }

  protected _createIcon(
    parentElem: HTMLElement,
    replaceChild?: HTMLElement
  ): HTMLElement | null {
    let iconSpan;
    let icon = this.getOption("icon");
    if (this._errorInfo) {
      icon = iconMap.error;
    } else if (this._isLoading) {
      icon = iconMap.loading;
    }
    if (icon === false) {
      return null;
    }
    if (typeof icon === "string") {
      // Callback returned an icon definition
      // icon = icon.trim()
    } else if (this.statusNodeType) {
      icon = (<any>iconMap)[this.statusNodeType];
    } else if (this.expanded) {
      icon = iconMap.folderOpen;
    } else if (this.children) {
      icon = iconMap.folder;
    } else {
      icon = iconMap.doc;
    }

    // this.log("_createIcon: " + icon);
    if (icon.indexOf("<") >= 0) {
      // HTML
      iconSpan = util.elemFromHtml(icon);
    } else if (TEST_IMG.test(icon)) {
      // Image URL
      iconSpan = util.elemFromHtml(`<img src="${icon}" class="wb-icon">`);
    } else {
      // Class name
      iconSpan = document.createElement("i");
      iconSpan.className = "wb-icon " + icon;
    }
    if (replaceChild) {
      parentElem.replaceChild(iconSpan, replaceChild);
    } else {
      parentElem.appendChild(iconSpan);
    }
    // this.log("_createIcon: ", iconSpan);
    return iconSpan;
  }

  /**
   * Create a whole new `<div class="wb-row">` element.
   * @see {@link Wunderbaumode.render}
   */
  protected _render_markup(opts: any) {
    const tree = this.tree;
    const treeOptions = tree.options;
    const checkbox = this.getOption("checkbox") !== false;
    const columns = tree.columns;
    const level = this.getLevel();
    let elem: HTMLElement;
    let nodeElem: HTMLElement;
    let rowDiv = this._rowElem;
    let titleSpan: HTMLElement;
    let checkboxSpan: HTMLElement | null = null;
    let iconSpan: HTMLElement | null;
    let expanderSpan: HTMLElement | null = null;
    const activeColIdx =
      tree.navMode === NavigationMode.row ? null : tree.activeColIdx;

    const isNew = !rowDiv;
    util.assert(isNew);
    util.assert(
      !isNew || (opts && opts.after),
      "opts.after expected, unless updating"
    );
    util.assert(!this.isRootNode());

    rowDiv = document.createElement("div");
    rowDiv.classList.add("wb-row");

    rowDiv.style.top = this._rowIdx! * ROW_HEIGHT + "px";

    this._rowElem = rowDiv;

    // Attach a node reference to the DOM Element:
    (<any>rowDiv)._wb_node = this;

    nodeElem = document.createElement("span");
    nodeElem.classList.add("wb-node", "wb-col");
    rowDiv.appendChild(nodeElem);

    let ofsTitlePx = 0;

    if (checkbox) {
      checkboxSpan = document.createElement("i");
      checkboxSpan.classList.add("wb-checkbox");
      nodeElem.appendChild(checkboxSpan);
      ofsTitlePx += ICON_WIDTH;
    }

    for (let i = level - 1; i > 0; i--) {
      elem = document.createElement("i");
      elem.classList.add("wb-indent");
      nodeElem.appendChild(elem);
      ofsTitlePx += ICON_WIDTH;
    }

    if (!treeOptions.minExpandLevel || level > treeOptions.minExpandLevel) {
      expanderSpan = document.createElement("i");
      expanderSpan.classList.add("wb-expander");
      nodeElem.appendChild(expanderSpan);
      ofsTitlePx += ICON_WIDTH;
    }

    iconSpan = this._createIcon(nodeElem);
    if (iconSpan) {
      ofsTitlePx += ICON_WIDTH;
    }

    titleSpan = document.createElement("span");
    titleSpan.classList.add("wb-title");
    nodeElem.appendChild(titleSpan);

    this._callEvent("enhanceTitle", { titleSpan: titleSpan });

    // Store the width of leading icons with the node, so we can calculate
    // the width of the embedded title span later
    (<any>nodeElem)._ofsTitlePx = ofsTitlePx;

    // Support HTML5 drag-n-drop
    if (tree.options.dnd!.dragStart) {
      nodeElem.draggable = true;
    }

    // Render columns
    if (!this.colspan && columns.length > 1) {
      let colIdx = 0;
      for (let col of columns) {
        colIdx++;

        let colElem;
        if (col.id === "*") {
          colElem = nodeElem;
        } else {
          colElem = document.createElement("span");
          colElem.classList.add("wb-col");
          rowDiv.appendChild(colElem);
        }
        if (colIdx === activeColIdx) {
          colElem.classList.add("wb-active");
        }
        // Add classes from `columns` definition to `<div.wb-col>` cells
        col.classes ? colElem.classList.add(...col.classes.split(" ")) : 0;

        colElem.style.left = col._ofsPx + "px";
        colElem.style.width = col._widthPx + "px";
        if (isNew && col.html) {
          if (typeof col.html === "string") {
            colElem.innerHTML = col.html;
          }
        }
      }
    }

    // Now go on and fill in data and update classes
    opts.isNew = true;
    this._render_data(opts);

    // Attach to DOM as late as possible
    const after = opts ? opts.after : "last";
    switch (after) {
      case "first":
        tree.nodeListElement.prepend(rowDiv);
        break;
      case "last":
        tree.nodeListElement.appendChild(rowDiv);
        break;
      default:
        opts.after.after(rowDiv);
    }
  }

  /**
   * Render `node.title`, `.icon` into an existing row.
   *
   * @see {@link Wunderbaumode.render}
   */
  protected _render_data(opts: any) {
    util.assert(this._rowElem);

    const tree = this.tree;
    const treeOptions = tree.options;
    const rowDiv = this._rowElem!;
    const isNew = !!opts.isNew; // Called by _render_markup()?
    const columns = tree.columns;
    const typeInfo = this.type ? tree.types[this.type] : null;

    // Row markup already exists
    const nodeElem = rowDiv.querySelector("span.wb-node") as HTMLSpanElement;
    const titleSpan = nodeElem.querySelector(
      "span.wb-title"
    ) as HTMLSpanElement;

    if (this.titleWithHighlight) {
      titleSpan.innerHTML = this.titleWithHighlight;
    } else {
      titleSpan.textContent = this.title;
    }

    // Set the width of the title span, so overflow ellipsis work
    if (!treeOptions.skeleton) {
      if (this.colspan) {
        let vpWidth = tree.element.clientWidth;
        titleSpan.style.width =
          vpWidth - (<any>nodeElem)._ofsTitlePx - ROW_EXTRA_PAD + "px";
      } else {
        titleSpan.style.width =
          columns[0]._widthPx -
          (<any>nodeElem)._ofsTitlePx -
          ROW_EXTRA_PAD +
          "px";
      }
    }

    // Update row classes
    opts.isDataChange = true;
    this._render_status(opts);

    // Let user modify the result
    if (this.statusNodeType) {
      this._callEvent("renderStatusNode", {
        isNew: isNew,
        nodeElem: nodeElem,
      });
    } else if (this.parent) {
      // Skip root node
      this._callEvent("render", {
        isNew: isNew,
        isDataChange: true,
        nodeElem: nodeElem,
        typeInfo: typeInfo,
        colInfosById: this._getRenderInfo(),
      });
    }
  }

  /**
   * Update row classes to reflect active, focuses, etc.
   * @see {@link Wunderbaumode.render}
   */
  protected _render_status(opts: any) {
    // this.log("_render_status", opts);
    const tree = this.tree;
    const treeOptions = tree.options;
    const typeInfo = this.type ? tree.types[this.type] : null;
    const rowDiv = this._rowElem!;

    // Row markup already exists
    const nodeElem = rowDiv.querySelector("span.wb-node") as HTMLSpanElement;
    const expanderSpan = nodeElem.querySelector(
      "i.wb-expander"
    ) as HTMLLIElement;
    const checkboxSpan = nodeElem.querySelector(
      "i.wb-checkbox"
    ) as HTMLLIElement;
    // TODO: update icon (if not opts.isNew)
    // const iconSpan = nodeElem.querySelector("i.wb-icon") as HTMLElement;

    let rowClasses = ["wb-row"];
    this.expanded ? rowClasses.push("wb-expanded") : 0;
    this.lazy ? rowClasses.push("wb-lazy") : 0;
    this.selected ? rowClasses.push("wb-selected") : 0;
    this === tree.activeNode ? rowClasses.push("wb-active") : 0;
    this === tree.focusNode ? rowClasses.push("wb-focus") : 0;
    this._errorInfo ? rowClasses.push("wb-error") : 0;
    this._isLoading ? rowClasses.push("wb-loading") : 0;
    this.statusNodeType
      ? rowClasses.push("wb-status-" + this.statusNodeType)
      : 0;

    this.match ? rowClasses.push("wb-match") : 0;
    this.subMatchCount ? rowClasses.push("wb-submatch") : 0;
    treeOptions.skeleton ? rowClasses.push("wb-skeleton") : 0;

    // Replace previous classes:
    rowDiv.className = rowClasses.join(" ");

    // Add classes from `node.extraClasses`
    rowDiv.classList.add(...this.extraClasses);

    // Add classes from `tree.types[node.type]`
    if (typeInfo && typeInfo.classes) {
      rowDiv.classList.add(...typeInfo.classes);
    }

    if (expanderSpan) {
      if (this.isExpandable(false)) {
        if (this.expanded) {
          expanderSpan.className = "wb-expander " + iconMap.expanderExpanded;
        } else {
          expanderSpan.className = "wb-expander " + iconMap.expanderCollapsed;
        }
      } else if (this._isLoading) {
        expanderSpan.className = "wb-expander " + iconMap.loading;
      } else if (this.lazy && this.children == null) {
        expanderSpan.className = "wb-expander " + iconMap.expanderLazy;
      } else {
        expanderSpan.classList.add("wb-indent");
      }
    }
    if (checkboxSpan) {
      if (this.selected) {
        checkboxSpan.className = "wb-checkbox " + iconMap.checkChecked;
      } else {
        checkboxSpan.className = "wb-checkbox " + iconMap.checkUnchecked;
      }
    }
    // Fix active cell in cell-nav mode
    if (!opts.isNew) {
      let i = 0;
      for (let colSpan of rowDiv.children) {
        colSpan.classList.toggle("wb-active", i++ === tree.activeColIdx);
      }
    }
  }

  /**
   * Create or update node's markup.
   *
   * `options.change` defaults to ChangeType.data, which updates the title,
   * icon, and status. It also triggers the `render` event, that lets the user
   * create or update the content of embeded cell elements.<br>
   *
   * If only the status or other class-only modifications have changed,
   * `options.change` should be set to ChangeType.status instead for best
   * efficiency.
   */
  render(options?: any) {
    // this.log("render", options);
    const opts = Object.assign({ change: ChangeType.data }, options);
    if (!this._rowElem) {
      opts.change = "row";
    }
    switch (opts.change) {
      case "status":
        this._render_status(opts);
        break;
      case "data":
        this._render_data(opts);
        break;
      default:
        this._render_markup(opts);
        break;
    }
  }

  /**
   * Remove all children, collapse, and set the lazy-flag, so that the lazyLoad
   * event is triggered on next expand.
   */
  resetLazy() {
    this.removeChildren();
    this.expanded = false;
    this.lazy = true;
    this.children = null;
    this.tree.setModified(ChangeType.structure);
  }

  /** Convert node (or whole branch) into a plain object.
   *
   * The result is compatible with node.addChildren().
   *
   * @param include child nodes
   * @param callback(dict, node) is called for every node, in order to allow
   *     modifications.
   *     Return `false` to ignore this node or `"skip"` to include this node
   *     without its children.
   * @returns {NodeData}
   */
  toDict(recursive = false, callback?: any): any {
    const dict: any = {};

    NODE_ATTRS.forEach((propName: string) => {
      const val = (<any>this)[propName];

      if (val instanceof Set) {
        // Convert Set to string (or skip if set is empty)
        val.size
          ? (dict[propName] = Array.prototype.join.call(val.keys(), " "))
          : 0;
      } else if (val || val === false || val === 0) {
        dict[propName] = val;
      }
    });
    if (!util.isEmptyObject(this.data)) {
      dict.data = util.extend({}, this.data);
      if (util.isEmptyObject(dict.data)) {
        delete dict.data;
      }
    }
    if (callback) {
      const res = callback(dict, this);
      if (res === false) {
        return false; // Don't include this node nor its children
      }
      if (res === "skip") {
        recursive = false; // Include this node, but not the children
      }
    }
    if (recursive) {
      if (util.isArray(this.children)) {
        dict.children = [];
        for (let i = 0, l = this.children!.length; i < l; i++) {
          const node = this.children![i];
          if (!node.isStatusNode()) {
            const res = node.toDict(true, callback);
            if (res !== false) {
              dict.children.push(res);
            }
          }
        }
      }
    }
    return dict;
  }

  /** Return an option value that has a default, but may be overridden by a
   * callback or a node instance attribute.
   *
   * Evaluation sequence:
   *
   * - If `tree.options.<name>` is a callback that returns something, use that.
   * - Else if `node.<name>` is defined, use that.
   * - Else if `tree.types[<node.type>]` is a value, use that.
   * - Else if `tree.options.<name>` is a value, use that.
   * - Else use `defaultValue`.
   *
   * @param name name of the option property (on node and tree)
   * @param defaultValue return this if nothing else matched
   * {@link Wunderbaum.getOption|Wunderbaum.getOption()}
   */
  getOption(name: string, defaultValue?: any) {
    let tree = this.tree;
    let opts: any = tree.options;

    // Lookup `name` in options dict
    if (name.indexOf(".") >= 0) {
      [opts, name] = name.split(".");
    }
    let value = opts[name]; // ?? defaultValue;

    // A callback resolver always takes precedence
    if (typeof value === "function") {
      let res = value.call(tree, {
        type: "resolve",
        tree: tree,
        node: this,
        // typeInfo: this.type ? tree.types[this.type] : {},
      });
      if (res !== undefined) {
        return res;
      }
    }
    // If this node has an explicit local setting, use it:
    if ((<any>this)[name] !== undefined) {
      return (<any>this)[name];
    }
    // Use value from type definition if defined
    let typeInfo = this.type ? tree.types[this.type] : undefined;
    let res = typeInfo ? typeInfo[name] : undefined;
    if (res !== undefined) {
      return res;
    }
    // Use value from value options dict, fallback do default
    return value ?? defaultValue;
  }

  /** Make sure that this node is visible in the viewport.
   * @see {@link Wunderbaum.scrollTo|Wunderbaum.scrollTo()}
   */
  async scrollIntoView(options?: any) {
    return this.tree.scrollTo(this);
  }

  /**
   * Activate this node, deactivate previous, send events, activate column and scroll int viewport.
   */
  async setActive(flag: boolean = true, options?: SetActiveOptions) {
    const tree = this.tree;
    const prev = tree.activeNode;
    const retrigger = options?.retrigger;
    const noEvents = options?.noEvents;

    if (!noEvents) {
      let orgEvent = options?.event;
      if (flag) {
        if (prev !== this || retrigger) {
          if (
            prev?._callEvent("deactivate", {
              nextNode: this,
              orgEvent: orgEvent,
            }) === false
          ) {
            return;
          }
          if (
            this._callEvent("activate", {
              prevNode: prev,
              orgEvent: orgEvent,
            }) === false
          ) {
            tree.activeNode = null;
            prev?.setModified();
            return;
          }
        }
      } else if (prev === this || retrigger) {
        this._callEvent("deactivate", { nextNode: null, orgEvent: orgEvent });
      }
    }

    if (prev !== this) {
      tree.activeNode = this;
      prev?.setModified(ChangeType.status);
      this.setModified(ChangeType.status);
    }
    if (
      options &&
      options.colIdx != null &&
      options.colIdx !== tree.activeColIdx &&
      tree.navMode !== NavigationMode.row
    ) {
      tree.setColumn(options.colIdx);
    }
    // requestAnimationFrame(() => {
    //   this.scrollIntoView();
    // })
    return this.scrollIntoView();
  }

  /**
   * Expand or collapse this node.
   */
  async setExpanded(flag: boolean = true, options?: SetExpandedOptions) {
    // alert("" + this.getLevel() + ", "+ this.getOption("minExpandLevel");
    if (
      !flag &&
      this.isExpanded() &&
      this.getLevel() < this.getOption("minExpandLevel") &&
      !util.getOption(options, "force")
    ) {
      this.logDebug("Ignored collapse request below expandLevel.");
      return;
    }
    if (flag && this.lazy && this.children == null) {
      await this.loadLazy();
    }
    this.expanded = flag;
    this.tree.setModified(ChangeType.structure);
  }

  /**
   * Set keyboard focus here.
   * @see {@link setActive}
   */
  setFocus(flag: boolean = true, options?: any) {
    const prev = this.tree.focusNode;
    this.tree.focusNode = this;
    prev?.setModified();
    this.setModified();
  }

  /** Set a new icon path or class. */
  setIcon() {
    throw new Error("Not yet implemented");
    // this.setModified();
  }

  /** Change node's {@link key} and/or {@link refKey}.  */
  setKey(key: string | null, refKey: string | null) {
    throw new Error("Not yet implemented");
  }

  /**
   * Schedule a render, typically called to update after a status or data change.
   *
   * `change` defaults to 'data', which handles modifcations of title, icon,
   * and column content. It can be reduced to 'ChangeType.status' if only
   * active/focus/selected state has changed.
   */
  setModified(change: ChangeType = ChangeType.data) {
    util.assert(change === ChangeType.status || change === ChangeType.data);
    this.tree.setModified(change, this);
  }

  /** Modify the check/uncheck state. */
  setSelected(flag: boolean = true, options?: SetSelectedOptions) {
    const prev = this.selected;
    if (!!flag !== prev) {
      this._callEvent("select", { flag: flag });
    }
    this.selected = !!flag;
    this.setModified();
  }

  /** Display node status (ok, loading, error, noData) using styles and a dummy child node. */
  setStatus(
    status: NodeStatusType,
    message?: string,
    details?: string
  ): WunderbaumNode | null {
    const tree = this.tree;
    let statusNode: WunderbaumNode | null = null;

    const _clearStatusNode = () => {
      // Remove dedicated dummy node, if any
      let children = this.children;

      if (children && children.length && children[0].isStatusNode()) {
        children[0].remove();
      }
    };

    const _setStatusNode = (data: any) => {
      // Create/modify the dedicated dummy node for 'loading...' or
      // 'error!' status. (only called for direct child of the invisible
      // system root)
      let children = this.children;
      let firstChild = children ? children[0] : null;

      util.assert(data.statusNodeType);
      util.assert(!firstChild || !firstChild.isStatusNode());

      statusNode = this.addNode(data, "firstChild");
      statusNode.match = true;
      tree.setModified(ChangeType.structure);

      return statusNode;
    };

    _clearStatusNode();

    switch (status) {
      case "ok":
        this._isLoading = false;
        this._errorInfo = null;
        break;
      case "loading":
        // If this is the invisible root, add a visible top-level node
        if (!this.parent) {
          _setStatusNode({
            statusNodeType: status,
            title:
              tree.options.strings.loading +
              (message ? " (" + message + ")" : ""),
            checkbox: false,
            colspan: true,
            tooltip: details,
          });
        }
        this._isLoading = true;
        this._errorInfo = null;
        // this.render();
        break;
      case "error":
        _setStatusNode({
          statusNodeType: status,
          title:
            tree.options.strings.loadError +
            (message ? " (" + message + ")" : ""),
          checkbox: false,
          colspan: true,
          // classes: "wb-center",
          tooltip: details,
        });
        this._isLoading = false;
        this._errorInfo = { message: message, details: details };
        break;
      case "noData":
        _setStatusNode({
          statusNodeType: status,
          title: message || tree.options.strings.noData,
          checkbox: false,
          colspan: true,
          tooltip: details,
        });
        this._isLoading = false;
        this._errorInfo = null;
        break;
      default:
        util.error("invalid node status " + status);
    }
    tree.setModified(ChangeType.structure);
    return statusNode;
  }

  /** Rename this node. */
  setTitle(title: string): void {
    this.title = title;
    this.setModified();
    // this.triggerModify("rename"); // TODO
  }

  /**
   * Trigger `modifyChild` event on a parent to signal that a child was modified.
   * @param {string} operation Type of change: 'add', 'remove', 'rename', 'move', 'data', ...
   */
  triggerModifyChild(
    operation: string,
    child: WunderbaumNode | null,
    extra?: any
  ) {
    if (!this.tree.options.modifyChild) return;

    if (child && child.parent !== this) {
      util.error("child " + child + " is not a child of " + this);
    }
    this._callEvent(
      "modifyChild",
      util.extend({ operation: operation, child: child }, extra)
    );
  }

  /**
   * Trigger `modifyChild` event on node.parent(!).
   * @param {string} operation Type of change: 'add', 'remove', 'rename', 'move', 'data', ...
   * @param {object} [extra]
   */
  triggerModify(operation: string, extra?: any) {
    // if (!this.parent) {
    //   return;
    // }
    this.parent.triggerModifyChild(operation, this, extra);
  }

  /**
   * Call fn(node) for all child nodes in hierarchical order (depth-first).
   *
   * Stop iteration, if fn() returns false. Skip current branch, if fn()
   * returns "skip".<br>
   * Return false if iteration was stopped.
   *
   * @param {function} callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and
   *     its children only.
   */
  visit(
    callback: NodeVisitCallback,
    includeSelf: boolean = false
  ): NodeVisitResponse {
    let i,
      l,
      res: any = true,
      children = this.children;

    if (includeSelf === true) {
      res = callback(this);
      if (res === false || res === "skip") {
        return res;
      }
    }
    if (children) {
      for (i = 0, l = children.length; i < l; i++) {
        res = children[i].visit(callback, true);
        if (res === false) {
          break;
        }
      }
    }
    return res;
  }

  /** Call fn(node) for all parent nodes, bottom-up, including invisible system root.<br>
   * Stop iteration, if callback() returns false.<br>
   * Return false if iteration was stopped.
   *
   * @param callback the callback function. Return false to stop iteration
   */
  visitParents(
    callback: (node: WunderbaumNode) => boolean | void,
    includeSelf: boolean = false
  ): boolean {
    if (includeSelf && callback(this) === false) {
      return false;
    }
    let p = this.parent;
    while (p) {
      if (callback(p) === false) {
        return false;
      }
      p = p.parent;
    }
    return true;
  }

  /**
   * Call fn(node) for all sibling nodes.<br>
   * Stop iteration, if fn() returns false.<br>
   * Return false if iteration was stopped.
   *
   * @param {function} fn the callback function.
   *     Return false to stop iteration.
   */
  visitSiblings(
    callback: (node: WunderbaumNode) => boolean | void,
    includeSelf: boolean = false
  ): boolean {
    let i,
      l,
      n,
      ac = this.parent.children!;

    for (i = 0, l = ac.length; i < l; i++) {
      n = ac[i];
      if (includeSelf || n !== this) {
        if (callback(n) === false) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * [ext-filter] Return true if this node is matched by current filter (or no filter is active).
   */
  isMatched() {
    return !(this.tree.filterMode && !this.match);
  }
}
