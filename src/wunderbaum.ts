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
import {
  ChangeType,
  default_debuglevel,
  RENDER_PREFETCH,
  ROW_HEIGHT,
  TargetType,
  WunderbaumOptions,
} from "./common";

// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];

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
  protected viewNodes: Set<WunderbaumNode> = new Set();
  protected rows: WunderbaumNode[] = [];
  activeNode: WunderbaumNode | null = null;
  opts: any;
  enableFilter = false;
  _enableUpdate = true;
  /** Shared properties, referenced by `node.type`. */
  types: any = {};
  /** List of column definitions. */
  columns: any[] = [];

  // ready: Promise<any>;

  constructor(options: WunderbaumOptions) {
    let opts = (this.opts = util.extend(
      {
        source: null, // URL for GET/PUT, ajax options, or callback
        element: null,
        debugLevel: default_debuglevel, // 0:quiet, 1:normal, 2:verbose
        columns: null,
        types: null,

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

    // --- Evaluate options
    this.columns = opts.columns || [];
    delete opts.columns;
    this.types = opts.types || {};
    delete opts.types;

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
    if (!this.nodeListElement) {
      alert("TODO: create markup");
    }

    // --- Load initial data
    if (opts.source) {
      this.nodeListElement.innerHTML =
        "<progress class='spinner'>loading...</progress>";
      this.load(opts.source).finally(() => {
        this.element.querySelector("progress.spinner")!.remove();
      });
    }
    // --- Bind listeners
    this.scrollContainer.addEventListener("scroll", (e: Event) => {
      this.updateViewport();
    });
    util.onEvent(this.nodeListElement, "click", "div.wb-row", (e) => {
      let info = this.getEventTarget(e),
        node = info.node;

      if (node) {
        node.setActive();
        if (info.type === TargetType.expander) {
          node.setExpanded(!node.isExpanded());
        } else if (info.type === TargetType.checkbox) {
          node.setSelected(!node.isSelected());
        }
      }
      // if(e.target.classList.)
      this.log("click", info);
    });
    util.onEvent(
      this.treeElement,
      "mousemove",
      "div.wb-header span.wb-col",
      (e) => {
        // this.log("mouse", e.target);
      }
    );
  }

  /** */
  public static getTree() { }

  /** */
  public static getNode(obj: any): WunderbaumNode | null {
    if (obj instanceof Event) {
      obj = obj.target;
    }
    if (obj instanceof Element) {
      let nodeElem = obj.closest("div.wb-row");
      return <WunderbaumNode>(<any>nodeElem!)._wb_node;
    }
    return null;
  }
  /** Return a {node: FancytreeNode, type: TYPE} object for a mouse event.
   *
   * @param {Event} event Mouse event, e.g. click, ...
   * @returns {object} Return a {node: FancytreeNode, type: TYPE} object
   *     TYPE: 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon' | undefined
   */
  getEventTarget(event: Event) {
    let target = <Element>event.target,
      cl = target.classList,
      node = Wunderbaum.getNode(event.target),
      res = { node: node, type: TargetType.unknown, column: undefined };

    if (cl.contains("wb-title")) {
      res.type = TargetType.title;
    } else if (cl.contains("wb-expander")) {
      res.type =
        node!.hasChildren() === false ? TargetType.prefix : TargetType.expander;
    } else if (cl.contains("wb-checkbox")) {
      res.type = TargetType.checkbox;
    } else if (cl.contains("wb-icon") || cl.contains("wb-custom-icon")) {
      res.type = TargetType.icon;
    } else if (cl.contains("wb-node")) {
      res.type = TargetType.title;
    } else if (cl.contains("wb-col")) {
      res.type = TargetType.column;
      let idx = Array.prototype.indexOf.call(target.parentNode!.children, target)
      res.column = node?.tree.columns[idx]
      // Somewhere near the title
      // } else if (event && event.target) {
      //   $target = $(event.target);
      //   if ($target.is("ul[role=group]")) {
      //     // #nnn: Clicking right to a node may hit the surrounding UL
      //     tree = res.node && res.node.tree;
      //     (tree || FT).debug("Ignoring click on outer UL.");
      //     res.node = null;
      //   } else if ($target.closest(".wb-title").length) {
      //     // #228: clicking an embedded element inside a title
      //     res.type = "title";
      //   } else if ($target.closest(".wb-checkbox").length) {
      //     // E.g. <svg> inside checkbox span
      //     res.type = "checkbox";
      //   } else if ($target.closest(".wb-expander").length) {
      //     res.type = "expander";
      //   }
    }
    return res;
  }
  /** Return a string describing the affected node region for a mouse event.
   *
   * @param {Event} event Mouse event, e.g. click, mousemove, ...
   * @returns {string} 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon' | undefined
   */
  getEventTargetType(event: Event) {
    return this.getEventTarget(event).type;
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
  render(opts: any): boolean {
    let label = this.logTime("render");
    let idx = 0;
    let top = 0;
    let height = ROW_HEIGHT;
    let modified = false;
    let start = opts.startIdx;
    let end = opts.endIdx;
    let obsoleteViewNodes = this.viewNodes;

    this.viewNodes = new Set();
    let viewNodes = this.viewNodes;
    // this.debug("render", opts);
    util.assert(start != null && end != null);
    // this.root.children![1].expanded = true;

    this.visitRows(function (node) {
      let prevIdx = node._rowIdx;

      viewNodes.add(node);
      obsoleteViewNodes.delete(node);
      if (prevIdx !== idx) {
        node._rowIdx = idx;
        modified = true;
      }
      if (idx < start || idx > end) {
        node.removeMarkup();
      } else {
        // if (!node._rowElem || prevIdx != idx) {
        node.render({ top: top });
      }
      idx++;
      top += height;
    });
    for (let prevNode of obsoleteViewNodes) {
      prevNode.removeMarkup();
    }
    // Resize tree container
    this.nodeListElement.style.height = "" + top + "px";
    this.logTimeEnd(label);
    return modified;
  }

  /** */
  updateViewport() {
    let height = this.scrollContainer.clientHeight;
    let ofs = this.scrollContainer.scrollTop;

    this.render({
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
    let children,
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
    return this.root.load(source);
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

  /** Update column headers and width. */
  setColumns(columns: any[], opts: any) {
    if (columns && columns.length) {
      this.columns = columns;
    }
    // for (let col of this.columns) {
    //   if (col.id === "*") {
    //     continue;
    //   }
    //   let colElem = document.createElement("span");
    //   colElem.classList.add("wb-col");
    //   colElem.textContent = "" + col.id;
    //   rowDiv.appendChild(colElem);
    // }
  }

  protected setModified(node: WunderbaumNode | null, change: ChangeType) {}
}
