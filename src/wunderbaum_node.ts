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

// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];

import { Wunderbaum, ChangeType } from "./wunderbaum";

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

  getLevel() {
    let i = 0, p = this.parent;
    while (p) { i++; p = p.parent; }
    return i;
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

  setActive(flag: boolean = true) {
    let prev = this.tree.activeNode;
    this.tree.activeNode = this;
    prev?.setDirty(ChangeType.status);
    this.setDirty(ChangeType.status);
  }

  setExpanded(flag: boolean = true) {
    this.expanded = flag;
    this.setDirty(ChangeType.structure);
  }

  setDirty(hint: ChangeType) {
    this.render({});
  }

  render(opts: any) {
    let parentElem: HTMLElement;
    let titleSpan: HTMLElement;
    let rowDiv = this._rowElem;

    if (rowDiv) {
      util.toggleClass(rowDiv, "wb-expanded", !!this.expanded);
      util.toggleClass(rowDiv, "wb-lazy", !!this.lazy);
      util.toggleClass(rowDiv, "wb-selected", !!this.selected);
      util.toggleClass(rowDiv, "wb-active", this === this.tree.activeNode);
      titleSpan = <HTMLElement>rowDiv.querySelector("span.wb-title");

    } else {
      let elem: HTMLElement,
        nodeElem: HTMLElement;

      parentElem = this.tree.nodeListElement;

      rowDiv = document.createElement("div");
      rowDiv.classList.add("wb-row");
      (<any>rowDiv)._wb_node = this
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

      for (let i = this.getLevel(); i > 0; i--) {
        elem = document.createElement("i");
        elem.classList.add("wb-indent");
        nodeElem.appendChild(elem);
      }

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
