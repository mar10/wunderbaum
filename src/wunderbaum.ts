/*!
 * wunderbaum.ts
 *
 * A tree control.
 *
 * Copyright (c) 2021, Martin Wendt (https://wwWendt.de).
 * Released under the MIT license.
 *
 * @version @VERSION
 * @date @DATE
 */

import "./wunderbaum.scss";
import * as util from "./util";
// import { PersistoOptions } from "./wb_options";

const default_debuglevel = 2; // Replaced by rollup script

// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];

enum ChangeType {
  any = "any",
  children = "children",
  status = "status",
}

type WunderbaumOptions = any;

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
  statusNodeType = "";
  subMatchCount = 0;
  match = false;

  _rowIdx: number | undefined = 0;
  _rowElem: HTMLElement | undefined = undefined;

  constructor(tree: Wunderbaum, parent: WunderbaumNode, data: any) {
    util.assert(!parent || parent.tree === tree);
    this.tree = tree;
    this.parent = parent;
    this.title = data.title || "?";
    this.key = data.key === undefined ? "" + ++WunderbaumNode.sequence : "" + data.key;
    // this.refKey = data.refKey;
  }

  /**
   * Return readable string representation for this instance.
   * @internal
   */
  toString() {
    return "WunderbaumNode@" + this.key + "<'" + this.title + "'>";
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
  /** Return true if this node is a temporarily generated system node like
   * 'loading', 'paging', or 'error' (node.statusNodeType contains the type).
   */
  isStatusNode() {
    return !!this.statusNodeType;
  }
  /** Call fn(node) for all child nodes in hierarchical order (depth-first).<br>
   * Stop iteration, if fn() returns false. Skip current branch, if fn() returns "skip".<br>
   * Return false if iteration was stopped.
   *
   * @param {function} callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and
   *     its children only.
   */
  visit(callback: (node: WunderbaumNode) => any, includeSelf: boolean = false): any {
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
  visitParents(callback: (node: WunderbaumNode) => boolean | undefined, includeSelf: boolean = false): boolean {
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
  visitSiblings(callback: (node: WunderbaumNode) => boolean | undefined, includeSelf: boolean = false): boolean {
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

  setExpanded(flag: boolean = true) {
    this.expanded = flag;
  }

  render(opts: any) {
    let parentElem: HTMLElement;
    let titleSpan: HTMLElement;
    let rowDiv = this._rowElem;

    if (rowDiv) {
      util.toggleClass(rowDiv, "wb-expanded", !!this.expanded);
      util.toggleClass(rowDiv, "wb-lazy", !!this.lazy);
      util.toggleClass(rowDiv, "wb-selected", !!this.selected);
      titleSpan = <HTMLElement>rowDiv.querySelector("span.wb-title");

    } else {
      let elem: HTMLElement,
        nodeElem: HTMLElement;

      parentElem = this.tree.nodeListElement;
      // parentElem = this.parent ? this.parent!._rowElem! : this.tree.element;

      rowDiv = document.createElement("div");
      rowDiv.classList.add("wb-row");
      if (this.expanded) { rowDiv.classList.add("wb-expanded"); }
      if (this.lazy) { rowDiv.classList.add("wb-lazy"); }
      if (this.selected) { rowDiv.classList.add("wb-selected"); }

      nodeElem = document.createElement("span");
      nodeElem.classList.add("wb-node", "wb-col");
      rowDiv.appendChild(nodeElem);

      elem = document.createElement("i");
      elem.classList.add("wb-checkbox");
      elem.classList.add("bi", "bi-check2-square");
      nodeElem.appendChild(elem);

      elem = document.createElement("i");
      elem.classList.add("wb-indent");
      nodeElem.appendChild(elem);

      elem = document.createElement("i");
      elem.classList.add("wb-expander");
      elem.classList.add("bi", "bi-dash-square");
      nodeElem.appendChild(elem);

      elem = document.createElement("i");
      elem.classList.add("wb-icon");
      elem.classList.add("bi", "bi-folder");
      nodeElem.appendChild(elem);

      titleSpan = document.createElement("span");
      titleSpan.classList.add("wb-title");
      nodeElem.appendChild(titleSpan);
    }
    rowDiv.style.top = (this._rowIdx! * 16) + "px";
    titleSpan.textContent = this.title;

    // Attach to DOM as late as possible
    if (!this._rowElem) {
      this._rowElem = rowDiv;
      parentElem!.appendChild(rowDiv);
    }
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
}

/**
 * A persistent plain object or array.
 *
 * See also [[WunderbaumOptions]].
 */
export class Wunderbaum {
  static version: string = "@VERSION"; // Set to semver by 'grunt release'
  static sequence = 0;

  readonly root: WunderbaumNode;
  readonly name: string;
  readonly element: HTMLElement;
  readonly treeElement: HTMLElement;
  readonly nodeListElement: HTMLElement;

  protected keyMap: any = {};
  protected refKeyMap: any = {};
  protected rows: WunderbaumNode[] = [];
  protected activeNode: WunderbaumNode | null = null;
  protected opts: any;
  enableFilter = false;
  _enableUpdate = true;

  // ready: Promise<any>;

  constructor(options: WunderbaumOptions) {

    this.root = new WunderbaumNode(this, <WunderbaumNode><unknown>null, {
      key: "__root__",
      name: "__root__",
    });

    let opts = this.opts = util.extend(
      {
        source: null, // URL for GET/PUT, ajax options, or callback
        element: null,
        debugLevel: default_debuglevel, // 0:quiet, 1:normal, 2:verbose
        // Events
        change: util.noop,
        error: util.noop,
        receive: util.noop,
      },
      options
    );
    if (typeof opts.element === "string") {
      this.element = <HTMLElement>document.querySelector(opts.element);
    } else {
      this.element = opts.element;
    }
    this.treeElement = <HTMLElement>this.element.querySelector("div.wunderbaum");
    this.nodeListElement = <HTMLElement>this.element.querySelector("div.wb-tree");
    this.name = opts.name || "wb_" + ++Wunderbaum.sequence;
    if (opts.source) {
      this.load(opts.source);
    }
  }

  /** Log to console if opts.debugLevel >= 4 */
  debug(...args: any[]) {
    if (this.opts.debugLevel >= 4) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }

  /**
   * Return readable string representation for this instance.
   * @internal
   */
  toString() {
    return "Wunderbaum<'" + this.name + "'>";
  }

  /* Log to console if opts.debugLevel >= 1 */
  log(...args: any[]) {
    if (this.opts.debugLevel >= 1) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }

  /** @internal */
  logTime(label: string): string {
    if (this.opts.debugLevel >= 1) {
      console.time(label);
    }
    return label;
  }

  /** @internal */
  logTimeEnd(label: string): void {
    if (this.opts.debugLevel >= 1) {
      console.timeEnd(label);
    }
  }

  /** */
  renumber(opts: any): boolean {
    let label = this.logTime("renumber");
    let idx = 0;
    let top = 0;
    let height = 16;
    let modified = false;
    let start = opts.startIdx || 30;
    let end = opts.endIdx || start + 100;

    this.root.children![1].expanded = true;

    this.visitRows(function (node) {
      let prevIdx = node._rowIdx;
      if ( prevIdx !== idx) {
        node._rowIdx = idx;
        modified = true;
      }
      if (idx < start && idx > end) {
        if (node._rowElem) {
          node._rowElem.remove();
          node._rowElem = undefined;
        }
      } else if (prevIdx != idx) {
        node.render({ top: top });
      }
      idx++;
      top += height;
    });
    // Resize tree container
    this.nodeListElement.style.height = "" + top;
    this.logTimeEnd(label);
    return modified;
  }

  /** Redraw DOM elements.
   */
  render(opts?: any) {
    this.renumber({
      start: 100,
      end: 100 + 20,
    });
  }

  /** Call callback(node) for all nodes in hierarchical order (depth-first).
   *
   * @param {function} callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and children only.
   * @returns {boolean} false, if the iterator was stopped.
   */
  visit(callback: (node: WunderbaumNode) => any) {
    return this.root.visit(callback, false);
  }

  /** Call fn(node) for all nodes in vertical order, top down (or bottom up).<br>
   * Stop iteration, if fn() returns false.<br>
   * Return false if iteration was stopped.
   *
   * @param {function} callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and children only.
   * @param {object} [options]
   *     Defaults:
   *     {start: First top node, reverse: false, includeSelf: true, includeHidden: false}
   * @returns {boolean} false if iteration was cancelled
   */
  visitRows(callback: (node: WunderbaumNode) => any, opts?: any): boolean {
    if (!this.root.hasChildren()) {
      return false;
    }
    if (opts && opts.reverse) {
      delete opts.reverse;
      return this._visitRowsUp(callback, opts);
    }
    opts = opts || {};

    let i,
      nextIdx,
      parent,
      res,
      siblings,
      siblingOfs = 0,
      skipFirstNode = opts.includeSelf === false,
      includeHidden = !!opts.includeHidden,
      checkFilter = !includeHidden && this.enableFilter,
      node = opts.start || this.root.children![0];

    parent = node.parent;
    while (parent) {
      // visit siblings
      siblings = parent.children;
      nextIdx = siblings.indexOf(node) + siblingOfs;
      util.assert(
        nextIdx >= 0,
        "Could not find " +
        node +
        " in parent's children: " +
        parent
      );

      for (i = nextIdx; i < siblings.length; i++) {
        node = siblings[i];
        if (checkFilter && !node.match && !node.subMatchCount) {
          continue;
        }
        if (!skipFirstNode && callback(node) === false) {
          return false;
        }
        skipFirstNode = false;
        // Dive into node's child nodes
        if (
          node.children &&
          node.children.length &&
          (includeHidden || node.expanded)
        ) {
          res = node.visit(function (n: WunderbaumNode) {
            if (checkFilter && !n.match && !n.subMatchCount) {
              return "skip";
            }
            if (callback(n) === false) {
              return false;
            }
            if (!includeHidden && n.children && !n.expanded) {
              return "skip";
            }
          }, false);
          if (res === false) {
            return false;
          }
        }
      }
      // Visit parent nodes (bottom up)
      node = parent;
      parent = parent.parent;
      siblingOfs = 1; //
    }
    return true;
  }

  /** Call fn(node) for all nodes in vertical order, bottom up.
   * @internal
   */
  protected _visitRowsUp(callback: (node: WunderbaumNode) => any, opts: any): boolean {
    var children,
      idx,
      parent,
      includeHidden = !!opts.includeHidden,
      node = opts.start || this.root.children![0];

    while (true) {
      parent = node.parent;
      children = parent.children;

      if (children[0] === node) {
        // If this is already the first sibling, goto parent
        node = parent;
        if (!node.parent) {
          break; // first node of the tree
        }
        children = parent.children;
      } else {
        // Otherwise, goto prev. sibling
        idx = children.indexOf(node);
        node = children[idx - 1];
        // If the prev. sibling has children, follow down to last descendant
        while (
          (includeHidden || node.expanded) &&
          node.children &&
          node.children.length
        ) {
          children = node.children;
          parent = node;
          node = children[children.length - 1];
        }
      }
      // Skip invisible
      if (!includeHidden && !node.isVisible()) {
        continue;
      }
      if (callback(node) === false) {
        return false;
      }
      break;
    }
    return true;
  }

  /** . */
  load(source: any) {
    return this._load(this.root, source);
  }

  /** . */
  addChildren(parent: WunderbaumNode, data: any) {
    util.assert(util.isArray(data));
    for (let i = 0; i < data.length; i++) {
      let d = data[i];
      let node = new WunderbaumNode(this, parent, d);

      parent.addChild(node);
      if (d.children) {
        this.addChildren(node, d.children);
      }
    }
    this.setModified(parent, ChangeType.children);
  }

  /**
   *
   */
  public enableUpdate(flag: boolean): boolean {
    flag = flag !== false;
    if (!!this._enableUpdate === !!flag) {
      return flag;
    }
    this._enableUpdate = flag;
    if (flag) {
      this.debug("enableUpdate(true): redraw "); //, this._dirtyRoots);
      // this._callHook("treeStructureChanged", this, "enableUpdate");
      this.renumber({});
      // this.render();
    } else {
      // 	this._dirtyRoots = null;
      this.debug("enableUpdate(false)...");
    }
    return !flag; // return previous value
  }

  protected setModified(node: WunderbaumNode | null, change: ChangeType) {

  }

  /** Download  data from the cloud, then call `.update()`. */
  protected _load(parent: WunderbaumNode, source: any): Promise<WunderbaumNode> {
    let opts = this.opts;
    if (opts.debugLevel >= 2 && console.time) {
      console.time(this + "._load");
    }
    let self = this;

    let promise = new Promise<WunderbaumNode>(function (resolve, reject) {
      fetch(opts.source, { method: "GET" })
        .then(function (response) {
          if (response.ok) {
            opts.receive.call(self, response);
          } else {
            util.error(
              "GET " +
              opts.remote +
              " returned " +
              response.status +
              ", " +
              response
            );
          }
          return response.json();  // pas as `data` to next then()
        })
        .then(function (data) {
          let prev = self.enableUpdate(false);
          self.addChildren.call(self, parent, data);
          self.enableUpdate(prev);
          resolve(parent);
        })
        .catch(function () {
          console.error(arguments);
          reject(parent);
          opts.error.call(self, arguments);
        })
        .finally(function () {
          if (opts.debugLevel >= 2 && console.time) {
            console.timeEnd(self + "._load");
          }
        });

    });
    return promise;
  }
}
