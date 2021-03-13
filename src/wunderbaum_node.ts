/*!
 * wunderbaum.js - wunderbaum_node
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import "./wunderbaum.scss";
import * as util from "./util";
// import { PersistoOptions } from "./wb_options";

// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];

import { Wunderbaum } from "./wunderbaum";
import { ChangeType, ROW_HEIGHT } from "./common";

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
    this.key =
      data.key === undefined ? "" + ++WunderbaumNode.sequence : "" + data.key;
    // this.refKey = data.refKey;
  }

  /**
   * Return readable string representation for this instance.
   * @internal
   */
  toString() {
    return "WunderbaumNode@" + this.key + "<'" + this.title + "'>";
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

  getLevel() {
    let i = 0,
      p = this.parent;
    while (p) {
      i++;
      p = p.parent;
    }
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

  /** Return true if this node is a temporarily generated system node like
   * 'loading', 'paging', or 'error' (node.statusNodeType contains the type).
   */
  isStatusNode() {
    return !!this.statusNodeType;
  }

  /** Download  data from the cloud, then call `.update()`. */
  async load(source: any) {
    let tree = this.tree;
    let opts = tree.opts;

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
      opts.receive.call(tree, response);
      const data = await response.json();

      let prev = tree.enableUpdate(false);
      tree.addChildren(this, data);
      tree.enableUpdate(prev);
    } catch (error) {
      opts.error.call(tree, error);
    }

    if (opts.debugLevel >= 2) {
      console.timeEnd(this + ".load");
    }
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
    let iconMap = {
      expanderExpanded: "bi bi-dash-square",
      expanderCollapsed: "bi bi-plus-square",
      expanderLazy: "bi bi-x-square",
      checkChecked: "bi bi-check-square",
      checkUnchecked: "bi bi-square",
      checkUnknown: "bi dash-square-dotted",
      radioChecked: "bi bi-circle-fill",
      radioUnchecked: "bi bi-circle",
      radioUnknown: "bi bi-circle-dotted",
      folder: "bi bi-folder2",
      folderOpen: "bi bi-folder2-open",
      doc: "bi bi-file-earmark",
    };

    //
    let rowClasses = ["wb-row"];
    this.expanded ? rowClasses.push("wb-expanded") : 0;
    this.lazy ? rowClasses.push("wb-lazy") : 0;
    this.selected ? rowClasses.push("wb-selected") : 0;
    this === this.tree.activeNode ? rowClasses.push("wb-active") : 0;

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
      for (let col of tree.columns) {
        let colElem = document.createElement("span");
        colElem.classList.add("wb-col");
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

  setActive(flag: boolean = true) {
    let prev = this.tree.activeNode;
    this.tree.activeNode = this;
    prev?.setDirty(ChangeType.status);
    this.setDirty(ChangeType.status);
  }

  setDirty(type: ChangeType) {
    if (type === ChangeType.structure) {
      this.tree.updateViewport();
    } else if (this._rowElem) {
      // otherwise not in viewport, so no need to render
      this.render({});
    }
  }

  setExpanded(flag: boolean = true) {
    this.expanded = flag;
    this.setDirty(ChangeType.structure);
  }

  setSelected(flag: boolean = true) {
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
