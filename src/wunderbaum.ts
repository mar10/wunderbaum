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
import { FilterExtension } from "./wb_ext_filter";
import { KeynavExtension } from "./wb_ext_keynav";
import { LoggerExtension } from "./wb_ext_logger";
import { DndExtension } from "./wb_ext_dnd";
import { ExtensionsDict, WunderbaumExtension } from "./wb_extension_base";

import {
  ChangeType,
  DEFAULT_DEBUGLEVEL,
  FilterModeType,
  makeNodeTitleStartMatcher,
  MatcherType,
  NavigationMode,
  NodeStatusType,
  RENDER_MAX_PREFETCH,
  ROW_HEIGHT,
  TargetType as NodeRegion,
  WunderbaumOptions,
} from "./common";
import { WunderbaumNode } from "./wb_node";
import { Deferred } from "./deferred";
import { DebouncedFunction, throttle } from "./debounce";
import { EditExtension } from "./wb_ext_edit";

// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];
const MAX_CHANGED_NODES = 10;

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
  readonly id: string;

  readonly element: HTMLDivElement;
  // readonly treeElement: HTMLDivElement;
  readonly headerElement: HTMLDivElement | null;
  readonly scrollContainer: HTMLDivElement;
  readonly nodeListElement: HTMLDivElement;
  readonly _updateViewportThrottled: DebouncedFunction<(...args: any) => void>;

  protected extensions: WunderbaumExtension[] = [];
  protected extensionDict: ExtensionsDict = {};
  // protected extensionMap = new Map<string, WunderbaumExtension>();

  /** Merged options from constructor args and tree- and extension defaults. */
  public options: WunderbaumOptions;

  protected keyMap = new Map<string, WunderbaumNode>();
  protected refKeyMap = new Map<string, Set<WunderbaumNode>>();
  protected viewNodes = new Set<WunderbaumNode>();
  // protected rows: WunderbaumNode[] = [];
  // protected _rowCount = 0;

  public activeNode: WunderbaumNode | null = null;
  public focusNode: WunderbaumNode | null = null;
  _disableUpdate = 0;
  _disableUpdateCount = 0;

  /** Shared properties, referenced by `node.type`. */
  public types: { [key: string]: any } = {};
  /** List of column definitions. */
  public columns: any[] = [];
  public _columnsById: { [key: string]: any } = {};

  // Modification Status
  protected changedSince = 0;
  protected changes = new Set<ChangeType>();
  protected changedNodes = new Set<WunderbaumNode>();

  // --- FILTER ---
  public filterMode: FilterModeType = null;

  // --- KEYNAV ---
  public activeColIdx = 0;
  public cellNavMode = false;
  public lastQuicksearchTime = 0;
  public lastQuicksearchTerm = "";

  readonly ready: Promise<any>;

  constructor(options: WunderbaumOptions) {
    let opts = (this.options = util.extend(
      {
        id: null,
        source: null, // URL for GET/PUT, ajax options, or callback
        element: null, // <div class="wunderbaum">
        debugLevel: DEFAULT_DEBUGLEVEL, // 0:quiet, 1:errors, 2:warnings, 3:info, 4:verbose
        header: null, // Show/hide header (pass bool or string)
        headerHeightPx: ROW_HEIGHT,
        rowHeightPx: ROW_HEIGHT,
        columns: null,
        types: null,
        escapeTitles: true,
        showSpinner: false,
        checkbox: true,
        minExpandLevel: 0,
        updateThrottleWait: 200,
        skeleton: false,
        // --- KeyNav ---
        navigationMode: NavigationMode.allow,
        quicksearch: true,
        // --- Events ---
        change: util.noop,
        enhanceTitle: util.noop,
        error: util.noop,
        receive: util.noop,
        // --- Strings ---
        strings: {
          loadError: "Error",
          loading: "Loading...",
          // loading: "Loading&hellip;",
          noData: "No data",
        },
      },
      options
    ));

    const readyDeferred = new Deferred();
    this.ready = readyDeferred.promise();

    this.id = opts.id || "wb_" + ++Wunderbaum.sequence;
    this.root = new WunderbaumNode(this, <WunderbaumNode>(<unknown>null), {
      key: "__root__",
      // title: "__root__",
    });

    this._registerExtension(new KeynavExtension(this));
    this._registerExtension(new EditExtension(this));
    this._registerExtension(new FilterExtension(this));
    this._registerExtension(new DndExtension(this));
    this._registerExtension(new LoggerExtension(this));

    // --- Evaluate options
    this.columns = opts.columns;
    delete opts.columns;
    if (!this.columns) {
      let defaultName = typeof opts.header === "string" ? opts.header : this.id;
      this.columns = [{ id: "*", title: defaultName, width: "*" }];
    }

    this.types = opts.types || {};
    delete opts.types;
    // Convert `TYPE.classes` to a Set
    for (let t of Object.values(this.types) as any) {
      if (t.classes) {
        t.classes = util.toSet(t.classes);
      }
    }

    if (this.columns.length === 1) {
      opts.navigationMode = NavigationMode.off;
    }

    if (
      opts.navigationMode === NavigationMode.force ||
      opts.navigationMode === NavigationMode.start
    ) {
      this.cellNavMode = true;
    }

    this._updateViewportThrottled = throttle(
      () => {
        this._updateViewport();
      },
      opts.updateThrottleWait,
      { leading: true, trailing: true }
    );

    // --- Create Markup
    this.element = util.elemFromSelector(opts.element) as HTMLDivElement;
    util.assert(!!this.element, `Invalid 'element' option: ${opts.element}`);

    this.element.classList.add("wunderbaum");
    if (!this.element.getAttribute("tabindex")) {
      this.element.tabIndex = 0;
    }

    // Attach tree instance to <div>
    (<any>this.element)._wb_tree = this;

    // Create header markup, or take it from the existing html

    this.headerElement = this.element.querySelector(
      "div.wb-header"
    ) as HTMLDivElement;

    let wantHeader =
      opts.header == null ? this.columns.length > 1 : !!opts.header;

    if (this.headerElement) {
      // User existing header markup to define `this.columns`
      util.assert(
        !this.columns,
        "`opts.columns` must not be set if markup already contains a header"
      );
      this.columns = [];
      let rowElement = this.headerElement.querySelector(
        "div.wb-row"
      ) as HTMLDivElement;
      for (let colDiv of rowElement.querySelectorAll("div")) {
        this.columns.push({
          id: colDiv.dataset.id || null,
          text: "" + colDiv.textContent,
        });
      }
    } else if (wantHeader) {
      // We need a row div, the rest will be computed from `this.columns`
      let coldivs = "<span class='wb-col'></span>".repeat(this.columns.length);
      this.element.innerHTML = `
        <div class='wb-header'>
          <div class='wb-row'>
            ${coldivs}
          </div>
        </div>`;
      // this.updateColumns({ render: false });
    } else {
      this.element.innerHTML = ``;
    }

    //
    this.element.innerHTML += `
      <div class="wb-scroll-container">
        <div class="wb-node-list"></div>
      </div>`;
    this.scrollContainer = this.element.querySelector(
      "div.wb-scroll-container"
    ) as HTMLDivElement;
    this.nodeListElement = this.scrollContainer.querySelector(
      "div.wb-node-list"
    ) as HTMLDivElement;
    this.headerElement = this.element.querySelector(
      "div.wb-header"
    ) as HTMLDivElement;

    if (this.columns.length > 1) {
      this.element.classList.add("wb-grid");
    }

    this._initExtensions();

    // --- Load initial data
    if (opts.source) {
      if (opts.showSpinner) {
        this.nodeListElement.innerHTML =
          "<progress class='spinner'>loading...</progress>";
      }
      this.load(opts.source)
        .then(() => {
          readyDeferred.resolve();
        })
        .catch((error) => {
          readyDeferred.reject(error);
        })
        .finally(() => {
          this.element.querySelector("progress.spinner")?.remove();
          this.element.classList.remove("wb-initializing");
          // this.updateViewport();
        });
    } else {
      // this.updateViewport();
      readyDeferred.resolve();
    }

    // TODO: This is sometimes required, because this.element.clientWidth
    //       has a wrong value at start???
    setTimeout(() => {
      this.updateViewport();
    }, 50);

    // --- Bind listeners
    this.scrollContainer.addEventListener("scroll", (e: Event) => {
      this.updateViewport();
    });
    window.addEventListener("resize", (e: Event) => {
      this.updateViewport();
    });
    util.onEvent(this.nodeListElement, "click", "div.wb-row", (e) => {
      let info = Wunderbaum.getEventInfo(e),
        node = info.node;

      if (
        this._callEvent("click", { node: node, info: info, event: e }) === false
      ) {
        return false;
      }
      if (node) {
        if (info.colIdx >= 0) {
          node.setActive(true, { colIdx: info.colIdx, event: e });
        } else {
          node.setActive(true, { event: e });
        }
        if (info.region === NodeRegion.expander) {
          node.setExpanded(!node.isExpanded());
        } else if (info.region === NodeRegion.checkbox) {
          node.setSelected(!node.isSelected());
        }
      }
      // if(e.target.classList.)
      // this.log("click", info);
    });

    util.onEvent(this.element, "keydown", (e) => {
      this._callHook("onKeyEvent", { event: e });
    });

    util.onEvent(this.element, "focusin focusout", (e) => {
      const flag = e.type === "focusin";

      this._callEvent("focus", { flag: flag, event: e });
      // if (flag && !this.activeNode ) {
      //   setTimeout(() => {
      //     if (!this.activeNode) {
      //       const firstNode = this.getFirstChild();
      //       if (firstNode && !firstNode?.isStatusNode()) {
      //         firstNode.logInfo("Activate on focus", e);
      //         firstNode.setActive(true, { event: e });
      //       }
      //     }
      //   }, 10);
      // }
    });
  }

  /** Return a Wunderbaum instance, from element, index, or event.
   *
   * @example
   * getTree();  // Get first Wunderbaum instance on page
   * getTree(1);  // Get second Wunderbaum instance on page
   * getTree(event);  // Get tree for this mouse- or keyboard event
   * getTree("foo");  // Get tree for this `tree.options.id`
   * getTree("#tree");  // Get tree for this matching element
   */
  public static getTree(
    el?: Element | Event | number | string | WunderbaumNode
  ): Wunderbaum | null {
    if (el instanceof Wunderbaum) {
      return el;
    } else if (el instanceof WunderbaumNode) {
      return el.tree;
    }
    if (el === undefined) {
      el = 0; // get first tree
    }
    if (typeof el === "number") {
      el = document.querySelectorAll(".wunderbaum")[el]; // el was an integer: return nth element
    } else if (typeof el === "string") {
      // Search all trees for matching ID
      for (let treeElem of document.querySelectorAll(".wunderbaum")) {
        const tree = (<any>treeElem)._wb_tree;
        if (tree && tree.id === el) {
          return tree;
        }
      }
      // Search by selector
      el = document.querySelector(el)!;
      if (!el) {
        return null;
      }
    } else if ((<Event>el).target) {
      el = (<Event>el).target as Element;
    }
    util.assert(el instanceof Element);
    if (!(<HTMLElement>el).matches(".wunderbaum")) {
      el = (<HTMLElement>el).closest(".wunderbaum")!;
    }

    if (el && (<any>el)._wb_tree) {
      return (<any>el)._wb_tree;
    }
    return null;
  }

  /** Return a WunderbaumNode instance from element, event.
   *
   * @param  el
   */
  public static getNode(el: Element | Event): WunderbaumNode | null {
    if (!el) {
      return null;
    } else if (el instanceof WunderbaumNode) {
      return el;
    } else if ((<Event>el).target !== undefined) {
      el = (<Event>el).target! as Element; // el was an Event
    }
    // `el` is a DOM element
    // let nodeElem = obj.closest("div.wb-row");
    while (el) {
      if ((<any>el)._wb_node) {
        return (<any>el)._wb_node as WunderbaumNode;
      }
      el = (<Element>el).parentElement!; //.parentNode;
    }
    return null;
  }

  /** */
  protected _registerExtension(extension: WunderbaumExtension): void {
    this.extensions.push(extension);
    this.extensionDict[extension.id] = extension;
    // this.extensionMap.set(extension.id, extension);
  }

  /** Called on tree (re)init after markup is created, before loading. */
  protected _initExtensions(): void {
    for (let ext of this.extensions) {
      ext.init();
    }
  }

  /** Add node to tree's bookkeeping data structures. */
  _registerNode(node: WunderbaumNode): void {
    let key = node.key;
    util.assert(key != null && !this.keyMap.has(key));
    this.keyMap.set(key, node);
    let rk = node.refKey;
    if (rk) {
      let rks = this.refKeyMap.get(rk); // Set of nodes with this refKey
      if (rks) {
        rks.add(node);
      } else {
        this.refKeyMap.set(rk, new Set());
      }
    }
  }

  /** Remove node from tree's bookkeeping data structures. */
  _unregisterNode(node: WunderbaumNode): void {
    const rk = node.refKey;
    if (rk) {
      const rks = this.refKeyMap.get(rk);
      if (rks && rks.delete(node) && !rks.size) {
        // We just removed the last element
        this.refKeyMap.delete(rk);
      }
    }
    // mark as disposed
    (node.tree as any) = null;
    (node.parent as any) = null;
    // node.title = "DISPOSED: " + node.title
    this.viewNodes.delete(node);
    node.removeMarkup();
  }

  /** Call all hook methods of all registered extensions.*/
  protected _callHook(hook: keyof WunderbaumExtension, data: any = {}): any {
    let res;
    let d = util.extend(
      {},
      { tree: this, options: this.options, result: undefined },
      data
    );

    for (let ext of this.extensions) {
      res = (<any>ext[hook]).call(ext, d);
      if (res === false) {
        break;
      }
      if (d.result !== undefined) {
        res = d.result;
      }
    }
    return res;
  }

  /* Call event if defined in options. */
  _callEvent(name: string, extra?: any): any {
    const [p, n] = name.split(".");
    let func = n ? this.options[p][n] : this.options[p];
    if (func) {
      return func.call(this, util.extend({ name: name, tree: this }, extra));
    }
  }

  /** Return the topmost visible node in the viewport */
  protected _firstNodeInView(complete = true) {
    let topIdx: number, node: WunderbaumNode;
    if (complete) {
      topIdx = Math.ceil(this.scrollContainer.scrollTop / ROW_HEIGHT);
    } else {
      topIdx = Math.floor(this.scrollContainer.scrollTop / ROW_HEIGHT);
    }
    // TODO: start searching from active node (reverse)
    this.visitRows((n) => {
      if (n._rowIdx === topIdx) {
        node = n;
        return false;
      }
    });
    return <WunderbaumNode>node!;
  }

  /** Return the lowest visible node in the viewport */
  protected _lastNodeInView(complete = true) {
    let bottomIdx: number, node: WunderbaumNode;
    if (complete) {
      bottomIdx =
        Math.floor(
          (this.scrollContainer.scrollTop + this.scrollContainer.clientHeight) /
            ROW_HEIGHT
        ) - 1;
    } else {
      bottomIdx =
        Math.ceil(
          (this.scrollContainer.scrollTop + this.scrollContainer.clientHeight) /
            ROW_HEIGHT
        ) - 1;
    }
    // TODO: start searching from active node
    this.visitRows((n) => {
      if (n._rowIdx === bottomIdx) {
        node = n;
        return false;
      }
    });
    return <WunderbaumNode>node!;
  }

  /** Return preceeding visible node in the viewport */
  protected _getPrevNodeInView(node?: WunderbaumNode, ofs = 1) {
    this.visitRows(
      (n) => {
        node = n;
        if (ofs-- <= 0) {
          return false;
        }
      },
      { reverse: true, start: node || this.getActiveNode() }
    );
    return node;
  }

  /** Return following visible node in the viewport */
  protected _getNextNodeInView(node?: WunderbaumNode, ofs = 1) {
    this.visitRows(
      (n) => {
        node = n;
        if (ofs-- <= 0) {
          return false;
        }
      },
      { reverse: false, start: node || this.getActiveNode() }
    );
    return node;
  }

  addChildren(nodeData: any, options?: any): WunderbaumNode {
    return this.root.addChildren(nodeData, options);
  }

  clear() {
    this.root.removeChildren();
    this.root.children = null;
    this.keyMap.clear();
    this.refKeyMap.clear();
    this.viewNodes.clear();
    this.activeNode = null;
    this.focusNode = null;

    // this.types = {};
    // this. columns =[];
    // this._columnsById = {};

    // Modification Status
    this.changedSince = 0;
    this.changes.clear();
    this.changedNodes.clear();

    // // --- FILTER ---
    // public filterMode: FilterModeType = null;

    // // --- KEYNAV ---
    // public activeColIdx = 0;
    // public cellNavMode = false;
    // public lastQuicksearchTime = 0;
    // public lastQuicksearchTerm = "";
    this.updateViewport();
  }

  /**
   * Return `tree.option.NAME` (also resolving if this is a callback).
   *
   * See also [[WunderbaumNode.getOption()]] to consider `node.NAME` setting and
   * `tree.types[node.type].NAME`.
   *
   * @param name options name (use dot natation to acces exension option, e.g. `filter.mode`)
   */
  getOption(name: string, defaultValue?: any): any {
    let opts = this.options;

    // Lookup `name` in options dict
    if (name.indexOf(".") >= 0) {
      [opts, name] = name.split(".");
    }
    let value = opts[name];

    // A callback resolver always takes precedence
    if (typeof value === "function") {
      value = value({ type: "resolve", tree: this });
    }
    // Use value from value options dict, fallback do default
    return value ?? defaultValue;
  }

  /**
   *
   * @param name
   * @param value
   */
  setOption(name: string, value: any): void {
    if (name.indexOf(".") === -1) {
      this.options[name] = value;
      // switch (name) {
      //   case value:
      //     break;
      //   default:
      //     break;
      // }
      return;
    }
    const parts = name.split(".");
    const ext = this.extensionDict[parts[0]];
    ext!.setOption(parts[1], value);
  }

  /** Run code, but defer `updateViewport()` until done. */
  runWithoutUpdate(func: () => any, hint = null): void {
    // const prev = this._disableUpdate;
    // const start = Date.now();
    // this._disableUpdate = Date.now();
    try {
      this.enableUpdate(false);
      return func();
    } finally {
      this.enableUpdate(true);
      // if (!prev && this._disableUpdate === start) {
      //   this._disableUpdate = 0;
      // }
    }
  }

  /** */
  async expandAll(flag: boolean = true) {
    const tag = this.logTime("expandAll(" + flag + ")");
    try {
      this.enableUpdate(false);
      await this.root.expandAll(flag);
    } finally {
      this.enableUpdate(true);
      this.logTimeEnd(tag);
    }
  }

  /** */
  count(visible = false) {
    if (visible) {
      return this.viewNodes.size;
    }
    return this.keyMap.size;
  }

  /** */
  _check() {
    let i = 0;
    this.visit((n) => {
      i++;
    });
    if (this.keyMap.size !== i) {
      this.logWarn(`_check failed: ${this.keyMap.size} !== ${i}`);
    }
    // util.assert(this.keyMap.size === i);
  }

  /**Find all nodes that matches condition.
   *
   * @param match title string to search for, or a
   *     callback function that returns `true` if a node is matched.
   * @see [[WunderbaumNode.findAll]]
   */
  findAll(match: string | MatcherType) {
    return this.root.findAll(match);
  }

  /**Find first node that matches condition.
   *
   * @param match title string to search for, or a
   *     callback function that returns `true` if a node is matched.
   * @see [[WunderbaumNode.findFirst]]
   */
  findFirst(match: string | MatcherType) {
    return this.root.findFirst(match);
  }

  /** Find the next visible node that starts with `match`, starting at `startNode`
   * and wrap-around at the end.
   */
  findNextNode(
    match: string | MatcherType,
    startNode?: WunderbaumNode | null
  ): WunderbaumNode | null {
    //, visibleOnly) {
    let res: WunderbaumNode | null = null,
      firstNode = this.getFirstChild()!;

    let matcher =
      typeof match === "string" ? makeNodeTitleStartMatcher(match) : match;
    startNode = startNode || firstNode;

    function _checkNode(n: WunderbaumNode) {
      // console.log("_check " + n)
      if (matcher(n)) {
        res = n;
      }
      if (res || n === startNode) {
        return false;
      }
    }
    this.visitRows(_checkNode, {
      start: startNode,
      includeSelf: false,
    });
    // Wrap around search
    if (!res && startNode !== firstNode) {
      this.visitRows(_checkNode, {
        start: firstNode,
        includeSelf: true,
      });
    }
    return res;
  }

  /** Find a node relative to another node.
   *
   * @param node
   * @param where 'down', 'first', 'last', 'left', 'parent', 'right', or 'up'.
   *   (Alternatively the keyCode that would normally trigger this move,
   *   e.g. `$.ui.keyCode.LEFT` = 'left'.
   * @param includeHidden Not yet implemented
   */
  findRelatedNode(node: WunderbaumNode, where: string, includeHidden = false) {
    let res = null;
    let pageSize = Math.floor(this.scrollContainer.clientHeight / ROW_HEIGHT);

    switch (where) {
      case "parent":
        if (node.parent && node.parent.parent) {
          res = node.parent;
        }
        break;
      case "first":
        // First visible node
        this.visit(function (n) {
          if (n.isVisible()) {
            res = n;
            return false;
          }
        });
        break;
      case "last":
        this.visit(function (n) {
          // last visible node
          if (n.isVisible()) {
            res = n;
          }
        });
        break;
      case "left":
        if (node.parent && node.parent.parent) {
          res = node.parent;
        }
        // if (node.expanded) {
        //   node.setExpanded(false);
        // } else if (node.parent && node.parent.parent) {
        //   res = node.parent;
        // }
        break;
      case "right":
        if (node.children && node.children.length) {
          res = node.children[0];
        }
        // if (this.cellNavMode) {
        //   throw new Error("Not implemented");
        // } else {
        //   if (!node.expanded && (node.children || node.lazy)) {
        //     node.setExpanded();
        //     res = node;
        //   } else if (node.children && node.children.length) {
        //     res = node.children[0];
        //   }
        // }
        break;
      case "up":
        res = this._getPrevNodeInView(node);
        break;
      case "down":
        res = this._getNextNodeInView(node);
        break;
      case "pageDown":
        let bottomNode = this._lastNodeInView();
        // this.logDebug(where, this.focusNode, bottomNode);

        if (this.focusNode !== bottomNode) {
          res = bottomNode;
        } else {
          res = this._getNextNodeInView(node, pageSize);
        }
        break;
      case "pageUp":
        if (this.focusNode && this.focusNode._rowIdx === 0) {
          res = this.focusNode;
        } else {
          let topNode = this._firstNodeInView();
          if (this.focusNode !== topNode) {
            res = topNode;
          } else {
            res = this._getPrevNodeInView(node, pageSize);
          }
        }
        break;
      default:
        this.logWarn("Unknown relation '" + where + "'.");
    }
    return res;
  }

  /**
   * Return the currently active node or null.
   */
  getActiveNode() {
    return this.activeNode;
  }

  /** Return the first top level node if any (not the invisible root node).
   * @returns {FancytreeNode | null}
   */
  getFirstChild() {
    return this.root.getFirstChild();
  }

  /**
   * Return the currently active node or null.
   */
  getFocusNode() {
    return this.focusNode;
  }

  /** Return a {node: FancytreeNode, region: TYPE} object for a mouse event.
   *
   * @param {Event} event Mouse event, e.g. click, ...
   * @returns {object} Return a {node: FancytreeNode, region: TYPE} object
   *     TYPE: 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon' | undefined
   */
  static getEventInfo(event: Event) {
    let target = <Element>event.target,
      cl = target.classList,
      parentCol = target.closest(".wb-col"),
      node = Wunderbaum.getNode(target),
      res = {
        node: node,
        region: NodeRegion.unknown,
        colDef: undefined,
        colIdx: -1,
        colId: undefined,
        colElem: parentCol,
      };

    if (cl.contains("wb-title")) {
      res.region = NodeRegion.title;
    } else if (cl.contains("wb-expander")) {
      res.region =
        node!.hasChildren() === false ? NodeRegion.prefix : NodeRegion.expander;
    } else if (cl.contains("wb-checkbox")) {
      res.region = NodeRegion.checkbox;
    } else if (cl.contains("wb-icon")) {
      //|| cl.contains("wb-custom-icon")) {
      res.region = NodeRegion.icon;
    } else if (cl.contains("wb-node")) {
      res.region = NodeRegion.title;
    } else if (parentCol) {
      res.region = NodeRegion.column;
      const idx = Array.prototype.indexOf.call(
        parentCol.parentNode!.children,
        parentCol
      );
      res.colIdx = idx;
    } else {
      // Somewhere near the title
      console.warn("getEventInfo(): not found", event, res);
      return res;
    }
    if (res.colIdx === -1) {
      res.colIdx = 0;
    }
    res.colDef = node!.tree.columns[res.colIdx];
    res.colDef != null ? (res.colId = (<any>res.colDef).id) : 0;
    // this.log("Event", event, res);
    return res;
  }

  // /** Return a string describing the affected node region for a mouse event.
  //  *
  //  * @param {Event} event Mouse event, e.g. click, mousemove, ...
  //  * @returns {string} 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon' | undefined
  //  */
  // getEventNodeRegion(event: Event) {
  //   return this.getEventInfo(event).region;
  // }

  /**
   * Return readable string representation for this instance.
   * @internal
   */
  toString() {
    return "Wunderbaum<'" + this.id + "'>";
  }

  /** Return true if any node is currently beeing loaded, i.e. a Ajax request is pending.
   */
  isLoading() {
    var res = false;

    this.root.visit((n) => {
      // also visit rootNode
      if (n._isLoading || n._requestId) {
        res = true;
        return false;
      }
    }, true);
    return res;
  }

  /** Alias for `logDebug` */
  log = this.logDebug; // Alias

  /** Log to console if opts.debugLevel >= 4 */
  logDebug(...args: any[]) {
    if (this.options.debugLevel >= 4) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }

  /** Log error to console. */
  logError(...args: any[]) {
    if (this.options.debugLevel >= 1) {
      Array.prototype.unshift.call(args, this.toString());
      console.error.apply(console, args);
    }
  }

  /* Log to console if opts.debugLevel >= 3 */
  logInfo(...args: any[]) {
    if (this.options.debugLevel >= 3) {
      Array.prototype.unshift.call(args, this.toString());
      console.info.apply(console, args);
    }
  }

  /** @internal */
  logTime(label: string): string {
    if (this.options.debugLevel >= 4) {
      console.time(this + ": " + label);
    }
    return label;
  }

  /** @internal */
  logTimeEnd(label: string): void {
    if (this.options.debugLevel >= 4) {
      console.timeEnd(this + ": " + label);
    }
  }

  /** Log to console if opts.debugLevel >= 2 */
  logWarn(...args: any[]) {
    if (this.options.debugLevel >= 2) {
      Array.prototype.unshift.call(args, this.toString());
      console.warn.apply(console, args);
    }
  }

  /** */
  protected render(opts?: any): boolean {
    let label = this.logTime("render");
    let idx = 0;
    let top = 0;
    let height = ROW_HEIGHT;
    let modified = false;
    let start = opts?.startIdx;
    let end = opts?.endIdx;
    let obsoleteViewNodes = this.viewNodes;

    this.viewNodes = new Set();
    let viewNodes = this.viewNodes;
    // this.debug("render", opts);
    util.assert(start != null && end != null);

    // Make sure start is always even, so the alternating row colors don't
    // change when scrolling:
    if (start % 2) {
      start--;
    }

    this.visitRows(function (node) {
      let prevIdx = node._rowIdx;

      viewNodes.add(node);
      obsoleteViewNodes.delete(node);
      if (prevIdx !== idx) {
        node._rowIdx = idx;
        modified = true;
      }
      if (idx < start || idx > end) {
        node._callEvent("discard");
        node.removeMarkup();
      } else {
        // if (!node._rowElem || prevIdx != idx) {
        node.render({ top: top });
      }
      idx++;
      top += height;
    });
    for (let prevNode of obsoleteViewNodes) {
      prevNode._callEvent("discard");
      prevNode.removeMarkup();
    }
    // Resize tree container
    this.nodeListElement.style.height = "" + top + "px";
    // this.log("render()", this.nodeListElement.style.height);
    this.logTimeEnd(label);
    return modified;
  }

  /**Recalc and apply header columns from `this.columns`. */
  renderHeader() {
    if (!this.headerElement) {
      return;
    }
    let headerRow = this.headerElement.querySelector(".wb-row");

    if (!headerRow) {
      util.assert(false);
    }
    for (let i = 0; i < this.columns.length; i++) {
      let col = this.columns[i];
      let colElem = <HTMLElement>headerRow!.children[i];
      colElem.style.left = col._ofsPx + "px";
      colElem.style.width = col._widthPx + "px";
      colElem.textContent = col.title || col.id;
    }
  }

  /**
   *
   * @param {boolean | PlainObject} [effects=false] animation options.
   * @param {object} [options=null] {topNode: null, effects: ..., parent: ...}
   *     this node will remain visible in
   *     any case, even if `this` is outside the scroll pane.
   * Make sure that a node is scrolled into the viewport.
   */
  scrollTo(opts: any) {
    const MARGIN = 1;
    const node = opts.node || this.getActiveNode();
    util.assert(node._rowIdx != null);
    const curTop = this.scrollContainer.scrollTop;
    const height = this.scrollContainer.clientHeight;
    const nodeOfs = node._rowIdx * ROW_HEIGHT;
    let newTop;

    if (nodeOfs > curTop) {
      if (nodeOfs + ROW_HEIGHT < curTop + height) {
        // Already in view
      } else {
        // Node is below viewport
        newTop = nodeOfs - height + ROW_HEIGHT - MARGIN;
      }
    } else if (nodeOfs < curTop) {
      // Node is above viewport
      newTop = nodeOfs + MARGIN;
    }
    this.log("scrollTo(" + nodeOfs + "): " + curTop + " => " + newTop, height);
    if (newTop != null) {
      this.scrollContainer.scrollTop = newTop;
      this.updateViewport();
    }
  }

  /** */
  setCellMode(flag = true) {
    flag = !!flag;
    // util.assert(this.cellNavMode);
    // util.assert(0 <= colIdx && colIdx < this.columns.length);
    if (flag === this.cellNavMode) {
      return;
    }
    // if( flag ) {
    // }else{
    // }
    // this.activeColIdx = 0;
    this.cellNavMode = flag;
    if (flag) {
      this.setColumn(0);
    }
    this.element.classList.toggle("wb-cell-mode", flag);
    this.setModified(ChangeType.row, this.activeNode);
  }

  /** */
  setColumn(colIdx: number) {
    util.assert(this.cellNavMode);
    util.assert(0 <= colIdx && colIdx < this.columns.length);
    this.activeColIdx = colIdx;
    // node.setActive(true, { column: tree.activeColIdx + 1 });
    this.setModified(ChangeType.row, this.activeNode);
    // Update `wb-active` class for all headers
    if (this.headerElement) {
      for (let rowDiv of this.headerElement.children) {
        // for (let rowDiv of document.querySelector("div.wb-header").children) {
        let i = 0;
        for (let colDiv of rowDiv.children) {
          (colDiv as HTMLElement).classList.toggle("wb-active", i++ === colIdx);
        }
      }
    }
    // Update `wb-active` class for all cell divs
    for (let rowDiv of this.nodeListElement.children) {
      let i = 0;
      for (let colDiv of rowDiv.children) {
        (colDiv as HTMLElement).classList.toggle("wb-active", i++ === colIdx);
      }
    }
  }

  /** */
  setModified(change: ChangeType, options?: any): void;

  /** */
  setModified(
    change: ChangeType,
    node?: WunderbaumNode | any,
    options?: any
  ): void {
    if (!(node instanceof WunderbaumNode)) {
      options = node;
    }
    if (!this.changedSince) {
      this.changedSince = Date.now();
    }
    this.changes.add(change);
    if (change === ChangeType.structure) {
      this.changedNodes.clear();
    } else if (node && !this.changes.has(ChangeType.structure)) {
      if (this.changedNodes.size < MAX_CHANGED_NODES) {
        this.changedNodes.add(node);
      } else {
        this.changes.add(ChangeType.structure);
        this.changedNodes.clear();
      }
    }
    // this.log("setModified(" + change + ")", node);
  }

  setStatus(
    status: NodeStatusType,
    message?: string,
    details?: string
  ): WunderbaumNode | null {
    return this.root.setStatus(status, message, details);
  }

  /** Update column headers and width. */
  updateColumns(opts: any) {
    let modified = false;
    let minWidth = 4;
    let vpWidth = this.element.clientWidth;
    let totalWeight = 0;
    let fixedWidth = 0;

    // Gather width requests
    this._columnsById = {};
    for (let col of this.columns) {
      this._columnsById[<string>col.id] = col;
      let cw = col.width;

      if (!cw || cw === "*") {
        col._weight = 1.0;
        totalWeight += 1.0;
      } else if (typeof cw === "number") {
        col._weight = cw;
        totalWeight += cw;
      } else if (typeof cw === "string" && cw.endsWith("px")) {
        col._weight = 0;
        let px = parseFloat(cw.slice(0, -2));
        if (col._widthPx != px) {
          modified = true;
          col._widthPx = px;
        }
        fixedWidth += px;
      } else {
        util.error("Invalid column width: " + cw);
      }
    }
    // Share remaining space between non-fixed columns
    let restPx = Math.max(0, vpWidth - fixedWidth);
    let ofsPx = 0;

    for (let col of this.columns) {
      if (col._weight) {
        let px = Math.max(minWidth, (restPx * col._weight) / totalWeight);
        if (col._widthPx != px) {
          modified = true;
          col._widthPx = px;
        }
      }
      col._ofsPx = ofsPx;
      ofsPx += col._widthPx;
    }
    // Every column has now a calculated `_ofsPx` and `_widthPx`
    // this.logInfo("UC", this.columns, vpWidth, this.element.clientWidth, this.element);
    // console.trace();
    // util.error("BREAK");
    if (modified) {
      this.renderHeader();
      if (opts.render !== false) {
        this.render();
      }
    }
  }

  /** Render all rows that are visible in the viewport. */
  updateViewport(immediate = false) {
    // Call the `throttle` wrapper for `this._updateViewport()` which will
    // execute immediately on the leading edge of a sequence:
    this._updateViewportThrottled();
    if (immediate) {
      this._updateViewportThrottled.flush();
    }
  }

  protected _updateViewport() {
    if (this._disableUpdate) {
      return;
    }
    let height = this.scrollContainer.clientHeight;
    // We cannot get the height for abolut positioned parent, so look at first col
    // let headerHeight = this.headerElement.clientHeight
    // let headerHeight = this.headerElement.children[0].children[0].clientHeight;
    const headerHeight = this.options.headerHeightPx;
    let wantHeight = this.element.clientHeight - headerHeight;
    let ofs = this.scrollContainer.scrollTop;

    if (Math.abs(height - wantHeight) > 1.0) {
      // this.log("resize", height, wantHeight);
      this.scrollContainer.style.height = wantHeight + "px";
      height = wantHeight;
    }

    this.updateColumns({ render: false });
    this.render({
      startIdx: Math.max(0, ofs / ROW_HEIGHT - RENDER_MAX_PREFETCH),
      endIdx: Math.max(0, (ofs + height) / ROW_HEIGHT + RENDER_MAX_PREFETCH),
    });
    this._callEvent("update");
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
   * @param callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and children only.
   * @param [options]
   *     Defaults:
   *     {start: First tree node, reverse: false, includeSelf: true, includeHidden: false, wrap: false}
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
      stopNode: WunderbaumNode,
      siblingOfs = 0,
      skipFirstNode = opts.includeSelf === false,
      includeHidden = !!opts.includeHidden,
      checkFilter = !includeHidden && this.filterMode === "hide",
      node: WunderbaumNode = opts.start || this.root.children![0];

    parent = node.parent;
    while (parent) {
      // visit siblings
      siblings = parent.children!;
      nextIdx = siblings.indexOf(node) + siblingOfs;
      util.assert(
        nextIdx >= 0,
        "Could not find " + node + " in parent's children: " + parent
      );

      for (i = nextIdx; i < siblings.length; i++) {
        node = siblings[i];
        if (node === stopNode!) {
          return false;
        }
        if (
          checkFilter &&
          !node.statusNodeType &&
          !node.match &&
          !node.subMatchCount
        ) {
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
            if (n === stopNode) {
              return false;
            }
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

      if (!parent && opts.wrap) {
        this.logDebug("visitRows(): wrap around");
        util.assert(opts.start, "`wrap` option requires `start`");
        stopNode = opts.start;
        opts.wrap = false;
        parent = this.root;
        siblingOfs = 0;
      }
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

    if (opts.includeSelf !== false) {
      if (callback(node) === false) {
        return false;
      }
    }
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
    }
    return true;
  }

  /** . */
  load(source: any, options: any = {}) {
    this.clear();
    if (options.columns) {
      this.columns = options.columns;
    }
    return this.root.load(source);
  }

  /**
   *
   */
  public enableUpdate(flag: boolean): void {
    /*
        5  7  9                20       25   30
    1   >-------------------------------------<
    2      >--------------------<
    3         >--------------------------<

      5

    */
    this.logDebug(
      `enableUpdate(${flag}): count=${this._disableUpdateCount}...`
    );
    if (flag) {
      util.assert(this._disableUpdateCount > 0);
      this._disableUpdateCount--;
      if (this._disableUpdateCount === 0) {
        this.updateViewport();
      }
    } else {
      this._disableUpdateCount++;
      // this._disableUpdate = Date.now();
    }
    // return !flag; // return previous value
  }

  /* ---------------------------------------------------------------------------
   * FILTER
   * -------------------------------------------------------------------------*/
  /**
   * [ext-filter] Reset the filter.
   *
   * @requires [[FilterExtension]]
   */
  clearFilter() {
    return (this.extensionDict.filter as FilterExtension).clearFilter();
  }
  /**
   * [ext-filter] Return true if a filter is currently applied.
   *
   * @requires [[FilterExtension]]
   */
  isFilterActive() {
    return !!this.filterMode;
  }
  /**
   * [ext-filter] Re-apply current filter.
   *
   * @requires [[FilterExtension]]
   */
  updateFilter() {
    return (this.extensionDict.filter as FilterExtension).updateFilter();
  }
}
