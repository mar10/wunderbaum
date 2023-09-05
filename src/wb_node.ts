/*!
 * Wunderbaum - wunderbaum_node
 * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import * as util from "./util";

import { Wunderbaum } from "./wunderbaum";
import {
  AddChildrenOptions,
  InsertNodeType,
  ApplyCommandOptions,
  ApplyCommandType,
  ChangeType,
  ColumnEventInfoMap,
  ExpandAllOptions,
  MakeVisibleOptions,
  MatcherCallback,
  NavigateOptions,
  NodeAnyCallback,
  NodeStatusType,
  NodeStringCallback,
  NodeVisitCallback,
  NodeVisitResponse,
  RenderOptions,
  ScrollIntoViewOptions,
  SetActiveOptions,
  SetExpandedOptions,
  SetSelectedOptions,
  SetStatusOptions,
  SortCallback,
  NodeToDictCallback,
  WbNodeData,
  TristateType,
} from "./types";
import {
  iconMap,
  ICON_WIDTH,
  KEY_TO_ACTION_DICT,
  makeNodeTitleMatcher,
  RESERVED_TREE_SOURCE_KEYS,
  TITLE_SPAN_PAD_Y,
  ROW_HEIGHT,
  TEST_IMG,
  inflateSourceData,
  nodeTitleSorter,
} from "./common";
import { Deferred } from "./deferred";

/** WunderbaumNode properties that can be passed with source data.
 * (Any other source properties will be stored as `node.data.PROP`.)
 */
const NODE_PROPS = new Set<string>([
  "checkbox",
  "classes",
  "expanded",
  "icon",
  "iconTooltip",
  "key",
  "lazy",
  "_partsel",
  "radiogroup",
  "refKey",
  "selected",
  "statusNodeType",
  "title",
  "tooltip",
  "type",
  "unselectable",
  // "unselectableIgnore",
  // "unselectableStatus",
]);
/** WunderbaumNode properties that will be returned by `node.toDict()`.)
 */
const NODE_DICT_PROPS = new Set<string>(NODE_PROPS);
NODE_DICT_PROPS.delete("_partsel");
NODE_DICT_PROPS.delete("unselectable");
// NODE_DICT_PROPS.delete("unselectableIgnore");
// NODE_DICT_PROPS.delete("unselectableStatus");

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
  public radiogroup?: boolean;
  /** If true, (in grid mode) no cells are rendered, except for the node title.*/
  public colspan?: boolean;
  public icon?: boolean | string;
  public lazy: boolean = false;
  /** Expansion state.
   * @see {@link isExpandable}, {@link isExpanded}, {@link setExpanded}. */
  public expanded: boolean = false;
  /** Selection state.
   * @see {@link isSelected}, {@link setSelected}, {@link toggleSelected}. */
  public selected: boolean = false;
  public unselectable?: boolean;
  // public unselectableStatus?: boolean;
  // public unselectableIgnore?: boolean;
  public type?: string;
  public tooltip?: string;
  /** Additional classes added to `div.wb-row`.
   * @see {@link hasClass}, {@link setClass}. */
  public classes: Set<string> | null = null; //new Set<string>();
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
    data.type != null ? (this.type = "" + data.type) : 0;
    this.expanded = data.expanded === true;
    data.icon != null ? (this.icon = data.icon) : 0;
    this.lazy = data.lazy === true;
    data.statusNodeType != null
      ? (this.statusNodeType = "" + data.statusNodeType)
      : 0;
    data.colspan != null ? (this.colspan = !!data.colspan) : 0;

    // Selection
    data.checkbox != null ? (this.checkbox = !!data.checkbox) : 0;
    data.radiogroup != null ? (this.radiogroup = !!data.radiogroup) : 0;
    this.selected = data.selected === true;
    data.unselectable === true ? (this.unselectable = true) : 0;
    // data.unselectableStatus != null
    //   ? (this.unselectableStatus = !!data.unselectableStatus)
    //   : 0;
    // data.unselectableIgnore === true ? (this.unselectableIgnore = true) : 0;

    if (data.classes) {
      this.setClass(data.classes);
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

  /**
   * Iterate all descendant nodes depth-first, pre-order using `for ... of ...` syntax.
   * More concise, but slightly slower than {@link WunderbaumNode.visit}.
   *
   * Example:
   * ```js
   * for(const n of node) {
   *   ...
   * }
   * ```
   */

  *[Symbol.iterator](): IterableIterator<WunderbaumNode> {
    // let node: WunderbaumNode | null = this;
    const cl = this.children;
    if (cl) {
      for (let i = 0, l = cl.length; i < l; i++) {
        const n = cl[i];
        yield n;
        if (n.children) {
          yield* n;
        }
      }
      // Slower:
      // for (let node of this.children) {
      //   yield node;
      //   yield* node : 0;
      // }
    }
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
   * Tip: pass `{ before: 0 }` to prepend new nodes as first children.
   *
   * @returns first child added
   */
  addChildren(
    nodeData: WbNodeData | WbNodeData[],
    options?: AddChildrenOptions
  ): WunderbaumNode {
    const tree = this.tree;
    let { before = null, applyMinExpanLevel = true, _level } = options ?? {};
    // let { before, loadLazy=true, _level } = options ?? {};
    // const isTopCall = _level == null;
    _level ??= this.getLevel();
    const nodeList = [];

    try {
      tree.enableUpdate(false);

      if (util.isPlainObject(nodeData)) {
        nodeData = [<WbNodeData>nodeData];
      }
      const forceExpand =
        applyMinExpanLevel && _level < tree.options.minExpandLevel!;
      for (let child of <WbNodeData[]>nodeData) {
        const subChildren = child.children;
        delete child.children;

        const n = new WunderbaumNode(tree, this, child);
        if (forceExpand && !n.isUnloaded()) {
          n.expanded = true;
        }
        nodeList.push(n);
        if (subChildren) {
          n.addChildren(subChildren, { _level: _level + 1 });
        }
      }

      if (!this.children) {
        this.children = nodeList;
      } else if (before == null || this.children.length === 0) {
        this.children = this.children.concat(nodeList);
      } else {
        // Returns null if before is not a direct child:
        before = this.findDirectChild(before)!;
        let pos = this.children.indexOf(before);
        util.assert(
          pos >= 0,
          `options.before must be a direct child of ${this}`
        );
        // insert nodeList after children[pos]
        this.children.splice(pos, 0, ...nodeList);
      }
      // this.triggerModifyChild("add", nodeList.length === 1 ? nodeList[0] : null);
      tree.update(ChangeType.structure);
    } finally {
      // if (tree.options.selectMode === "hier") {
      //   if (this.parent && this.parent.children) {
      //     this.fixSelection3FromEndNodes();
      //   } else {
      //     // my happen when loading __root__;
      //   }
      // }
      tree.enableUpdate(true);
    }
    // if(isTopCall && loadLazy){
    //   this.logWarn("addChildren(): loadLazy is not yet implemented.")
    // }
    return nodeList[0];
  }

  /**
   * Append or prepend a node, or append a child node.
   *
   * This a convenience function that calls addChildren()
   *
   * @param nodeData node definition
   * @param [mode=child] 'before', 'after', 'firstChild', or 'child' ('over' is a synonym for 'child')
   * @returns new node
   */
  addNode(
    nodeData: WbNodeData,
    mode: InsertNodeType = "appendChild"
  ): WunderbaumNode {
    if (<string>mode === "over") {
      mode = "appendChild"; // compatible with drop region
    }
    switch (mode) {
      case "after":
        return this.parent.addChildren(nodeData, {
          before: this.getNextSibling(),
        });
      case "before":
        return this.parent.addChildren(nodeData, { before: this });
      case "prependChild":
        // Insert before the first child if any
        // let insertBefore = this.children ? this.children[0] : undefined;
        return this.addChildren(nodeData, { before: 0 });
      case "appendChild":
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
  applyCommand(cmd: ApplyCommandType, options: ApplyCommandOptions): any {
    return this.tree.applyCommand(cmd, this, options);
  }

  /**
   * Collapse all expanded sibling nodes if any.
   * (Automatically called when `autoCollapse` is true.)
   */
  collapseSiblings(options?: SetExpandedOptions): any {
    for (let node of this.parent.children!) {
      if (node !== this && node.expanded) {
        node.setExpanded(false, options);
      }
    }
  }

  /**
   * Add/remove one or more classes to `<div class='wb-row'>`.
   *
   * This also maintains `node.classes`, so the class will survive a re-render.
   *
   * @param className one or more class names. Multiple classes can be passed
   *     as space-separated string, array of strings, or set of strings.
   */
  setClass(
    className: string | string[] | Set<string>,
    flag: boolean = true
  ): void {
    const cnSet = util.toSet(className);
    if (flag) {
      if (this.classes === null) {
        this.classes = new Set<string>();
      }
      cnSet.forEach((cn) => {
        this.classes!.add(cn);
        this._rowElem?.classList.toggle(cn, flag);
      });
    } else {
      if (this.classes === null) {
        return;
      }
      cnSet.forEach((cn) => {
        this.classes!.delete(cn);
        this._rowElem?.classList.toggle(cn, flag);
      });
      if (this.classes.size === 0) {
        this.classes = null;
      }
    }
  }

  /** Call `setExpanded()` on all descendant nodes. */
  async expandAll(flag: boolean = true, options?: ExpandAllOptions) {
    const tree = this.tree;
    const minExpandLevel = this.tree.options.minExpandLevel;
    let { depth = 99, loadLazy, force } = options ?? {};

    const expandOpts = {
      scrollIntoView: false,
      force: force,
      loadLazy: loadLazy,
    };

    // this.logInfo(`expandAll(${flag})`);
    // Expand all direct children in parallel:
    async function _iter(n: WunderbaumNode, level: number | null) {
      // n.logInfo(`  _iter(${level})`);
      if (level === 0) {
        return;
      }
      // if (!flag && minExpandLevel && !force && n.getLevel() <= minExpandLevel) {
      //   return; // Do not collapse until minExpandLevel
      // }
      const level_1 = level == null ? null : level - 1;
      const promises: Promise<unknown>[] = [];
      n.children?.forEach((cn) => {
        if (flag) {
          if (!cn.expanded && (cn.children || (loadLazy && cn.lazy))) {
            // Node is collapsed and may be expanded (i.e. has children or is lazy)
            // Expanding may be async, so we store the promise.
            // Also the recursion is delayed until expansion finished.
            const p = cn.setExpanded(true, expandOpts);
            promises.push(p);
            p.then(async () => {
              await _iter(cn, level_1);
            });
          } else {
            // We don't expand the node, but still visit descendants.
            // There we may find lazy nodes, so we
            promises.push(_iter(cn, level_1));
          }
        } else {
          // Collapsing is always synchronous, so no promises required
          if (!minExpandLevel || force || cn.getLevel() > minExpandLevel) {
            // Do not collapse until minExpandLevel
            cn.setExpanded(false, expandOpts);
          }
          _iter(cn, level_1); // recursion, even if cn was already collapsed
        }
      });
      return new Promise((resolve) => {
        Promise.all(promises).then(() => {
          resolve(true);
        });
      });
    }

    const tag = tree.logTime(`${this}.expandAll(${flag})`);
    try {
      tree.enableUpdate(false);
      await _iter(this, depth);
    } finally {
      tree.enableUpdate(true);
      tree.logTimeEnd(tag);
    }
  }

  /**
   * Find all descendant nodes that match condition (excluding self).
   *
   * If `match` is a string, search for exact node title.
   * If `match` is a RegExp expression, apply it to node.title, using
   * [RegExp.test()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test).
   * If `match` is a callback, match all nodes for that the callback(node) returns true.
   *
   * Returns an empty array if no nodes were found.
   *
   * Examples:
   * ```js
   * // Match all node titles that match exactly 'Joe':
   * nodeList = node.findAll("Joe")
   * // Match all node titles that start with 'Joe' case sensitive:
   * nodeList = node.findAll(/^Joe/)
   * // Match all node titles that contain 'oe', case insensitive:
   * nodeList = node.findAll(/oe/i)
   * // Match all nodes with `data.price` >= 99:
   * nodeList = node.findAll((n) => {
   *   return n.data.price >= 99;
   * })
   * ```
   */
  findAll(match: string | RegExp | MatcherCallback): WunderbaumNode[] {
    const matcher =
      typeof match === "function" ? match : makeNodeTitleMatcher(match);
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

  /**
   * Find first descendant node that matches condition (excluding self) or null.
   *
   * @see {@link WunderbaumNode.findAll} for examples.
   */
  findFirst(match: string | RegExp | MatcherCallback): WunderbaumNode | null {
    const matcher =
      typeof match === "function" ? match : makeNodeTitleMatcher(match);
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

  /**
   * Iterator version of {@link WunderbaumNode.format}.
   */
  *format_iter(
    name_cb?: NodeStringCallback,
    connectors?: string[]
  ): IterableIterator<string> {
    connectors ??= ["    ", " |  ", " ╰─ ", " ├─ "];
    name_cb ??= (node: WunderbaumNode) => "" + node;

    function _is_last(node: WunderbaumNode): boolean {
      const ca = node.parent.children!;
      return node === ca[ca.length - 1];
    }

    const _format_line = (node: WunderbaumNode) => {
      // https://www.measurethat.net/Benchmarks/Show/12196/0/arr-unshift-vs-push-reverse-small-array
      const parts = [name_cb!(node)];
      parts.unshift(connectors![_is_last(node) ? 2 : 3]);
      let p = node.parent;
      while (p && p !== this) {
        // `this` is the top node
        parts.unshift(connectors![_is_last(p) ? 0 : 1]);
        p = p.parent;
      }
      return parts.join("");
    };

    yield name_cb(this);
    for (let node of this) {
      yield _format_line(node);
    }
  }

  /**
   * Return a multiline string representation of a node/subnode hierarchy.
   * Mostly useful for debugging.
   *
   * Example:
   * ```js
   * console.info(tree.getActiveNode().format((n)=>n.title));
   * ```
   * logs
   * ```
   * Books
   *  ├─ Art of War
   *  ╰─ Don Quixote
   * ```
   * @see {@link WunderbaumNode.format_iter}
   */
  format(name_cb?: NodeStringCallback, connectors?: string[]): string {
    const a = [];
    for (let line of this.format_iter(name_cb, connectors)) {
      a.push(line);
    }
    return a.join("\n");
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

  /** Return true if node has className set. */
  hasClass(className: string): boolean {
    return this.classes ? this.classes.has(className) : false;
  }

  /** Return true if this node is the currently active tree node. */
  isActive() {
    return this.tree.activeNode === this;
  }

  /** Return true if this node is a direct or indirect parent of `other`.
   * (See also [[isParentOf]].)
   */
  isAncestorOf(other: WunderbaumNode) {
    return other && other.isDescendantOf(this);
  }

  /** Return true if this node is a **direct** subnode of `other`.
   * (See also [[isDescendantOf]].)
   */
  isChildOf(other: WunderbaumNode) {
    return other && this.parent === other;
  }

  /** Return true if this node's title spans all columns, i.e. the node has no
   * grid cells.
   */
  isColspan() {
    return !!this.getOption("colspan");
  }

  /** Return true if this node is a direct or indirect subnode of `other`.
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
        util.error(`Recursive parent link: ${p}`);
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
    // `false` is never expandable (unoffical)
    if ((andCollapsed && this.expanded) || <any>this.children === false) {
      return false;
    }
    if (this.children == null) {
      return this.lazy; // null or undefined can trigger lazy load
    }
    if (this.children.length === 0) {
      return !!this.tree.options.emptyChildListExpandable;
    }
    return true;
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

  /** Return true if this node is a **direct** parent of `other`.
   * (See also [[isAncestorOf]].)
   */
  isParentOf(other: WunderbaumNode) {
    return other && other.parent === this;
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

  /** Return true if this node is selected, i.e. the checkbox is set.
   * `undefined` if partly selected (tri-state), false otherwise.
   */
  isSelected(): TristateType {
    return this.selected ? true : this._partsel ? undefined : false;
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

  protected _loadSourceObject(source: any, level?: number) {
    const tree = this.tree;

    level ??= this.getLevel();

    // Let caller modify the parsed JSON response:
    const res = this._callEvent("receive", { response: source });
    if (res != null) {
      source = res;
    }

    if (util.isArray(source)) {
      source = { children: source };
    }
    util.assert(util.isPlainObject(source));

    const format: string = source.format ?? "nested";
    util.assert(format === "nested" || format === "flat");

    // Pre-rocess for 'nested' or 'flat' format
    inflateSourceData(source);

    util.assert(
      source.children,
      "If `source` is an object, it must have a `children` property"
    );
    if (source.types) {
      tree.logInfo("Redefine types", source.columns);
      tree.setTypes(source.types, false);
      delete source.types;
    }
    if (source.columns) {
      tree.logInfo("Redefine columns", source.columns);
      tree.columns = source.columns;
      delete source.columns;
      tree.update(ChangeType.colStructure);
    }

    this.addChildren(source.children);

    // Add extra data to `tree.data`
    for (const [key, value] of Object.entries(source)) {
      if (!RESERVED_TREE_SOURCE_KEYS.has(key)) {
        tree.data[key] = value;
        tree.logDebug(`Add source.${key} to tree.data.${key}`);
      }
    }
    if (tree.options.selectMode === "hier") {
      this.fixSelection3FromEndNodes();
    }

    this._callEvent("load");
  }

  async _fetchWithOptions(source: any) {
    // Either a URL string or an object with a `.url` property.
    let url: string, params, body, options, rest;
    let fetchOpts: any = {};
    if (typeof source === "string") {
      // source is a plain URL string: assume GET request
      url = source;
      fetchOpts.method = "GET";
    } else if (util.isPlainObject(source)) {
      // source is a plain object with `.url` property.
      ({ url, params, body, options, ...rest } = source);
      util.assert(typeof url === "string", `expected source.url as string`);
      if (util.isPlainObject(options)) {
        fetchOpts = options;
      }
      if (util.isPlainObject(body)) {
        // we also accept 'body' as object...
        util.assert(
          !fetchOpts.body,
          "options.body should be passed as source.body"
        );
        fetchOpts.body = JSON.stringify(fetchOpts.body);
        fetchOpts.method ??= "POST"; // set default
      }
      if (util.isPlainObject(params)) {
        url += "?" + new URLSearchParams(params);
        fetchOpts.method ??= "GET"; // set default
      }
    } else {
      url = ""; // keep linter happy
      util.error(`Unsupported source format: ${source}`);
    }
    this.setStatus(NodeStatusType.loading);
    const response = await fetch(url, fetchOpts);
    if (!response.ok) {
      util.error(`GET ${url} returned ${response.status}, ${response}`);
    }
    return await response.json();
  }
  /** Download  data from the cloud, then call `.update()`. */
  async load(source: any) {
    const tree = this.tree;
    const requestId = Date.now();
    const prevParent = this.parent;
    const start = Date.now();
    let elap = 0,
      elapLoad = 0,
      elapProcess = 0;

    // Check for overlapping requests
    if (this._requestId) {
      this.logWarn(
        `Recursive load request #${requestId} while #${this._requestId} is pending.`
      );
      // 	node.debug("Send load request #" + requestId);
    }
    this._requestId = requestId;

    // const timerLabel = tree.logTime(this + ".load()");

    try {
      let url: string = typeof source === "string" ? source : source.url;
      if (!url) {
        // An array or a plain object (that does NOT contain a `.url` property)
        // will be treated as native Wunderbaum data
        this._loadSourceObject(source);
        elapProcess = Date.now() - start;
      } else {
        // Either a URL string or an object with a `.url` property.
        const data = await this._fetchWithOptions(source);

        elapLoad = Date.now() - start;

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
        // if (data.columns) {
        //   tree.logInfo("Re-define columns", data.columns);
        //   util.assert(!this.parent);
        //   tree.columns = data.columns;
        //   delete data.columns;
        //   tree.updateColumns({ calculateCols: false });
        // }
        const startProcess = Date.now();
        this._loadSourceObject(data);
        elapProcess = Date.now() - startProcess;
      }
    } catch (error) {
      this.logError("Error during load()", source, error);
      this._callEvent("error", { error: error });
      this.setStatus(NodeStatusType.error, { message: "" + error });
      throw error;
    } finally {
      this._requestId = 0;
      elap = Date.now() - start;
      if (tree.options.debugLevel! >= 3) {
        tree.logInfo(
          `Load source took ${elap / 1000} seconds (transfer: ${
            elapLoad / 1000
          }s, processing: ${elapProcess / 1000}s)`
        );
      }
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
        this.tree.update(ChangeType.structure);
      } else {
        this.update(); // Fix expander icon to 'loaded'
      }
    } catch (e) {
      this.logError("Error during loadLazy()", e);
      this._callEvent("error", { error: e });
      this.setStatus(NodeStatusType.error, { message: "" + e });
    }
    return;
  }

  /** Alias for `logDebug` */
  log(...args: any[]) {
    this.logDebug.apply(this, args);
  }

  /* Log to console if opts.debugLevel >= 4 */
  logDebug(...args: any[]) {
    if (this.tree.options.debugLevel! >= 4) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }

  /* Log error to console. */
  logError(...args: any[]) {
    if (this.tree.options.debugLevel! >= 1) {
      Array.prototype.unshift.call(args, this.toString());
      console.error.apply(console, args);
    }
  }

  /* Log to console if opts.debugLevel >= 3 */
  logInfo(...args: any[]) {
    if (this.tree.options.debugLevel! >= 3) {
      Array.prototype.unshift.call(args, this.toString());
      console.info.apply(console, args);
    }
  }

  /* Log warning to console if opts.debugLevel >= 2 */
  logWarn(...args: any[]) {
    if (this.tree.options.debugLevel! >= 2) {
      Array.prototype.unshift.call(args, this.toString());
      console.warn.apply(console, args);
    }
  }

  /** Expand all parents and optionally scroll into visible area as neccessary.
   * Promise is resolved, when lazy loading and animations are done.
   * @param {object} [options] passed to `setExpanded()`.
   *     Defaults to {noAnimation: false, noEvents: false, scrollIntoView: true}
   */
  async makeVisible(options?: MakeVisibleOptions) {
    let i,
      dfd = new Deferred(),
      deferreds = [],
      parents = this.getParentList(false, false),
      len = parents.length,
      noAnimation = util.getOption(options, "noAnimation", false),
      scroll = util.getOption(options, "scrollIntoView", true);
    // scroll = !(options && options.scrollIntoView === false);

    // Expand bottom-up, so only the top node is animated
    for (i = len - 1; i >= 0; i--) {
      // self.debug("pushexpand" + parents[i]);
      const seOpts = { noAnimation: noAnimation };
      deferreds.push(parents[i].setExpanded(true, seOpts));
    }
    Promise.all(deferreds).then(() => {
      // All expands have finished
      // self.debug("expand DONE", scroll);
      // Note: this.tree may be none when switching demo trees
      if (scroll && this.tree) {
        // Make sure markup and _rowIdx is updated before we do the scroll calculations
        this.tree.updatePendingModifications();
        this.scrollIntoView().then(() => {
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
    mode: InsertNodeType = "appendChild",
    map?: NodeAnyCallback
  ) {
    if (<string>mode === "over") {
      mode = "appendChild"; // compatible with drop region
    }
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
          util.error(`Invalid mode '${mode}'.`);
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
      this.visit((n) => {
        // TODO: fix selection state and activation, ...
        n.tree = targetNode.tree;
      }, true);
    }
    // Make sure we update async, because discarding the markup would prevent
    // DragAndDrop to generate a dragend event on the source node
    setTimeout(() => {
      // Even indentation may have changed:
      tree.update(ChangeType.any);
    }, 0);
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
  async navigate(where: string, options?: NavigateOptions) {
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
    tree.update(ChangeType.structure);
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
    this.tree.update(ChangeType.structure);
  }

  /** Remove all HTML markup from the DOM. */
  removeMarkup() {
    if (this._rowElem) {
      delete (<any>this._rowElem)._wb_node;
      this._rowElem.remove();
      this._rowElem = undefined;
    }
  }

  protected _getRenderInfo(): any {
    const allColInfosById: ColumnEventInfoMap = {};
    const renderColInfosById: ColumnEventInfoMap = {};
    const isColspan = this.isColspan();

    const colElems = this._rowElem
      ? ((<unknown>(
          this._rowElem.querySelectorAll("span.wb-col")
        )) as HTMLSpanElement[])
      : null;

    let idx = 0;
    for (let col of this.tree.columns) {
      allColInfosById[col.id] = {
        id: col.id,
        idx: idx,
        elem: colElems ? colElems[idx] : null,
        info: col,
      };
      // renderColInfosById only contains columns that need rendering:
      if (!isColspan && col.id !== "*") {
        renderColInfosById[col.id] = allColInfosById[col.id];
      }
      idx++;
    }
    return {
      allColInfosById: allColInfosById,
      renderColInfosById: renderColInfosById,
    };
  }

  protected _createIcon(
    parentElem: HTMLElement,
    replaceChild: HTMLElement | null,
    showLoading: boolean
  ): HTMLElement | null {
    let iconSpan;
    let icon = this.getOption("icon");
    if (this._errorInfo) {
      icon = iconMap.error;
    } else if (this._isLoading && showLoading) {
      // Status nodes, or nodes without expander (< minExpandLevel) should
      // display the 'loading' status with the i.wb-icon span
      icon = iconMap.loading;
    }
    if (icon === false) {
      return null; // explicitly disabled: don't try default icons
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
    } else if (this.lazy) {
      icon = iconMap.folderLazy;
    } else {
      icon = iconMap.doc;
    }

    // this.log("_createIcon: " + icon);
    if (!icon) {
      iconSpan = document.createElement("i");
      iconSpan.className = "wb-icon";
    } else if (icon.indexOf("<") >= 0) {
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
   * @see {@link WunderbaumNode._render}
   */
  protected _render_markup(opts: RenderOptions) {
    const tree = this.tree;
    const treeOptions = tree.options;
    const checkbox = this.getOption("checkbox");
    // const checkbox = this.getOption("checkbox") !== false;
    const columns = tree.columns;
    const level = this.getLevel();
    let elem: HTMLElement;
    let nodeElem: HTMLElement;
    let rowDiv = this._rowElem;
    let titleSpan: HTMLElement;
    let checkboxSpan: HTMLElement | null = null;
    let iconSpan: HTMLElement | null;
    let expanderSpan: HTMLElement | null = null;
    const activeColIdx = tree.isRowNav() ? null : tree.activeColIdx;

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
      if (checkbox === "radio" || this.parent.radiogroup) {
        checkboxSpan.classList.add("wb-radio");
      }
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

    // Render the icon (show a 'loading' icon if we do not have an expander that
    // we would prefer).
    iconSpan = this._createIcon(nodeElem, null, !expanderSpan);
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
    const isColspan = this.isColspan();

    if (!isColspan && columns.length > 1) {
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
    // Now go on and fill in data and update classes
    opts.isNew = true;
    this._render_data(opts);
  }

  /**
   * Render `node.title`, `.icon` into an existing row.
   *
   * @see {@link WunderbaumNode._render}
   */
  protected _render_data(opts: RenderOptions) {
    util.assert(this._rowElem);

    const tree = this.tree;
    const treeOptions = tree.options;
    const rowDiv = this._rowElem!;
    const isNew = !!opts.isNew; // Called by _render_markup()?
    const preventScroll = !!opts.preventScroll;
    const columns = tree.columns;
    const isColspan = this.isColspan();

    // Row markup already exists
    const nodeElem = rowDiv.querySelector("span.wb-node") as HTMLSpanElement;
    const titleSpan = nodeElem.querySelector(
      "span.wb-title"
    ) as HTMLSpanElement;

    const scrollTop = tree.element.scrollTop;
    if (this.titleWithHighlight) {
      titleSpan.innerHTML = this.titleWithHighlight;
    } else {
      titleSpan.textContent = this.title; // TODO: this triggers scroll events
    }
    // NOTE: At least on Safari, this render call triggers a scroll event
    // probably when a focused input is replaced.
    if (preventScroll) {
      tree.element.scrollTop = scrollTop;
    }

    // Set the width of the title span, so overflow ellipsis work
    if (!treeOptions.skeleton) {
      if (isColspan) {
        let vpWidth = tree.element.clientWidth;
        titleSpan.style.width =
          vpWidth - (<any>nodeElem)._ofsTitlePx - TITLE_SPAN_PAD_Y + "px";
      } else {
        titleSpan.style.width =
          columns[0]._widthPx! -
          (<any>nodeElem)._ofsTitlePx -
          TITLE_SPAN_PAD_Y +
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
        isColspan: isColspan,
      });
    } else if (this.parent) {
      // Skip root node
      const renderInfo = this._getRenderInfo();

      this._callEvent("render", {
        isNew: isNew,
        nodeElem: nodeElem,
        isColspan: isColspan,
        allColInfosById: renderInfo.allColInfosById,
        renderColInfosById: renderInfo.renderColInfosById,
      });
    }
  }

  /**
   * Update row classes to reflect active, focuses, etc.
   * @see {@link WunderbaumNode._render}
   */
  protected _render_status(opts: RenderOptions) {
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

    let rowClasses = ["wb-row"];
    this.expanded ? rowClasses.push("wb-expanded") : 0;
    this.lazy ? rowClasses.push("wb-lazy") : 0;
    this.selected ? rowClasses.push("wb-selected") : 0;
    this._partsel ? rowClasses.push("wb-partsel") : 0;
    this === tree.activeNode ? rowClasses.push("wb-active") : 0;
    this === tree.focusNode ? rowClasses.push("wb-focus") : 0;
    this._errorInfo ? rowClasses.push("wb-error") : 0;
    this._isLoading ? rowClasses.push("wb-loading") : 0;
    this.isColspan() ? rowClasses.push("wb-colspan") : 0;
    this.statusNodeType
      ? rowClasses.push("wb-status-" + this.statusNodeType)
      : 0;

    this.match ? rowClasses.push("wb-match") : 0;
    this.subMatchCount ? rowClasses.push("wb-submatch") : 0;
    treeOptions.skeleton ? rowClasses.push("wb-skeleton") : 0;

    // Replace previous classes:
    rowDiv.className = rowClasses.join(" ");

    // Add classes from `node.classes`
    this.classes ? rowDiv.classList.add(...this.classes) : 0;

    // Add classes from `tree.types[node.type]`
    if (typeInfo && typeInfo.classes) {
      rowDiv.classList.add(...typeInfo.classes);
    }

    if (expanderSpan) {
      if (this._isLoading) {
        expanderSpan.className = "wb-expander " + iconMap.loading;
      } else if (this.isExpandable(false)) {
        if (this.expanded) {
          expanderSpan.className = "wb-expander " + iconMap.expanderExpanded;
        } else {
          expanderSpan.className = "wb-expander " + iconMap.expanderCollapsed;
        }
      } else if (this.lazy && this.children == null) {
        expanderSpan.className = "wb-expander " + iconMap.expanderLazy;
      } else {
        expanderSpan.classList.add("wb-indent");
      }
    }
    if (checkboxSpan) {
      let cbclass = "wb-checkbox ";
      if (this.parent.radiogroup) {
        cbclass += "wb-radio ";
        if (this.selected) {
          cbclass += iconMap.radioChecked;
          // } else if (this._partsel) {
          //   cbclass += iconMap.radioUnknown;
        } else {
          cbclass += iconMap.radioUnchecked;
        }
      } else {
        if (this.selected) {
          cbclass += iconMap.checkChecked;
        } else if (this._partsel) {
          cbclass += iconMap.checkUnknown;
        } else {
          cbclass += iconMap.checkUnchecked;
        }
      }
      checkboxSpan.className = cbclass;
    }
    // Fix active cell in cell-nav mode
    if (!opts.isNew) {
      let i = 0;
      for (let colSpan of rowDiv.children) {
        colSpan.classList.toggle("wb-active", i++ === tree.activeColIdx);
      }
      // Update icon (if not opts.isNew, which would rebuild markup anyway)
      const iconSpan = nodeElem.querySelector("i.wb-icon") as HTMLElement;
      if (iconSpan) {
        this._createIcon(nodeElem, iconSpan, !expanderSpan);
      }
    }
    // Adjust column width
    if (opts.resizeCols !== false && !this.isColspan()) {
      const colElems = rowDiv.querySelectorAll("span.wb-col");
      let idx = 0;
      let ofs = 0;
      for (let colDef of this.tree.columns) {
        const colElem = colElems[idx] as HTMLSpanElement;
        colElem.style.left = `${ofs}px`;
        colElem.style.width = `${colDef._widthPx}px`;
        idx++;
        ofs += colDef._widthPx!;
      }
    }
  }

  /*
   * Create or update node's markup.
   *
   * `options.change` defaults to ChangeType.data, which updates the title,
   * icon, and status. It also triggers the `render` event, that lets the user
   * create or update the content of embeded cell elements.
   *
   * If only the status or other class-only modifications have changed,
   * `options.change` should be set to ChangeType.status instead for best
   * efficiency.
   *
   * Calling `update()` is almost always a better alternative.
   * @see {@link WunderbaumNode.update}
   */
  _render(options?: RenderOptions) {
    // this.log("render", options);
    const opts = Object.assign({ change: ChangeType.data }, options);
    if (!this._rowElem) {
      opts.change = ChangeType.row;
    }
    switch (opts.change) {
      case "status":
        this._render_status(opts);
        break;
      case "data":
        this._render_data(opts);
        break;
      case "row":
        // _rowElem is not yet created (asserted in _render_markup)
        this._render_markup(opts);
        break;
      default:
        util.error(`Invalid change type '${opts.change}'.`);
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
    this.tree.update(ChangeType.structure);
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
   * @see {@link Wunderbaum.toDictArray}.
   */
  toDict(recursive = false, callback?: NodeToDictCallback): WbNodeData {
    const dict: any = {};

    NODE_DICT_PROPS.forEach((propName: string) => {
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
        // Note: a return value of `false` is only used internally
        return <any>false; // Don't include this node nor its children
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
            // Note: a return value of `false` is only used internally
            const res = <any>node.toDict(true, callback);
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
  async scrollIntoView(options?: ScrollIntoViewOptions) {
    const opts = Object.assign({ node: this }, options);
    return this.tree.scrollTo(opts);
  }

  /**
   * Activate this node, deactivate previous, send events, activate column and scroll int viewport.
   */
  async setActive(flag: boolean = true, options?: SetActiveOptions) {
    const tree = this.tree;
    const prev = tree.activeNode;
    const retrigger = options?.retrigger; // Default: false
    const focusTree = options?.focusTree; // Default: false
    const focusNode = options?.focusNode !== false; // Default: true
    const noEvents = options?.noEvents; // Default: false
    const orgEvent = options?.event; // Default: false

    if (!noEvents) {
      if (flag) {
        if (prev !== this || retrigger) {
          if (
            prev?._callEvent("deactivate", {
              nextNode: this,
              event: orgEvent,
            }) === false ||
            this._callEvent("beforeActivate", {
              prevNode: prev,
              event: orgEvent,
            }) === false
          ) {
            return;
          }
          tree.activeNode = null;
          prev?.update(ChangeType.status);
        }
      } else if (prev === this || retrigger) {
        this._callEvent("deactivate", { nextNode: null, event: orgEvent });
      }
    }

    if (prev !== this) {
      if (flag) {
        tree.activeNode = this;
        if (focusNode || focusTree) tree.focusNode = this;
        if (focusTree) tree.setFocus();
      }
      prev?.update(ChangeType.status);
      this.update(ChangeType.status);
    }
    if (
      options &&
      options.colIdx != null &&
      options.colIdx !== tree.activeColIdx &&
      tree.isCellNav()
    ) {
      tree.setColumn(options.colIdx);
    }
    if (flag && !noEvents) {
      this._callEvent("activate", { prevNode: prev, event: orgEvent });
    }
    return this.makeVisible();
  }

  /**
   * Expand or collapse this node.
   */
  async setExpanded(flag: boolean = true, options?: SetExpandedOptions) {
    const { force, scrollIntoView, immediate } = options ?? {};
    if (
      !flag &&
      this.isExpanded() &&
      this.getLevel() <= this.tree.getOption("minExpandLevel") &&
      !force
    ) {
      this.logDebug("Ignored collapse request below expandLevel.");
      return;
    }
    if (!flag === !this.expanded) {
      return; // Nothing to do
    }
    // this.log("setExpanded()");
    if (flag && this.getOption("autoCollapse")) {
      this.collapseSiblings(options);
    }
    if (flag && this.lazy && this.children == null) {
      await this.loadLazy();
    }
    this.expanded = flag;
    const updateOpts = { immediate: immediate };
    // const updateOpts = { immediate: !!util.getOption(options, "immediate") };
    this.tree.update(ChangeType.structure, updateOpts);
    if (flag && scrollIntoView !== false) {
      const lastChild = this.getLastChild();
      if (lastChild) {
        this.tree.updatePendingModifications();
        lastChild.scrollIntoView({ topNode: this });
      }
    }
  }

  /**
   * Set keyboard focus here.
   * @see {@link setActive}
   */
  setFocus(flag: boolean = true) {
    util.assert(!!flag, "blur is not yet implemented");
    const prev = this.tree.focusNode;
    this.tree.focusNode = this;
    prev?.update();
    this.update();
  }

  /** Set a new icon path or class. */
  setIcon(icon: string) {
    this.icon = icon;
    this.update();
  }

  /** Change node's {@link key} and/or {@link refKey}.  */
  setKey(key: string | null, refKey: string | null) {
    throw new Error("Not yet implemented");
  }

  /**
   * @deprecated since v0.3.6: use `update()` instead.
   */
  setModified(change: ChangeType = ChangeType.data): void {
    this.logWarn("setModified() is deprecated: use update() instead.");
    return this.update(change);
  }
  /**
   * Trigger a repaint, typically after a status or data change.
   *
   * `change` defaults to 'data', which handles modifcations of title, icon,
   * and column content. It can be reduced to 'ChangeType.status' if only
   * active/focus/selected state has changed.
   *
   * This method will eventually call  {@link WunderbaumNode._render()} with
   * default options, but may be more consistent with the tree's
   * {@link Wunderbaum.update()} API.
   */
  update(change: ChangeType = ChangeType.data) {
    util.assert(change === ChangeType.status || change === ChangeType.data);
    this.tree.update(change, this);
  }

  /**
   * Return an array of selected nodes.
   * @param stopOnParents only return the topmost selected node (useful with selectMode 'hier')
   */
  getSelectedNodes(stopOnParents: boolean = false): WunderbaumNode[] {
    let nodeList: WunderbaumNode[] = [];
    this.visit((node) => {
      if (node.selected) {
        nodeList.push(node);
        if (stopOnParents === true) {
          return "skip"; // stop processing this branch
        }
      }
    });
    return nodeList;
  }

  /** Toggle the check/uncheck state. */
  toggleSelected(options?: SetSelectedOptions): TristateType {
    let flag = this.isSelected();
    if (flag === undefined) {
      flag = this._anySelectable();
    } else {
      flag = !flag;
    }
    return this.setSelected(flag, options);
  }

  /** Return true if at least on selectable descendant end-node is unselected. @internal */
  _anySelectable(): boolean {
    let found = false;
    this.visit((node) => {
      if (
        node.selected === false &&
        !node.unselectable &&
        !node.hasChildren() &&
        !node.parent.radiogroup
      ) {
        found = true;
        return false; // Stop iteration
      }
    });
    return found;
  }

  /* Apply selection state to a single node. */
  protected _changeSelectStatusProps(state: TristateType): boolean {
    let changed = false;
    switch (state) {
      case false:
        changed = this.selected || this._partsel;
        this.selected = false;
        this._partsel = false;
        break;
      case true:
        changed = !this.selected || !this._partsel;
        this.selected = true;
        this._partsel = true;
        break;
      case undefined:
        changed = this.selected || !this._partsel;
        this.selected = false;
        this._partsel = true;
        break;
      default:
        util.error(`Invalid state: ${state}`);
    }
    if (changed) {
      this.update();
    }
    return changed;
  }
  /**
   * Fix selection status, after this node was (de)selected in `selectMode: 'hier'`.
   * This includes (de)selecting all descendants.
   */
  fixSelection3AfterClick(opts?: SetSelectedOptions): void {
    const force = !!opts?.force;
    let flag = this.isSelected();

    this.visit((node) => {
      if (node.radiogroup) {
        return "skip"; // Don't (de)select this branch
      }
      if (force || !node.getOption("unselectable")) {
        node._changeSelectStatusProps(flag);
      }
    });
    this.fixSelection3FromEndNodes();
  }

  /**
   * Fix selection status for multi-hier mode.
   * Only end-nodes are considered to update the descendants branch and parents.
   * Should be called after this node has loaded new children or after
   * children have been modified using the API.
   */
  fixSelection3FromEndNodes(opts?: SetSelectedOptions): void {
    const force = !!opts?.force;
    util.assert(
      this.tree.options.selectMode === "hier",
      "expected selectMode 'hier'"
    );

    // Visit all end nodes and adjust their parent's `selected` and `_partsel`
    // attributes. Return selection state true, false, or undefined.
    const _walk = (node: WunderbaumNode) => {
      let state;
      const children = node.children;

      if (children && children.length) {
        // check all children recursively
        let allSelected = true;
        let someSelected = false;

        for (let i = 0, l = children.length; i < l; i++) {
          const child = children[i];
          // the selection state of a node is not relevant; we need the end-nodes
          const s = _walk(child);
          if (s !== false) {
            someSelected = true;
          }
          if (s !== true) {
            allSelected = false;
          }
        }
        state = allSelected ? true : someSelected ? undefined : false;
      } else {
        // This is an end-node: simply report the status
        state = !!node.selected;
      }
      // #939: Keep a `_partsel` flag that was explicitly set on a lazy node
      if (
        node._partsel &&
        !node.selected &&
        node.lazy &&
        node.children == null
      ) {
        state = undefined;
      }
      if (force || !node.getOption("unselectable")) {
        node._changeSelectStatusProps(state);
      }
      return state;
    };
    _walk(this);

    // Update parent's state
    this.visitParents((node) => {
      let state;
      const children = node.children!;
      let allSelected = true;
      let someSelected = false;

      for (let i = 0, l = children.length; i < l; i++) {
        const child = children[i];

        state = !!child.selected;
        // When fixing the parents, we trust the sibling status (i.e. we don't recurse)
        if (state || child._partsel) {
          someSelected = true;
        }
        if (!state) {
          allSelected = false;
        }
      }
      state = allSelected ? true : someSelected ? undefined : false;
      node._changeSelectStatusProps(state);
    });
  }

  /** Modify the check/uncheck state. */
  setSelected(
    flag: boolean = true,
    options?: SetSelectedOptions
  ): TristateType {
    const tree = this.tree;
    const sendEvents = !options?.noEvents; // Default: send events
    const prev = this.isSelected();
    const isRadio = this.parent && this.parent.radiogroup;
    const selectMode = tree.options.selectMode;
    const canSelect = options?.force || !this.getOption("unselectable");

    flag = !!flag;
    // this.logDebug(`setSelected(${flag})`, this);
    if (!canSelect) {
      return prev;
    }
    if (options?.propagateDown && selectMode === "multi") {
      tree.runWithDeferredUpdate(() => {
        this.visit((node) => {
          node.setSelected(flag);
        });
      });
      return prev;
    }

    if (
      flag === prev ||
      (sendEvents && this._callEvent("beforeSelect", { flag: flag }) === false)
    ) {
      return prev;
    }

    tree.runWithDeferredUpdate(() => {
      if (isRadio) {
        // Radiobutton Group
        if (!flag && !options?.force) {
          return prev; // don't uncheck radio buttons
        }
        for (let sibling of this.parent.children!) {
          sibling.selected = sibling === this;
        }
      } else {
        this.selected = flag;
        if (selectMode === "hier") {
          this.fixSelection3AfterClick();
        } else if (selectMode === "single") {
          tree.visit((n) => {
            n.selected = false;
          });
        }
      }
    });

    if (sendEvents) {
      this._callEvent("select", { flag: flag });
    }
    return prev;
  }

  /** Display node status (ok, loading, error, noData) using styles and a dummy child node. */
  setStatus(
    status: NodeStatusType,
    options?: SetStatusOptions
  ): WunderbaumNode | null {
    const tree = this.tree;
    const message = options?.message;
    const details = options?.details;

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

      statusNode = this.addNode(data, "prependChild");
      statusNode.match = true;
      tree.update(ChangeType.structure);

      return statusNode;
    };

    _clearStatusNode();

    switch (status) {
      case "ok":
        this._isLoading = false;
        this._errorInfo = null;
        break;
      case "loading":
        this._isLoading = true;
        this._errorInfo = null;
        if (this.parent) {
          this.update(ChangeType.status);
        } else {
          // If this is the invisible root, add a visible top-level node
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
        // this.update();
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
    tree.update(ChangeType.structure);
    return statusNode;
  }

  /** Rename this node. */
  setTitle(title: string): void {
    this.title = title;
    this.update();
    // this.triggerModify("rename"); // TODO
  }

  _sortChildren(cmp: SortCallback, deep: boolean): void {
    const cl = this.children;

    if (!cl) {
      return;
    }
    cl.sort(cmp);
    if (deep) {
      for (let i = 0, l = cl.length; i < l; i++) {
        if (cl[i].children) {
          cl[i]._sortChildren(cmp, deep);
        }
      }
    }
  }

  /**
   * Sort child list by title or custom criteria.
   * @param {function} cmp custom compare function(a, b) that returns -1, 0, or 1
   *    (defaults to sorting by title).
   * @param {boolean} deep pass true to sort all descendant nodes recursively
   */
  sortChildren(
    cmp: SortCallback | null = nodeTitleSorter,
    deep: boolean = false
  ): void {
    this._sortChildren(cmp || nodeTitleSorter, deep);
    this.tree.update(ChangeType.structure);
    // this.triggerModify("sort"); // TODO
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
    this.logDebug(`modifyChild(${operation})`, extra, child);
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
   * Call `callback(node)` for all descendant nodes in hierarchical order (depth-first, pre-order).
   *
   * Stop iteration, if fn() returns false. Skip current branch, if fn()
   * returns "skip".<br>
   * Return false if iteration was stopped.
   *
   * @param {function} callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and
   *     its children only.
   * @see {@link IterableIterator<WunderbaumNode>}, {@link Wunderbaum.visit}.
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
