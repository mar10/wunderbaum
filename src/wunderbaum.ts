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

const class_prefix = "wb-";
const node_props: string[] = ["title", "key", "refKey"];

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

  _rowIdx: number | undefined = 0;
  _rowElem: HTMLElement | undefined = undefined;

  constructor(tree: Wunderbaum, parent: WunderbaumNode, data: any) {
    util.assert(parent.tree === tree);
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

  /** Call fn(node) for all child nodes in hierarchical order (depth-first).<br>
   * Stop iteration, if fn() returns false. Skip current branch, if fn() returns "skip".<br>
   * Return false if iteration was stopped.
   *
   * @param {function} fn the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and
   *     its children only.
   * @param {boolean} [includeSelf=false]
   * @returns {boolean}
   */
  visit(callback: (node: WunderbaumNode) => any, includeSelf: boolean = false): any {
    let i,
      l,
      res :any = true,
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
 * Stop iteration, if fn() returns false.<br>
 * Return false if iteration was stopped.
 *
 * @param {function} fn the callback function.
 *     Return false to stop iteration, return "skip" to skip this node and children only.
 * @param {boolean} [includeSelf=false]
 * @returns {boolean}
 */
visitParents(callback: (node: WunderbaumNode) => any, includeSelf: boolean = false): any {
    // Visit parent nodes (bottom up)
  if (includeSelf && fn(this) === false) {
    return false;
  }
  let p = this.parent;
  while (p) {
    if (fn(p) === false) {
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
 * @param {boolean} [includeSelf=false]
 * @returns {boolean}
 */
visitSiblings(callback: (node: WunderbaumNode) => any, includeSelf: boolean = false): any {
    let i,
    l,
    n,
    ac = this.parent.children;

  for (i = 0, l = ac.length; i < l; i++) {
    n = ac[i];
    if (includeSelf || n !== this) {
      if (fn(n) === false) {
        return false;
      }
    }
  }
  return true;
}

setExpanded(flag: boolean = true) {
  this.expanded = flag;
}

render() {

}

addChild(node: WunderbaumNode, before ?: WunderbaumNode) {
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
 * See also [[PersistoOptions]].
 */
export class Wunderbaum {
  static version: string = "@VERSION"; // Set to semver by 'grunt release'
  static sequence = 0;

  readonly root: WunderbaumNode;
  readonly name: string;
  readonly element: any;

  protected keyMap: any = {};
  protected refKeyMap: any = {};
  protected rows: WunderbaumNode[] = [];
  protected activeNode: WunderbaumNode | null = null;
  protected opts: any;

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
      },
      options
    );
    this.name = opts.name || "wb_" + ++Wunderbaum.sequence;
    if (opts.source) {
      this.load(opts.source);
    }
  }

  /**
   * Return readable string representation for this instance.
   * @internal
   */
  toString() {
    return "Wunderbaum<'" + this.name + "'>";
  }

  /* Log to console if opts.debugLevel >= 2 */
  debug(...args: any[]) {
    if (this.opts.debugLevel >= 2) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }
  /* Log to console if opts.debugLevel >= 1 */
  log(...args: any[]) {
    if (this.opts.debugLevel >= 1) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }

  logTime(label: string): string {
    if (this.opts.debugLevel >= 1) {
      console.time(label);
    }
    return label;
  }

  logTimeEnd(label: string): void {
    if (this.opts.debugLevel >= 1) {
      console.timeEnd(label);
    }
  }

  /** */
  visit(callback: (WunderbaumNode), includeSelf: boolean = false) {
    return this.root.visit(callback, false);
  }

  /** */
  renumber() {
    let label = this.logTime("renumber");
    this.root.visit(function (node) {
    }, false);
    this.logTimeEnd(label);
  }

  /** . */
  load(source: any) {
    return this._load(this.root, source);
  }

  /** . */
  addChildren(parent: WunderbaumNode, data: any) {
    util.assert(util.isArray(data));
    for (let i = 0; data.length; i++) {
      let d = data[i];
      let children = d.children;
      delete d.children;
      let node = new WunderbaumNode(this, parent, d);
      parent.addChild(node);
      if (d.children) {
        this.addChildren(node, d.children);
      }
      break;
    }
    this.setModified(parent, ChangeType.children);
  }

  /**
   *
   */
  public enableUpdate(node: WunderbaumNode | null, change: ChangeType): boolean {
    return true;
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
            opts.pull.call(self, response);
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
          self.addChildren.call(self, parent, data);
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
