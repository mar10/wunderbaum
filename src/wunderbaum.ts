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
import { WunderbaumNode } from "./wunderbaum_node";
// import { PersistoOptions } from "./wb_options";

const default_debuglevel = 2; // Replaced by rollup script
const ROW_HEIGHT = 16;
const RENDER_PREFETCH = 5;

// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];

export enum ChangeType {
  any = "any",
  structure = "structure",
  status = "status",
}

type WunderbaumOptions = any;

/**
 * A persistent plain object or array.
 *
 * See also [[WunderbaumOptions]].
 */
export class Wunderbaum {
  static version: string = "@VERSION"; // Set to semver by 'grunt release'
  static sequence = 0;

  /** The invisible root node, that holds all visible top level nodes. */
  readonly root: WunderbaumNode;
  readonly name: string;
  readonly element: HTMLElement;
  readonly treeElement: HTMLElement;
  readonly nodeListElement: HTMLElement;
  readonly scrollContainer: HTMLElement;

  protected keyMap: any = {};
  protected refKeyMap: any = {};
  protected rows: WunderbaumNode[] = [];
  activeNode: WunderbaumNode | null = null;
  protected opts: any;
  enableFilter = false;
  _enableUpdate = true;

  // ready: Promise<any>;

  constructor(options: WunderbaumOptions) {
    let opts = (this.opts = util.extend(
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
    ));

    this.name = opts.name || "wb_" + ++Wunderbaum.sequence;
    this.root = new WunderbaumNode(this, <WunderbaumNode>(<unknown>null), {
      key: "__root__",
      name: "__root__",
    });

    // --- Create Markup
    if (typeof opts.element === "string") {
      this.element = <HTMLElement>document.querySelector(opts.element);
    } else {
      this.element = opts.element;
    }
    this.treeElement = <HTMLElement>(
      this.element.querySelector("div.wunderbaum")
    );
    this.scrollContainer = <HTMLElement>(
      this.treeElement.querySelector("div.wb-scroll-container")
    );
    this.nodeListElement = <HTMLElement>(
      this.scrollContainer.querySelector("div.wb-node-list")
    );
    this.nodeListElement.textContent = "";
    if (!this.nodeListElement) {
      alert("TODO: create markup");
    }

    // Load initial data
    if (opts.source) {
      this.load(opts.source);
    }
    // Bind listeners
    this.scrollContainer.addEventListener("scroll", (e: Event) => {
      this.updateViewport();
    });
    util.onEvent(this.nodeListElement, "click", "span.wb-node", (e) => {
      this.getNode(e)?.setActive();
      this.log("click");
    });
  }

  /** */
  public static getTree() {}

  /** */
  public getNode(needle: any): WunderbaumNode | null {
    // let nodeElem;
    this.log("getNode", needle)

    if (needle instanceof Event) {
      needle = needle.target;
    }
    if (needle instanceof Element) {
      let nodeElem = needle.closest("div.wb-row");
      this.log("getNode", nodeElem)
      return <WunderbaumNode>(<any>nodeElem!)._wb_node;
    }
    return null;
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
    let start = opts.startIdx;
    let end = opts.endIdx;

    this.debug("render", opts);
    util.assert(start != null && end != null);
    this.root.children![1].expanded = true;

    this.visitRows(function (node) {
      let prevIdx = node._rowIdx;
      if (prevIdx !== idx) {
        node._rowIdx = idx;
        modified = true;
      }
      if (idx < start || idx > end) {
        if (node._rowElem) {
          node._rowElem.remove();
          node._rowElem = undefined;
        }
      } else if (!node._rowElem || prevIdx != idx) {
        node.render({ top: top });
      }
      idx++;
      top += height;
    });
    // Resize tree container
    this.nodeListElement.style.height = "" + top + "px";
    this.logTimeEnd(label);
    return modified;
  }

  /** */
  updateViewport() {
    let height = this.scrollContainer.clientHeight;
    let ofs = this.scrollContainer.scrollTop;

    this.renumber({
      startIdx: Math.max(0, ofs / ROW_HEIGHT - RENDER_PREFETCH),
      endIdx: Math.max(0, (ofs + height) / ROW_HEIGHT + RENDER_PREFETCH),
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
        "Could not find " + node + " in parent's children: " + parent
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
  protected _visitRowsUp(
    callback: (node: WunderbaumNode) => any,
    opts: any
  ): boolean {
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
    this.setModified(parent, ChangeType.structure);
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
      this.updateViewport();
    } else {
      // 	this._dirtyRoots = null;
      this.debug("enableUpdate(false)...");
    }
    return !flag; // return previous value
  }

  protected setModified(node: WunderbaumNode | null, change: ChangeType) {}

  /** Download  data from the cloud, then call `.update()`. */
  protected _load(
    parent: WunderbaumNode,
    source: any
  ): Promise<WunderbaumNode> {
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
          return response.json(); // pas as `data` to next then()
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
