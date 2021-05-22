/*!
 * Wunderbaum - wunderbaum_node
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import "./wunderbaum.scss";
import * as util from "./util";
// import { PersistoOptions } from "./wb_options";

// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];

import { Wunderbaum } from "./wunderbaum";
import {
  ChangeType,
  evalOption,
  iconMap,
  KEY_TO_ACTION_MAP,
  NodeAnyCallback,
  ROW_HEIGHT,
} from "./common";
import { Deferred } from "./deferred";

export class WunderbaumNode {
  static sequence = 0;

  /** Reference to owning tree. */
  public tree: Wunderbaum;
  /** Parent node (null for the invisible root node `tree.root`). */
  public parent: WunderbaumNode;
  public title: string;
  public readonly key: string;
  public readonly refKey: string | undefined = undefined;
  public children: WunderbaumNode[] | null = null;
  public lazy: boolean = false;
  public expanded: boolean = false;
  public selected: boolean = false;
  public type?: string;
  statusNodeType?: string;
  subMatchCount = 0;
  match = false;

  _rowIdx: number | undefined = 0;
  _rowElem: HTMLElement | undefined = undefined;

  constructor(tree: Wunderbaum, parent: WunderbaumNode, data: any) {
    util.assert(!parent || parent.tree === tree);
    this.tree = tree;
    this.parent = parent;
    this.key = data.key == null ? "" + ++WunderbaumNode.sequence : "" + data.key;
    this.title = data.title || "?" + this.key;
    // this.refKey = data.refKey;
    tree._registerNode(this);
  }

  /**
   * Return readable string representation for this instance.
   * @internal
   */
  toString() {
    return "WunderbaumNode@" + this.key + "<'" + this.title + "'>";
  }

  /** Return an option value. */
  protected _getOpt(
    name: string,
    nodeObject: any = null,
    treeOptions: any = null,
    defaultValue: any = null,
  ): any {
    return evalOption(name, this, nodeObject || this, treeOptions || this.tree.options, defaultValue);
  }

  /** Call event if defined in options. */
  protected _trigger(event: string, extra?: any): any {
    return this.tree._trigger.call(this.tree, event, util.extend({ node: this }, extra));
  }

  addChild(node: WunderbaumNode, before?: WunderbaumNode) {
    if (this.children == null) {
      this.children = [node];
    } else if (before) {
      util.assert(false);
    } else {
      this.children.push(node);
    }
  }

  /** . */
  addChildren(data: any) {
    util.assert(util.isArray(data));
    for (let i = 0; i < data.length; i++) {
      let d = data[i];
      let node = new WunderbaumNode(this.tree, this, d);

      this.addChild(node);
      if (d.children) {
        node.addChildren(d.children);
      }
    }
    this.tree.setModified(this, ChangeType.structure);
  }

  /** */
  expandAll(flag: boolean = true) {
    this.visit((node) => {
      node.setExpanded(flag);
    });
  }

  /** Find a node relative to self.
   *
   * @param {number|string} where The keyCode that would normally trigger this move,
   *		or a keyword ('down', 'first', 'last', 'left', 'parent', 'right', 'up').


  */
  findRelatedNode(where: string, includeHidden = false) {
    return this.tree.findRelatedNode(this, where, includeHidden);
  }

  /** Return the first child node or null.
   * @returns {FancytreeNode | null}
   */
  getFirstChild() {
    return this.children ? this.children[0] : null;
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
  /** Return the parent node (null for the system root node).
   * @returns {FancytreeNode | null}
   */
  getParent() {
    // TODO: return null for top-level nodes?
    return this.parent;
  }
  /** Return an array of all parent nodes (top-down).
   * @param includeRoot Include the invisible system root node.
   * @param includeSelf Include the node itself.
   */
  getParentList(includeRoot = false, includeSelf = false) {
    var l = [],
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

    var val,
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

  /** Return true if node has children. Return undefined if not sure, i.e. the node is lazy and not yet loaded. */
  hasChildren() {
    if (this.lazy) {
      if (this.children == null) {
        // null or undefined: Not yet loaded
        return undefined;
      } else if (this.children.length === 0) {
        // Loaded, but response was empty
        return false;
      } else if (
        this.children.length === 1 &&
        this.children[0].isStatusNode()
      ) {
        // Currently loading or load error
        return undefined;
      }
      return true;
    }
    return !!(this.children && this.children.length);
  }
  isActive() {
    return this.tree.activeNode === this;
  }

  isExpanded() {
    return !!this.expanded;
  }

  isExpandable() {
    return !!this.children;
  }

  isSelected() {
    return !!this.selected;
  }
  /** Return true if this a top level node, i.e. a direct child of the (invisible) system root node.
   */
  isTopLevel() {
    return this.tree.root === this.parent;
  }
  /** Return true if node is lazy and not yet loaded. For non-lazy nodes always return false.
   */
  isUndefined() {
    return this.hasChildren() === undefined; // also checks if the only child is a status node
  }
  /** Return true if all parent nodes are expanded. Note: this does not check
   * whether the node is scrolled into the visible part of the screen.
   */
  isVisible() {
    var i,
      l,
      n,
      hasFilter = this.tree.enableFilter,
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

  /** Return true if this node is a temporarily generated system node like
   * 'loading', 'paging', or 'error' (node.statusNodeType contains the type).
   */
  isStatusNode() {
    return !!this.statusNodeType;
  }

  /** Return true if this node is a temporarily generated system node of type 'paging'. */
  isPagingNode() {
    return this.statusNodeType === "paging";
  }

  /** Download  data from the cloud, then call `.update()`. */
  async load(source: any) {
    let tree = this.tree;
    let opts = tree.options;

    if (opts.debugLevel >= 2) {
      console.time(this + ".load");
    }
    try {
      const response = await fetch(source, { method: "GET" });
      if (!response.ok) {
        util.error(
          "GET " +
          opts.remote +
          " returned " +
          response.status +
          ", " +
          response
        );
      }
      this._trigger("receive", { response: response });
      const data = await response.json();

      let prev = tree.enableUpdate(false);
      this.addChildren(data);
      tree.enableUpdate(prev);
    } catch (error) {
      this._trigger("error", { error: error });
    }

    if (opts.debugLevel >= 2) {
      console.timeEnd(this + ".load");
    }
  }

  /* Log to console if opts.debugLevel >= 1 */
  log(...args: any[]) {
    if (this.tree.options.debugLevel >= 1) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }

  /* Log to console if opts.debugLevel >= 4 */
  logDebug(...args: any[]) {
    if (this.tree.options.debugLevel >= 4) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }

  /* Log warning to console if opts.debugLevel >= 1 */
  logWarning(...args: any[]) {
    if (this.tree.options.debugLevel >= 1) {
      Array.prototype.unshift.call(args, this.toString());
      console.warn.apply(console, args);
    }
  }

  /* Log error to console. */
  logError(...args: any[]) {
    Array.prototype.unshift.call(args, this.toString());
    console.error.apply(console, args);
  }

  /** Expand all parents and optionally scroll into visible area as neccessary.
   * Promise is resolved, when lazy loading and animations are done.
   * @param {object} [opts] passed to `setExpanded()`.
   *     Defaults to {noAnimation: false, noEvents: false, scrollIntoView: true}
   */
  async makeVisible(opts: any) {
    var i,
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
    where = KEY_TO_ACTION_MAP[where] || where;

    // // Handle optional expand/collapse action for LEFT/RIGHT
    // switch (where) {
    //   case "left":
    //     if (this.expanded) {
    //       return this.setExpanded(false);
    //     }
    //     break;
    //   case "right":
    //     if (!this.expanded && (this.children || this.lazy)) {
    //       return this.setExpanded();
    //     }
    //     break;
    //   case "firstCol":
    //   case "lastCol":
    //     this.logWarning("navigate(" + where + ") is not yet implmented");
    //     break;
    // }
    // Otherwise activate or focus the related node
    let node = this.findRelatedNode(where);
    if (node) {
      // setFocus/setActive will scroll later (if autoScroll is specified)
      try {
        node.makeVisible({ scrollIntoView: false });
      } catch (e) { } // #272
      if (options.activate === false) {
        node.setFocus();
        return Promise.resolve(this);
      }
      return node.setActive();
    }
    this.logWarning("Could not find related node '" + where + "'.");
    return Promise.resolve(this);
  }

  /** */
  remove() {
    const tree = this.tree;
    this.visit((n) => {
      n.removeMarkup();
      tree._unregisterNode(n);
    });
  }

  removeMarkup() {
    if (this._rowElem) {
      delete (<any>this._rowElem)._wb_node;
      this._rowElem.remove();
      this._rowElem = undefined;
    }
  }

  render(opts: any) {
    let tree = this.tree;
    let elem: HTMLElement, nodeElem: HTMLElement;
    let rowDiv = this._rowElem;
    let titleSpan: HTMLElement;
    let checkboxSpan: HTMLElement;
    let iconSpan: HTMLElement;
    let expanderSpan: HTMLElement;
    const activeColIdx = tree.cellNavMode ? tree.activeColIdx : null;

    //
    let rowClasses = ["wb-row"];
    this.expanded ? rowClasses.push("wb-expanded") : 0;
    this.lazy ? rowClasses.push("wb-lazy") : 0;
    this.selected ? rowClasses.push("wb-selected") : 0;
    this === tree.activeNode ? rowClasses.push("wb-active") : 0;

    if (rowDiv) {
      // Row markup already exists
      titleSpan = <HTMLElement>rowDiv.querySelector("span.wb-title");
      expanderSpan = <HTMLElement>rowDiv.querySelector("i.wb-expander");
      checkboxSpan = <HTMLElement>rowDiv.querySelector("i.wb-checkbox");
      iconSpan = <HTMLElement>rowDiv.querySelector("i.wb-icon");
    } else {
      rowDiv = document.createElement("div");
      // rowDiv.classList.add("wb-row");
      // Attach a node reference to the DOM Element:
      (<any>rowDiv)._wb_node = this;

      nodeElem = document.createElement("span");
      nodeElem.classList.add("wb-node", "wb-col");
      if (activeColIdx === 0) { nodeElem.classList.add("wb-active"); }
      rowDiv.appendChild(nodeElem);

      checkboxSpan = document.createElement("i");
      nodeElem.appendChild(checkboxSpan);

      for (let i = this.getLevel() - 1; i > 0; i--) {
        elem = document.createElement("i");
        elem.classList.add("wb-indent");
        nodeElem.appendChild(elem);
      }

      expanderSpan = document.createElement("i");
      nodeElem.appendChild(expanderSpan);

      iconSpan = document.createElement("i");
      nodeElem.appendChild(iconSpan);

      titleSpan = document.createElement("span");
      titleSpan.classList.add("wb-title");
      nodeElem.appendChild(titleSpan);

      // Render columns
      let colIdx = 0;
      for (let col of tree.columns) {
        colIdx++;
        if (col.id === "*") {
          continue;
        }
        let colElem = document.createElement("span");
        colElem.classList.add("wb-col");
        if (colIdx === activeColIdx) { nodeElem.classList.add("wb-active"); }
        colElem.style.left = col._ofsPx + "px";
        colElem.style.width = col._widthPx + "px";
        colElem.textContent = "" + col.id;
        rowDiv.appendChild(colElem);
      }
    }

    rowDiv.className = rowClasses.join(" ");
    // rowDiv.style.top = (this._rowIdx! * 1.1) + "em";
    rowDiv.style.top = this._rowIdx! * ROW_HEIGHT + "px";

    if (expanderSpan) {
      if (this.isExpandable()) {
        if (this.expanded) {
          expanderSpan.className = "wb-expander " + iconMap.expanderExpanded;
        } else {
          expanderSpan.className = "wb-expander " + iconMap.expanderCollapsed;
        }
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
    if (iconSpan) {
      if (this.expanded) {
        iconSpan.className = "wb-icon " + iconMap.folderOpen;
      } else if (this.children) {
        iconSpan.className = "wb-icon " + iconMap.folder;
      } else {
        iconSpan.className = "wb-icon " + iconMap.doc;
      }
    }
    titleSpan.textContent = this.title;

    // Attach to DOM as late as possible
    if (!this._rowElem) {
      this._rowElem = rowDiv;
      tree.nodeListElement.appendChild(rowDiv);
    }
  }

  async scrollIntoView(options?: any) {
    return this.tree.scrollTo(this);
  }

  async setActive(flag: boolean = true, options?: any) {
    let prev = this.tree.activeNode;
    this.tree.activeNode = this;
    prev?.setDirty(ChangeType.status);
    this.setDirty(ChangeType.status);
    this.scrollIntoView();
  }

  setDirty(type: ChangeType) {
    if (this.tree._enableUpdate === false) {
      return;
    }
    if (type === ChangeType.structure) {
      this.tree.updateViewport();
    } else if (this._rowElem) {
      // otherwise not in viewport, so no need to render
      this.render({});
    }
  }

  async setExpanded(flag: boolean = true, options?: any) {
    this.expanded = flag;
    this.setDirty(ChangeType.structure);
  }

  setFocus(flag: boolean = true, options?: any) {
    let prev = this.tree.focusNode;
    this.tree.focusNode = this;
    prev?.setDirty(ChangeType.status);
    this.setDirty(ChangeType.status);
  }

  setSelected(flag: boolean = true, options?: any) {
    this.selected = flag;
    this.setDirty(ChangeType.status);
  }

  /** Call fn(node) for all child nodes in hierarchical order (depth-first).<br>
   * Stop iteration, if fn() returns false. Skip current branch, if fn() returns "skip".<br>
   * Return false if iteration was stopped.
   *
   * @param {function} callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and
   *     its children only.
   */
  visit(
    callback: (node: WunderbaumNode) => any,
    includeSelf: boolean = false
  ): any {
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
   * @param {function} callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and children only.
   */
  visitParents(
    callback: (node: WunderbaumNode) => boolean | undefined,
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

  /** Call fn(node) for all sibling nodes.<br>
   * Stop iteration, if fn() returns false.<br>
   * Return false if iteration was stopped.
   *
   * @param {function} fn the callback function.
   *     Return false to stop iteration.
   */
  visitSiblings(
    callback: (node: WunderbaumNode) => boolean | undefined,
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
}
