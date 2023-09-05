/*!
 * wunderbaum.ts
 *
 * A treegrid control.
 *
 * Copyright (c) 2021-2023, Martin Wendt (https://wwWendt.de).
 * https://github.com/mar10/wunderbaum
 *
 * Released under the MIT license.
 * @version @VERSION
 * @date @DATE
 */

// import "./wunderbaum.scss";
import * as util from "./util";
import { FilterExtension } from "./wb_ext_filter";
import { KeynavExtension } from "./wb_ext_keynav";
import { LoggerExtension } from "./wb_ext_logger";
import { DndExtension } from "./wb_ext_dnd";
import { GridExtension } from "./wb_ext_grid";
import { ExtensionsDict, WunderbaumExtension } from "./wb_extension_base";
import {
  ApplyCommandType,
  ChangeType,
  ColumnDefinitionList,
  ExpandAllOptions,
  FilterModeType,
  MatcherCallback,
  NavModeEnum,
  NodeStatusType,
  NodeStringCallback,
  NodeTypeDefinitionMap,
  ScrollToOptions,
  SetActiveOptions,
  UpdateOptions,
  SetStatusOptions,
  NodeRegion,
  WbEventInfo,
  ApplyCommandOptions,
  AddChildrenOptions,
  VisitRowsOptions,
  NodeFilterCallback,
  FilterNodesOptions,
  RenderFlag,
  NodeVisitCallback,
  SortCallback,
  NodeToDictCallback,
  WbNodeData,
} from "./types";
import {
  DEFAULT_DEBUGLEVEL,
  makeNodeTitleStartMatcher,
  nodeTitleSorter,
  RENDER_MAX_PREFETCH,
  ROW_HEIGHT,
} from "./common";
import { WunderbaumNode } from "./wb_node";
import { Deferred } from "./deferred";
import { EditExtension } from "./wb_ext_edit";
import { WunderbaumOptions } from "./wb_options";

class WbSystemRoot extends WunderbaumNode {
  constructor(tree: Wunderbaum) {
    super(tree, <WunderbaumNode>(<unknown>null), {
      key: "__root__",
      title: tree.id,
    });
  }
  toString() {
    return `WbSystemRoot@${this.key}<'${this.tree.id}'>`;
  }
}

/**
 * A persistent plain object or array.
 *
 * See also [[WunderbaumOptions]].
 */
export class Wunderbaum {
  protected static sequence = 0;
  protected enabled = true;

  /** Wunderbaum release version number "MAJOR.MINOR.PATCH". */
  public static version: string = "@VERSION"; // Set to semver by 'grunt release'

  /** The invisible root node, that holds all visible top level nodes. */
  public readonly root: WunderbaumNode;
  /** Unique tree ID as passed to constructor. Defaults to `"wb_SEQUENCE"`. */
  public readonly id: string;
  /** The `div` container element that was passed to the constructor. */
  public readonly element: HTMLDivElement;
  /** The `div.wb-header` element if any. */
  public readonly headerElement: HTMLDivElement;
  /** The `div.wb-list-container` element that contains the `nodeListElement`. */
  public readonly listContainerElement: HTMLDivElement;
  /** The `div.wb-node-list` element that contains all visible div.wb-row child elements. */
  public readonly nodeListElement: HTMLDivElement;
  /** Contains additional data that was sent as response to an Ajax source load request. */
  public readonly data: { [key: string]: any } = {};

  protected readonly _updateViewportThrottled: (...args: any) => void;
  protected extensionList: WunderbaumExtension[] = [];
  protected extensions: ExtensionsDict = {};

  /** Merged options from constructor args and tree- and extension defaults. */
  public options: WunderbaumOptions;

  protected keyMap = new Map<string, WunderbaumNode>();
  protected refKeyMap = new Map<string, Set<WunderbaumNode>>();
  protected treeRowCount = 0;
  protected _disableUpdateCount = 0;
  protected _disableUpdateIgnoreCount = 0;

  /** Currently active node if any. */
  public activeNode: WunderbaumNode | null = null;
  /** Current node hat has keyboard focus if any. */
  public focusNode: WunderbaumNode | null = null;

  /** Shared properties, referenced by `node.type`. */
  public types: NodeTypeDefinitionMap = {};
  /** List of column definitions. */
  public columns: ColumnDefinitionList = []; // any[] = [];

  protected _columnsById: { [key: string]: any } = {};
  protected resizeObserver: ResizeObserver;

  // Modification Status
  protected pendingChangeTypes: Set<RenderFlag> = new Set();

  /** A Promise that is resolved when the tree was initialized (similar to `init(e)` event). */
  public readonly ready: Promise<any>;
  /** Expose some useful methods of the util.ts module as `Wunderbaum.util`. */
  public static util = util;
  /** Expose some useful methods of the util.ts module as `tree._util`. */
  public _util = util;

  // --- SELECT ---
  // /** @internal */
  // public selectRangeAnchor: WunderbaumNode | null = null;

  // --- FILTER ---
  public filterMode: FilterModeType = null;

  // --- KEYNAV ---
  /** @internal Use `setColumn()`/`getActiveColElem()`*/
  public activeColIdx = 0;
  /** @internal */
  public _cellNavMode = false;
  /** @internal */
  public lastQuicksearchTime = 0;
  /** @internal */
  public lastQuicksearchTerm = "";

  // --- EDIT ---
  protected lastClickTime = 0;

  constructor(options: WunderbaumOptions) {
    let opts = (this.options = util.extend(
      {
        id: null,
        source: null, // URL for GET/PUT, Ajax options, or callback
        element: null, // <div class="wunderbaum">
        debugLevel: DEFAULT_DEBUGLEVEL, // 0:quiet, 1:errors, 2:warnings, 3:info, 4:verbose
        header: null, // Show/hide header (pass bool or string)
        // headerHeightPx: ROW_HEIGHT,
        rowHeightPx: ROW_HEIGHT,
        columns: null,
        types: null,
        // escapeTitles: true,
        enabled: true,
        fixedCol: false,
        showSpinner: false,
        checkbox: false,
        minExpandLevel: 0,
        emptyChildListExpandable: false,
        // updateThrottleWait: 200,
        skeleton: false,
        connectTopBreadcrumb: null, // HTMLElement that receives the top nodes breadcrumb
        selectMode: "multi", // SelectModeType
        // --- KeyNav ---
        navigationModeOption: null, // NavModeEnum.startRow,
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
    let readyOk = false;
    this.ready
      .then(() => {
        readyOk = true;
        try {
          this._callEvent("init");
        } catch (error) {
          // We re-raise in the reject handler, but Chrome resets the stack
          // frame then, so we log it here:
          console.error("Exception inside `init(e)` event:", error);
        }
      })
      .catch((err) => {
        if (readyOk) {
          // Error occurred in `init` handler. We can re-raise, but Chrome
          // resets the stack frame.
          throw err;
        } else {
          // Error in load process
          this._callEvent("init", { error: err });
        }
      });

    this.id = opts.id || "wb_" + ++Wunderbaum.sequence;
    this.root = new WbSystemRoot(this);

    this._registerExtension(new KeynavExtension(this));
    this._registerExtension(new EditExtension(this));
    this._registerExtension(new FilterExtension(this));
    this._registerExtension(new DndExtension(this));
    this._registerExtension(new GridExtension(this));
    this._registerExtension(new LoggerExtension(this));

    this._updateViewportThrottled = util.adaptiveThrottle(
      this._updateViewportImmediately.bind(this),
      {}
    );

    // --- Evaluate options
    this.columns = opts.columns;
    delete opts.columns;
    if (!this.columns || !this.columns.length) {
      const title = typeof opts.header === "string" ? opts.header : this.id;
      this.columns = [{ id: "*", title: title, width: "*" }];
    }

    if (opts.types) {
      this.setTypes(opts.types, true);
    }
    delete opts.types;

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

    const wantHeader =
      opts.header == null ? this.columns.length > 1 : !!opts.header;

    if (this.headerElement) {
      // User existing header markup to define `this.columns`
      util.assert(
        !this.columns,
        "`opts.columns` must not be set if markup already contains a header"
      );
      this.columns = [];
      const rowElement = this.headerElement.querySelector(
        "div.wb-row"
      ) as HTMLDivElement;
      for (const colDiv of rowElement.querySelectorAll("div")) {
        this.columns.push({
          id: colDiv.dataset.id || `col_${this.columns.length}`,
          // id: colDiv.dataset.id || null,
          title: "" + colDiv.textContent,
          // text: "" + colDiv.textContent,
          width: "*", // TODO: read from header span
        });
      }
    } else {
      // We need a row div, the rest will be computed from `this.columns`
      const coldivs = "<span class='wb-col'></span>".repeat(
        this.columns.length
      );
      this.element.innerHTML = `
        <div class='wb-header'>
          <div class='wb-row'>
            ${coldivs}
          </div>
        </div>`;

      if (!wantHeader) {
        const he = this.element.querySelector(
          "div.wb-header"
        ) as HTMLDivElement;
        he.style.display = "none";
      }
    }

    //
    this.element.innerHTML += `
      <div class="wb-list-container">
        <div class="wb-node-list"></div>
      </div>`;
    this.listContainerElement = this.element.querySelector(
      "div.wb-list-container"
    ) as HTMLDivElement;
    this.nodeListElement = this.listContainerElement.querySelector(
      "div.wb-node-list"
    ) as HTMLDivElement;
    this.headerElement = this.element.querySelector(
      "div.wb-header"
    ) as HTMLDivElement;

    this.element.classList.toggle("wb-grid", this.columns.length > 1);

    this._initExtensions();

    // --- apply initial options
    ["enabled", "fixedCol"].forEach((optName) => {
      if (opts[optName] != null) {
        this.setOption(optName, opts[optName]);
      }
    });

    // --- Load initial data
    if (opts.source) {
      if (opts.showSpinner) {
        this.nodeListElement.innerHTML =
          "<progress class='spinner'>loading...</progress>";
      }
      this.load(opts.source)
        .then(() => {
          // The source may have defined columns, so we may adjust the nav mode
          if (opts.navigationModeOption == null) {
            if (this.isGrid()) {
              this.setNavigationOption(NavModeEnum.cell);
            } else {
              this.setNavigationOption(NavModeEnum.row);
            }
          } else {
            this.setNavigationOption(opts.navigationModeOption);
          }
          readyDeferred.resolve();
        })
        .catch((error) => {
          readyDeferred.reject(error);
        })
        .finally(() => {
          this.element.querySelector("progress.spinner")?.remove();
          this.element.classList.remove("wb-initializing");
        });
    } else {
      readyDeferred.resolve();
    }

    // Async mode is sometimes required, because this.element.clientWidth
    // has a wrong value at start???
    this.update(ChangeType.any);

    // --- Bind listeners
    this.element.addEventListener("scroll", (e: Event) => {
      // this.log(`scroll, scrollTop:${e.target.scrollTop}`, e);
      this.update(ChangeType.scroll);
    });

    this.resizeObserver = new ResizeObserver((entries) => {
      // this.log("ResizeObserver: Size changed", entries);
      this.update(ChangeType.resize);
    });
    this.resizeObserver.observe(this.element);

    util.onEvent(this.nodeListElement, "click", "div.wb-row", (e) => {
      const info = Wunderbaum.getEventInfo(e);
      const node = info.node;
      const mouseEvent = e as MouseEvent;

      // this.log("click", info);

      // if (this._selectRange(info) === false) {
      //   return;
      // }

      if (
        this._callEvent("click", { event: e, node: node, info: info }) === false
      ) {
        this.lastClickTime = Date.now();
        return false;
      }
      if (node) {
        if (mouseEvent.ctrlKey) {
          node.toggleSelected();
          return;
        }
        // Edit title if 'clickActive' is triggered:
        const trigger = this.getOption("edit.trigger");
        const slowClickDelay = this.getOption("edit.slowClickDelay");
        if (
          trigger.indexOf("clickActive") >= 0 &&
          info.region === "title" &&
          node.isActive() &&
          (!slowClickDelay || Date.now() - this.lastClickTime < slowClickDelay)
        ) {
          this._callMethod("edit.startEditTitle", node);
        }

        if (info.colIdx >= 0) {
          node.setActive(true, { colIdx: info.colIdx, event: e });
        } else {
          node.setActive(true, { event: e });
        }

        if (info.region === NodeRegion.expander) {
          node.setExpanded(!node.isExpanded());
        } else if (info.region === NodeRegion.checkbox) {
          node.toggleSelected();
        }
      }
      this.lastClickTime = Date.now();
    });

    util.onEvent(this.nodeListElement, "dblclick", "div.wb-row", (e) => {
      const info = Wunderbaum.getEventInfo(e);
      const node = info.node;
      // this.log("dblclick", info, e);

      if (
        this._callEvent("dblclick", { event: e, node: node, info: info }) ===
        false
      ) {
        return false;
      }
      if (node && info.colIdx === 0 && node.isExpandable()) {
        this._callMethod("edit._stopEditTitle");
        node.setExpanded(!node.isExpanded());
      }
    });

    util.onEvent(this.element, "keydown", (e) => {
      const info = Wunderbaum.getEventInfo(e);
      const eventName = util.eventToString(e);
      const node = info.node || this.getFocusNode();

      this._callHook("onKeyEvent", {
        event: e,
        node: node,
        info: info,
        eventName: eventName,
      });
    });

    util.onEvent(this.element, "focusin focusout", (e) => {
      const flag = e.type === "focusin";
      const targetNode = Wunderbaum.getNode(e)!;

      this._callEvent("focus", { flag: flag, event: e });

      if (flag && this.isRowNav() && !this.isEditing()) {
        if ((opts.navigationModeOption as NavModeEnum) === NavModeEnum.row) {
          targetNode?.setActive();
        } else {
          this.setCellNav();
        }
      }
      if (!flag) {
        this._callMethod("edit._stopEditTitle", true, {
          event: e,
          forceClose: true,
        });
      }
    });
  }

  /**
   * Return a Wunderbaum instance, from element, id, index, or event.
   *
   * ```js
   * getTree();         // Get first Wunderbaum instance on page
   * getTree(1);        // Get second Wunderbaum instance on page
   * getTree(event);    // Get tree for this mouse- or keyboard event
   * getTree("foo");    // Get tree for this `tree.options.id`
   * getTree("#tree");  // Get tree for this matching element
   * ```
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

  /**
   * Return a WunderbaumNode instance from element or event.
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

  /**
   * Iterate all descendant nodes depth-first, pre-order using `for ... of ...` syntax.
   * More concise, but slightly slower than {@link Wunderbaum.visit}.
   *
   * Example:
   * ```js
   * for(const node of tree) {
   *   ...
   * }
   * ```
   */

  *[Symbol.iterator](): IterableIterator<WunderbaumNode> {
    yield* this.root;
  }

  /** @internal */
  protected _registerExtension(extension: WunderbaumExtension): void {
    this.extensionList.push(extension);
    this.extensions[extension.id] = extension;
    // this.extensionMap.set(extension.id, extension);
  }

  /** Called on tree (re)init after markup is created, before loading. */
  protected _initExtensions(): void {
    for (let ext of this.extensionList) {
      ext.init();
    }
  }

  /** Add node to tree's bookkeeping data structures. */
  _registerNode(node: WunderbaumNode): void {
    const key = node.key;
    util.assert(
      key != null && !this.keyMap.has(key),
      `Missing or duplicate key: '${key}'.`
    );
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
    // this.viewNodes.delete(node);
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

    for (let ext of this.extensionList) {
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

  /**
   * Call tree method or extension method if defined.
   *
   * Example:
   * ```js
   * tree._callMethod("edit.startEdit", "arg1", "arg2")
   * ```
   */
  _callMethod(name: string, ...args: any[]): any {
    const [p, n] = name.split(".");
    const obj = n ? this.extensions[p] : this;
    const func = (<any>obj)[n];
    if (func) {
      return func.apply(obj, args);
    } else {
      this.logError(`Calling undefined method '${name}()'.`);
    }
  }

  /**
   * Call event handler if defined in tree or tree.EXTENSION options.
   *
   * Example:
   * ```js
   * tree._callEvent("edit.beforeEdit", {foo: 42})
   * ```
   */
  _callEvent(type: string, extra?: any): any {
    const [p, n] = type.split(".");
    const opts = this.options as any;
    const func = n ? opts[p][n] : opts[p];
    if (func) {
      return func.call(
        this,
        util.extend({ type: type, tree: this, util: this._util }, extra)
      );
      // } else {
      //   this.logError(`Triggering undefined event '${type}'.`)
    }
  }

  /** Return the node for  given row index. */
  protected _getNodeByRowIdx(idx: number): WunderbaumNode | null {
    // TODO: start searching from active node (reverse)
    let node: WunderbaumNode | null = null;
    this.visitRows((n) => {
      if (n._rowIdx === idx) {
        node = n;
        return false;
      }
    });
    return <WunderbaumNode>node!;
  }

  /** Return the topmost visible node in the viewport. */
  getTopmostVpNode(complete = true) {
    const gracePx = 1; // ignore subpixel scrolling
    const scrollParent = this.element;
    // const headerHeight = this.headerElement.clientHeight;  // May be 0
    const scrollTop = scrollParent.scrollTop; // + headerHeight;
    let topIdx: number;

    if (complete) {
      topIdx = Math.ceil((scrollTop - gracePx) / ROW_HEIGHT);
    } else {
      topIdx = Math.floor(scrollTop / ROW_HEIGHT);
    }
    return this._getNodeByRowIdx(topIdx)!;
  }

  /** Return the lowest visible node in the viewport. */
  getLowestVpNode(complete = true) {
    const scrollParent = this.element;
    const headerHeight = this.headerElement.clientHeight; // May be 0
    const scrollTop = scrollParent.scrollTop;
    const clientHeight = scrollParent.clientHeight - headerHeight;
    let bottomIdx: number;

    if (complete) {
      bottomIdx = Math.floor((scrollTop + clientHeight) / ROW_HEIGHT) - 1;
    } else {
      bottomIdx = Math.ceil((scrollTop + clientHeight) / ROW_HEIGHT) - 1;
    }
    bottomIdx = Math.min(bottomIdx, this.count(true) - 1);
    return this._getNodeByRowIdx(bottomIdx)!;
  }

  /** Return preceeding visible node in the viewport. */
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

  /** Return following visible node in the viewport. */
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

  /**
   * Append (or insert) a list of toplevel nodes.
   *
   * @see {@link WunderbaumNode.addChildren}
   */
  addChildren(nodeData: any, options?: AddChildrenOptions): WunderbaumNode {
    return this.root.addChildren(nodeData, options);
  }

  /**
   * Apply a modification (or navigation) operation on the **tree or active node**.
   */
  applyCommand(cmd: ApplyCommandType, options?: ApplyCommandOptions): any;

  /**
   * Apply a modification (or navigation) operation on a **node**.
   * @see {@link WunderbaumNode.applyCommand}
   */
  applyCommand(
    cmd: ApplyCommandType,
    node: WunderbaumNode,
    options?: ApplyCommandOptions
  ): any;

  /**
   * Apply a modification or navigation operation.
   *
   * Most of these commands simply map to a node or tree method.
   * This method is especially useful when implementing keyboard mapping,
   * context menus, or external buttons.
   *
   * Valid commands:
   *   - 'moveUp', 'moveDown'
   *   - 'indent', 'outdent'
   *   - 'remove'
   *   - 'edit', 'addChild', 'addSibling': (reqires ext-edit extension)
   *   - 'cut', 'copy', 'paste': (use an internal singleton 'clipboard')
   *   - 'down', 'first', 'last', 'left', 'parent', 'right', 'up': navigate
   *
   */
  applyCommand(
    cmd: ApplyCommandType,
    nodeOrOpts?: WunderbaumNode | any,
    options?: ApplyCommandOptions
  ): any {
    let // clipboard,
      node,
      refNode;
    // options = $.extend(
    // 	{ setActive: true, clipboard: CLIPBOARD },
    // 	options_
    // );
    if (nodeOrOpts instanceof WunderbaumNode) {
      node = nodeOrOpts;
    } else {
      node = this.getActiveNode()!;
      util.assert(options === undefined);
      options = nodeOrOpts;
    }
    // clipboard = options.clipboard;

    switch (cmd) {
      // Sorting and indentation:
      case "moveUp":
        refNode = node.getPrevSibling();
        if (refNode) {
          node.moveTo(refNode, "before");
          node.setActive();
        }
        break;
      case "moveDown":
        refNode = node.getNextSibling();
        if (refNode) {
          node.moveTo(refNode, "after");
          node.setActive();
        }
        break;
      case "indent":
        refNode = node.getPrevSibling();
        if (refNode) {
          node.moveTo(refNode, "appendChild");
          refNode.setExpanded();
          node.setActive();
        }
        break;
      case "outdent":
        if (!node.isTopLevel()) {
          node.moveTo(node.getParent()!, "after");
          node.setActive();
        }
        break;
      // Remove:
      case "remove":
        refNode = node.getPrevSibling() || node.getParent();
        node.remove();
        if (refNode) {
          refNode.setActive();
        }
        break;
      // Add, edit (requires ext-edit):
      case "addChild":
        this._callMethod("edit.createNode", "prependChild");
        break;
      case "addSibling":
        this._callMethod("edit.createNode", "after");
        break;
      case "rename":
        this._callMethod("edit.startEditTitle");
        break;
      // Simple clipboard simulation:
      // case "cut":
      // 	clipboard = { mode: cmd, data: node };
      // 	break;
      // case "copy":
      // 	clipboard = {
      // 		mode: cmd,
      // 		data: node.toDict(function(d, n) {
      // 			delete d.key;
      // 		}),
      // 	};
      // 	break;
      // case "clear":
      // 	clipboard = null;
      // 	break;
      // case "paste":
      // 	if (clipboard.mode === "cut") {
      // 		// refNode = node.getPrevSibling();
      // 		clipboard.data.moveTo(node, "child");
      // 		clipboard.data.setActive();
      // 	} else if (clipboard.mode === "copy") {
      // 		node.addChildren(clipboard.data).setActive();
      // 	}
      // 	break;
      // Navigation commands:
      case "down":
      case "first":
      case "last":
      case "left":
      case "pageDown":
      case "pageUp":
      case "parent":
      case "right":
      case "up":
        return node.navigate(cmd);
      default:
        util.error(`Unhandled command: '${cmd}'`);
    }
  }

  /** Delete all nodes. */
  clear() {
    this.root.removeChildren();
    this.root.children = null;
    this.keyMap.clear();
    this.refKeyMap.clear();
    // this.viewNodes.clear();
    this.treeRowCount = 0;
    this.activeNode = null;
    this.focusNode = null;

    // this.types = {};
    // this. columns =[];
    // this._columnsById = {};

    // Modification Status
    // this.changedSince = 0;
    // this.changes.clear();
    // this.changedNodes.clear();

    // // --- FILTER ---
    // public filterMode: FilterModeType = null;

    // // --- KEYNAV ---
    // public activeColIdx = 0;
    // public cellNavMode = false;
    // public lastQuicksearchTime = 0;
    // public lastQuicksearchTerm = "";
    this.update(ChangeType.structure);
  }

  /**
   * Clear nodes and markup and detach events and observers.
   *
   * This method may be useful to free up resources before re-creating a tree
   * on an existing div, for example in unittest suites.
   * Note that this Wunderbaum instance becomes unusable afterwards.
   */
  public destroy() {
    this.logInfo("destroy()...");
    this.clear();
    this.resizeObserver.disconnect();
    this.element.innerHTML = "";
    // Remove all event handlers
    this.element.outerHTML = this.element.outerHTML;
  }

  /**
   * Return `tree.option.NAME` (also resolving if this is a callback).
   *
   * See also {@link WunderbaumNode.getOption|WunderbaumNode.getOption()}
   * to evaluate `node.NAME` setting and `tree.types[node.type].NAME`.
   *
   * @param name option name (use dot notation to access extension option, e.g.
   * `filter.mode`)
   */
  getOption(name: string, defaultValue?: any): any {
    let ext;
    let opts = this.options as any;

    // Lookup `name` in options dict
    if (name.indexOf(".") >= 0) {
      [ext, name] = name.split(".");
      opts = opts[ext];
    }
    let value = opts[name];

    // A callback resolver always takes precedence
    if (typeof value === "function") {
      value = value({ type: "resolve", tree: this });
    }
    // Use value from value options dict, fallback do default
    // console.info(name, value, opts)
    return value ?? defaultValue;
  }

  /**
   * Set tree option.
   * Use dot notation to set plugin option, e.g. "filter.mode".
   */
  setOption(name: string, value: any): void {
    // this.log(`setOption(${name}, ${value})`);
    if (name.indexOf(".") >= 0) {
      const parts = name.split(".");
      const ext = this.extensions[parts[0]];
      ext!.setPluginOption(parts[1], value);
      return;
    }
    (this.options as any)[name] = value;
    switch (name) {
      case "checkbox":
        this.update(ChangeType.any);
        break;
      case "enabled":
        this.setEnabled(!!value);
        break;
      case "fixedCol":
        this.element.classList.toggle("wb-fixed-col", !!value);
        break;
    }
  }

  /** Return true if the tree (or one of its nodes) has the input focus. */
  hasFocus() {
    return this.element.contains(document.activeElement);
  }

  /**
   * Return true if the tree displays a header. Grids have a header unless the
   * `header` option is set to `false`. Plain trees have a header if the `header`
   * option is a string or `true`.
   */
  hasHeader() {
    const header = this.options.header;
    return this.isGrid() ? header !== false : !!header;
  }

  /** Run code, but defer rendering of viewport until done.
   *
   * ```
   * tree.runWithDeferredUpdate(() => {
   *   return someFuncThatWouldUpdateManyNodes();
   * });
   * ```
   */
  runWithDeferredUpdate(func: () => any, hint = null): void {
    try {
      this.enableUpdate(false);
      const res = func();
      util.assert(!(res instanceof Promise));
      return res;
    } finally {
      this.enableUpdate(true);
    }
  }

  /** Recursively expand all expandable nodes (triggers lazy load if needed). */
  async expandAll(flag: boolean = true, options?: ExpandAllOptions) {
    await this.root.expandAll(flag, options);
  }

  /** Recursively select all nodes. */
  selectAll(flag: boolean = true) {
    return this.root.setSelected(flag, { propagateDown: true });
  }

  /** Toggle select all nodes. */
  toggleSelect() {
    this.selectAll(this.root._anySelectable());
  }

  /**
   * Return an array of selected nodes.
   * @param stopOnParents only return the topmost selected node (useful with selectMode 'hier')
   */
  getSelectedNodes(stopOnParents: boolean = false): WunderbaumNode[] {
    return this.root.getSelectedNodes(stopOnParents);
  }

  /*
   * Return an array of selected nodes.
   */
  protected _selectRange(eventInfo: WbEventInfo): false | void {
    this.logDebug("_selectRange", eventInfo);
    util.error("Not yet implemented.");
    // const mode = this.options.selectMode!;
    // if (mode !== "multi") {
    //   this.logDebug(`Range selection only available for selectMode 'multi'`);
    //   return;
    // }

    // if (eventInfo.canonicalName === "Meta+click") {
    //   eventInfo.node?.toggleSelected();
    //   return false; // don't
    // } else if (eventInfo.canonicalName === "Shift+click") {
    //   let from = this.activeNode;
    //   let to = eventInfo.node;
    //   if (!from || !to || from === to) {
    //     return;
    //   }
    //   this.runWithDeferredUpdate(() => {
    //     this.visitRows(
    //       (node) => {
    //         node.setSelected();
    //       },
    //       {
    //         includeHidden: true,
    //         includeSelf: false,
    //         start: from,
    //         reverse: from!._rowIdx! > to!._rowIdx!,
    //       }
    //     );
    //   });
    //   return false;
    // }
  }

  /** Return the number of nodes in the data model.
   * @param visible if true, nodes that are hidden due to collapsed parents are ignored.
   */
  count(visible = false): number {
    return visible ? this.treeRowCount : this.keyMap.size;
  }

  /** @internal sanity check. */
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

  /**
   * Find all nodes that match condition.
   *
   * @see {@link WunderbaumNode.findAll}
   */
  findAll(match: string | RegExp | MatcherCallback) {
    return this.root.findAll(match);
  }

  /**
   * Find first node that matches condition.
   *
   * @see {@link WunderbaumNode.findFirst}
   */
  findFirst(match: string | RegExp | MatcherCallback) {
    return this.root.findFirst(match);
  }

  /**
   * Find first node that matches condition.
   *
   * @param match title string to search for, or a
   *     callback function that returns `true` if a node is matched.
   * @see {@link WunderbaumNode.findFirst}
   *
   */
  findKey(key: string): WunderbaumNode | null {
    return this.keyMap.get(key) || null;
  }

  /**
   * Find the next visible node that starts with `match`, starting at `startNode`
   * and wrap-around at the end.
   */
  findNextNode(
    match: string | MatcherCallback,
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

  /**
   * Find a node relative to another node.
   *
   * @param node
   * @param where 'down', 'first', 'last', 'left', 'parent', 'right', or 'up'.
   *   (Alternatively the keyCode that would normally trigger this move,
   *   e.g. `$.ui.keyCode.LEFT` = 'left'.
   * @param includeHidden Not yet implemented
   */
  findRelatedNode(node: WunderbaumNode, where: string, includeHidden = false) {
    let res = null;
    const pageSize = Math.floor(
      this.listContainerElement.clientHeight / ROW_HEIGHT
    );

    switch (where) {
      case "parent":
        if (node.parent && node.parent.parent) {
          res = node.parent;
        }
        break;
      case "first":
        // First visible node
        this.visit((n) => {
          if (n.isVisible()) {
            res = n;
            return false;
          }
        });
        break;
      case "last":
        this.visit((n) => {
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
        const bottomNode = this.getLowestVpNode();
        // this.logDebug(`${where}(${node}) -> ${bottomNode}`);

        if (node._rowIdx! < bottomNode._rowIdx!) {
          res = bottomNode;
        } else {
          res = this._getNextNodeInView(node, pageSize);
        }
        break;
      case "pageUp":
        if (node._rowIdx === 0) {
          res = node;
        } else {
          const topNode = this.getTopmostVpNode();
          // this.logDebug(`${where}(${node}) -> ${topNode}`);

          if (node._rowIdx! > topNode._rowIdx!) {
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
   * Iterator version of {@link Wunderbaum.format}.
   */
  *format_iter(
    name_cb?: NodeStringCallback,
    connectors?: string[]
  ): IterableIterator<string> {
    return this.root.format_iter(name_cb, connectors);
  }

  /**
   * Return multiline string representation of the node hierarchy.
   * Mostly useful for debugging.
   *
   * Example:
   * ```js
   * console.info(tree.format((n)=>n.title));
   * ```
   * logs
   * ```
   * Playground
   * ├─ Books
   * |   ├─ Art of War
   * |   ╰─ Don Quixote
   * ├─ Music
   * ...
   * ```
   *
   * @see {@link Wunderbaum.format_iter} and {@link WunderbaumNode.format}.
   */
  format(name_cb?: NodeStringCallback, connectors?: string[]): string {
    return this.root.format(name_cb, connectors);
  }

  /**
   * Return the active cell (`span.wb-col`) of the currently active node or null.
   */
  getActiveColElem() {
    if (this.activeNode && this.activeColIdx >= 0) {
      return this.activeNode.getColElem(this.activeColIdx);
    }
    return null;
  }

  /**
   * Return the currently active node or null.
   */
  getActiveNode() {
    return this.activeNode;
  }

  /**
   * Return the first top level node if any (not the invisible root node).
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

  /** Return a {node: WunderbaumNode, region: TYPE} object for a mouse event.
   *
   * @param {Event} event Mouse event, e.g. click, ...
   * @returns {object} Return a {node: WunderbaumNode, region: TYPE} object
   *     TYPE: 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon' | undefined
   */
  static getEventInfo(event: Event): WbEventInfo {
    let target = <Element>event.target,
      cl = target.classList,
      parentCol = target.closest("span.wb-col") as HTMLSpanElement,
      node = Wunderbaum.getNode(target),
      tree = node ? node.tree : Wunderbaum.getTree(event),
      res: WbEventInfo = {
        event: <MouseEvent>event,
        canonicalName: util.eventToString(event),
        tree: tree!,
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
      res.region = node!.isExpandable()
        ? NodeRegion.expander
        : NodeRegion.prefix;
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
    } else if (cl.contains("wb-row")) {
      // Plain tree
      res.region = NodeRegion.title;
    } else {
      // Somewhere near the title
      if (event.type !== "mousemove" && !(event instanceof KeyboardEvent)) {
        console.warn("getEventInfo(): not found", event, res);
      }
      return res;
    }
    if (res.colIdx === -1) {
      res.colIdx = 0;
    }
    res.colDef = <any>tree?.columns[res.colIdx];
    res.colDef != null ? (res.colId = (<any>res.colDef).id) : 0;
    // this.log("Event", event, res);
    return res;
  }

  /**
   * Return readable string representation for this instance.
   * @internal
   */
  toString() {
    return `Wunderbaum<'${this.id}'>`;
  }

  /** Return true if any node is currently in edit-title mode. */
  isEditing(): boolean {
    return this._callMethod("edit.isEditingTitle");
  }

  /**
   * Return true if any node is currently beeing loaded, i.e. a Ajax request is pending.
   */
  isLoading(): boolean {
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

  /** Alias for {@link Wunderbaum.logDebug}.
   * @alias Wunderbaum.logDebug
   */
  log = this.logDebug;

  /** Log to console if opts.debugLevel >= 4 */
  logDebug(...args: any[]) {
    if (this.options.debugLevel! >= 4) {
      Array.prototype.unshift.call(args, this.toString());
      console.log.apply(console, args);
    }
  }

  /** Log error to console. */
  logError(...args: any[]) {
    if (this.options.debugLevel! >= 1) {
      Array.prototype.unshift.call(args, this.toString());
      console.error.apply(console, args);
    }
  }

  /** Log to console if opts.debugLevel >= 3 */
  logInfo(...args: any[]) {
    if (this.options.debugLevel! >= 3) {
      Array.prototype.unshift.call(args, this.toString());
      console.info.apply(console, args);
    }
  }

  /** @internal */
  logTime(label: string): string {
    if (this.options.debugLevel! >= 4) {
      console.time(this + ": " + label);
    }
    return label;
  }

  /** @internal */
  logTimeEnd(label: string): void {
    if (this.options.debugLevel! >= 4) {
      console.timeEnd(this + ": " + label);
    }
  }

  /** Log to console if opts.debugLevel >= 2 */
  logWarn(...args: any[]) {
    if (this.options.debugLevel! >= 2) {
      Array.prototype.unshift.call(args, this.toString());
      console.warn.apply(console, args);
    }
  }

  /**
   * Make sure that this node is vertically scrolled into the viewport.
   *
   * Nodes that are above the visible area become the top row, nodes that are
   * below the viewport become the bottom row.
   */
  scrollTo(nodeOrOpts: ScrollToOptions | WunderbaumNode) {
    const PADDING = 2; // leave some pixels between viewport bounds

    let node;
    WunderbaumNode;
    let options: ScrollToOptions | undefined;

    if (nodeOrOpts instanceof WunderbaumNode) {
      node = nodeOrOpts;
    } else {
      options = nodeOrOpts;
      node = options.node;
    }
    util.assert(node && node._rowIdx != null);

    const scrollParent = this.element;
    const headerHeight = this.headerElement.clientHeight; // May be 0
    const scrollTop = scrollParent.scrollTop;
    const vpHeight = scrollParent.clientHeight;
    const rowTop = node._rowIdx! * ROW_HEIGHT + headerHeight;
    const vpTop = headerHeight;
    const vpRowTop = rowTop - scrollTop;
    const vpRowBottom = vpRowTop + ROW_HEIGHT;
    const topNode = options?.topNode;

    // this.log( `scrollTo(${node.title}), vpTop:${vpTop}px, scrollTop:${scrollTop}, vpHeight:${vpHeight}, rowTop:${rowTop}, vpRowTop:${vpRowTop}`, nodeOrOpts , options);

    let newScrollTop: number | null = null;
    if (vpRowTop >= vpTop) {
      if (vpRowBottom <= vpHeight) {
        // Already in view
        // this.log("Already in view");
      } else {
        // Node is below viewport
        // this.log("Below viewport");
        newScrollTop = rowTop + ROW_HEIGHT - vpHeight + PADDING; // leave some pixels between viewport bounds
      }
    } else {
      // Node is above viewport
      // this.log("Above viewport");
      newScrollTop = rowTop - vpTop - PADDING; // leave some pixels between viewport bounds
    }
    if (newScrollTop != null) {
      this.log(`scrollTo(${rowTop}): ${scrollTop} => ${newScrollTop}`);
      scrollParent.scrollTop = newScrollTop;
      if (topNode) {
        // Make sure the topNode is always visible
        this.scrollTo(topNode);
      }
      // this.update(ChangeType.scroll);
    }
  }

  /**
   * Make sure that this node is horizontally scrolled into the viewport.
   * Called by {@link setColumn}.
   */
  protected scrollToHorz() {
    // const PADDING = 1;
    const fixedWidth = this.columns[0]._widthPx!;
    const vpWidth = this.element.clientWidth;
    const scrollLeft = this.element.scrollLeft;
    const colElem = this.getActiveColElem()!;
    const colLeft = Number.parseInt(colElem?.style.left, 10);
    const colRight = colLeft + Number.parseInt(colElem?.style.width, 10);
    let newLeft = scrollLeft;

    if (colLeft - scrollLeft < fixedWidth) {
      // The current column is scrolled behind the left fixed column
      newLeft = colLeft - fixedWidth;
    } else if (colRight - scrollLeft > vpWidth) {
      // The current column is scrolled outside the right side
      newLeft = colRight - vpWidth;
    }
    newLeft = Math.max(0, newLeft);
    // util.assert(node._rowIdx != null);
    this.log(
      `scrollToHorz(${this.activeColIdx}): ${colLeft}..${colRight}, fixedOfs=${fixedWidth}, vpWidth=${vpWidth}, curLeft=${scrollLeft} -> ${newLeft}`
    );
    this.element.scrollLeft = newLeft;
    // this.update(ChangeType.scroll);
  }
  /**
   * Set column #colIdx to 'active'.
   *
   * This higlights the column header and -cells by adding the `wb-active` class.
   * Available in cell-nav mode only.
   */
  setColumn(colIdx: number) {
    util.assert(this.isCellNav());
    util.assert(0 <= colIdx && colIdx < this.columns.length);
    this.activeColIdx = colIdx;

    // Update `wb-active` class for all headers
    if (this.hasHeader()) {
      for (let rowDiv of this.headerElement.children) {
        let i = 0;
        for (let colDiv of rowDiv.children) {
          (colDiv as HTMLElement).classList.toggle("wb-active", i++ === colIdx);
        }
      }
    }

    this.activeNode?.update(ChangeType.status);

    // Update `wb-active` class for all cell spans
    for (let rowDiv of this.nodeListElement.children) {
      let i = 0;
      for (let colDiv of rowDiv.children) {
        (colDiv as HTMLElement).classList.toggle("wb-active", i++ === colIdx);
      }
    }
    // Vertical scroll into view
    // if (this.options.fixedCol) {
    this.scrollToHorz();
    // }
  }

  /** Set or remove keybaord focus to the tree container. */
  setActiveNode(key: string, flag: boolean = true, options?: SetActiveOptions) {
    this.findKey(key)?.setActive(flag, options);
  }

  /** Set or remove keybaord focus to the tree container. */
  setFocus(flag = true) {
    if (flag) {
      this.element.focus();
    } else {
      this.element.blur();
    }
  }

  /**
   * @deprecated since v0.3.6: use `update()` instead.
   */
  setModified(change: ChangeType, ...args: any[]): void {
    this.logWarn("setModified() is deprecated: use update() instead.");
    // @ts-ignore
    // (!) TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
    return this.update.call(this, change, ...args);
  }
  /**
   * Schedule an update request to reflect a tree change.
   * The render operation is async and debounced unless the `immediate` option
   * is set.
   * Use {@link WunderbaumNode.update()} if only a single node has changed,
   * or {@link WunderbaumNode._render()}) to pass special options.
   */
  update(change: ChangeType, options?: UpdateOptions): void;

  /**
   * Update a row to reflect a single node's modification.
   *
   * @see {@link WunderbaumNode.update()}, {@link WunderbaumNode._render()}
   */
  update(
    change: ChangeType,
    node: WunderbaumNode,
    options?: UpdateOptions
  ): void;

  update(
    change: ChangeType,
    node?: WunderbaumNode | any,
    options?: UpdateOptions
  ): void {
    if (this._disableUpdateCount) {
      // Assuming that we redraw all when enableUpdate() is re-enabled.
      // this.log(
      //   `IGNORED update(${change}) node=${node} (disable level ${this._disableUpdateCount})`
      // );
      this._disableUpdateIgnoreCount++;
      return;
    }
    // this.log(`update(${change}) node=${node}`);
    if (!(node instanceof WunderbaumNode)) {
      options = node;
      node = null;
    }
    const immediate = !!util.getOption(options, "immediate");
    const RF = RenderFlag;
    const pending = this.pendingChangeTypes;

    switch (change) {
      case ChangeType.any:
      case ChangeType.colStructure:
        pending.add(RF.header);
        pending.add(RF.clearMarkup);
        pending.add(RF.redraw);
        pending.add(RF.scroll);
        break;
      case ChangeType.resize:
        // case ChangeType.colWidth:
        pending.add(RF.header);
        pending.add(RF.redraw);
        break;
      case ChangeType.structure:
        pending.add(RF.redraw);
        break;
      case ChangeType.scroll:
        pending.add(RF.scroll);
        break;
      case ChangeType.row:
      case ChangeType.data:
      case ChangeType.status:
        util.assert(node, `Option '${change}' requires a node.`);
        // Single nodes are immediately updated if already inside the viewport
        // (otherwise we can ignore)
        if (node._rowElem) {
          node._render({ change: change });
        }
        break;
      default:
        util.error(`Invalid change type '${change}'.`);
    }

    if (change === ChangeType.colStructure) {
      const isGrid = this.isGrid();
      this.element.classList.toggle("wb-grid", isGrid);
      if (!isGrid && this.isCellNav()) {
        this.setCellNav(false);
      }
    }

    if (pending.size > 0) {
      if (immediate) {
        this._updateViewportImmediately();
      } else {
        this._updateViewportThrottled();
      }
    }
  }

  /** Disable mouse and keyboard interaction (return prev. state). */
  setEnabled(flag: boolean = true): boolean {
    const prev = this.enabled;
    this.enabled = !!flag;
    this.element.classList.toggle("wb-disabled", !flag);
    return prev;
  }

  /** Return false if tree is disabled. */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Return true if tree has more than one column, i.e. has additional data columns. */
  isGrid(): boolean {
    return this.columns && this.columns.length > 1;
  }

  /** Return true if cell-navigation mode is acive. */
  isCellNav(): boolean {
    return !!this._cellNavMode;
  }
  /** Return true if row-navigation mode is acive. */
  isRowNav(): boolean {
    return !this._cellNavMode;
  }

  /** Set the tree's navigation mode. */
  setCellNav(flag: boolean = true) {
    const prev = this._cellNavMode;
    // if (flag === prev) {
    //   return;
    // }
    this._cellNavMode = !!flag;
    if (flag && !prev) {
      // switch from row to cell mode
      this.setColumn(0);
    }
    this.element.classList.toggle("wb-cell-mode", flag);
    this.activeNode?.update(ChangeType.status);
  }

  /** Set the tree's navigation mode option. */
  setNavigationOption(mode: NavModeEnum, reset = false) {
    if (!this.isGrid() && mode !== NavModeEnum.row) {
      this.logWarn("Plain trees only support row navigation mode.");
      return;
    }
    this.options.navigationModeOption = mode;

    switch (mode) {
      case NavModeEnum.cell:
        this.setCellNav(true);
        break;
      case NavModeEnum.row:
        this.setCellNav(false);
        break;
      case NavModeEnum.startCell:
        if (reset) {
          this.setCellNav(true);
        }
        break;
      case NavModeEnum.startRow:
        if (reset) {
          this.setCellNav(false);
        }
        break;
      default:
        util.error(`Invalid mode '${mode}'.`);
    }
  }

  /** Display tree status (ok, loading, error, noData) using styles and a dummy root node. */
  setStatus(
    status: NodeStatusType,
    options?: SetStatusOptions
  ): WunderbaumNode | null {
    return this.root.setStatus(status, options);
  }

  /** Add or redefine node type definitions. */
  setTypes(types: any, replace = true) {
    util.assert(util.isPlainObject(types));
    if (replace) {
      this.types = types;
    } else {
      util.extend(this.types, types);
    }
    // Convert `TYPE.classes` to a Set
    for (let t of Object.values(this.types) as any) {
      if (t.classes) {
        t.classes = util.toSet(t.classes);
      }
    }
  }

  /**
   * Sort nodes list by title or custom criteria.
   * @param {function} cmp custom compare function(a, b) that returns -1, 0, or 1
   *    (defaults to sorting by title).
   * @param {boolean} deep pass true to sort all descendant nodes recursively
   */
  sortChildren(
    cmp: SortCallback | null = nodeTitleSorter,
    deep: boolean = false
  ): void {
    this.root.sortChildren(cmp, deep);
  }

  /** Convert tree to an array of plain objects.
   *
   * @param callback(dict, node) is called for every node, in order to allow
   *     modifications.
   *     Return `false` to ignore this node or `"skip"` to include this node
   *     without its children.
   * @see {@link WunderbaumNode.toDict}.
   */
  toDictArray(callback?: NodeToDictCallback): Array<WbNodeData> {
    const res = this.root.toDict(true, callback);
    return res.children ?? [];
  }

  /**
   * Update column headers and column width.
   * Return true if at least one column width changed.
   */
  // _updateColumnWidths(options?: UpdateColumnsOptions): boolean {
  _updateColumnWidths(): boolean {
    // options = Object.assign({ updateRows: true, renderMarkup: false }, options);
    const defaultMinWidth = 4;
    const vpWidth = this.element.clientWidth;
    // Shorten last column width to avoid h-scrollbar
    const FIX_ADJUST_LAST_COL = 2;
    const columns = this.columns;
    const col0 = columns[0];

    let totalWidth = 0;
    let totalWeight = 0;
    let fixedWidth = 0;
    let modified = false;

    // this.element.classList.toggle("wb-grid", isGrid);
    // if (!isGrid && this.isCellNav()) {
    //   this.setCellNav(false);
    // }

    // if (options.calculateCols) {
    if (col0.id !== "*") {
      throw new Error(`First column must have  id '*': got '${col0.id}'.`);
    }
    // Gather width definitions
    this._columnsById = {};
    for (let col of columns) {
      this._columnsById[<string>col.id] = col;
      let cw = col.width;
      if (col.id === "*" && col !== col0) {
        throw new Error(
          `Column id '*' must be defined only once: '${col.title}'.`
        );
      }

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
        util.error(
          `Invalid column width: ${cw} (expected string ending with 'px' or number, e.g. "<num>px" or <int>).`
        );
      }
    }
    // Share remaining space between non-fixed columns
    const restPx = Math.max(0, vpWidth - fixedWidth);
    let ofsPx = 0;

    for (let col of columns) {
      let minWidth: number;

      if (col._weight) {
        const cmw = col.minWidth;
        if (typeof cmw === "number") {
          minWidth = cmw;
        } else if (typeof cmw === "string" && cmw.endsWith("px")) {
          minWidth = parseFloat(cmw.slice(0, -2));
        } else {
          minWidth = defaultMinWidth;
        }
        const px = Math.max(minWidth, (restPx * col._weight) / totalWeight);
        if (col._widthPx != px) {
          modified = true;
          col._widthPx = px;
        }
      }
      col._ofsPx = ofsPx;
      ofsPx += col._widthPx!;
    }
    columns[columns.length - 1]._widthPx! -= FIX_ADJUST_LAST_COL;
    totalWidth = ofsPx - FIX_ADJUST_LAST_COL;

    const tw = `${totalWidth}px`;
    this.headerElement.style.width = tw;
    this.listContainerElement!.style.width = tw;
    // }

    // Every column has now a calculated `_ofsPx` and `_widthPx`
    // this.logInfo("UC", this.columns, vpWidth, this.element.clientWidth, this.element);
    // console.trace();
    // util.error("BREAK");
    // if (modified) {
    //   this._renderHeaderMarkup();
    //   if (options.renderMarkup) {
    //     this.update(ChangeType.header, { removeMarkup: true });
    //   } else if (options.updateRows) {
    //     this._updateRows();
    //   }
    // }
    return modified;
  }

  /** Create/update header markup from `this.columns` definition.
   * @internal
   */
  protected _renderHeaderMarkup() {
    util.assert(this.headerElement);
    const wantHeader = this.hasHeader();
    util.setElemDisplay(this.headerElement, wantHeader);
    if (!wantHeader) {
      return;
    }
    const colCount = this.columns.length;
    const headerRow = this.headerElement.querySelector(".wb-row")!;
    util.assert(headerRow);
    headerRow.innerHTML = "<span class='wb-col'></span>".repeat(colCount);

    for (let i = 0; i < colCount; i++) {
      const col = this.columns[i];
      const colElem = <HTMLElement>headerRow.children[i];

      colElem.style.left = col._ofsPx + "px";
      colElem.style.width = col._widthPx + "px";
      // Add classes from `columns` definition to `<div.wb-col>` cells
      if (typeof col.headerClasses === "string") {
        col.headerClasses
          ? colElem.classList.add(...col.headerClasses.split(" "))
          : 0;
      } else {
        col.classes ? colElem.classList.add(...col.classes.split(" ")) : 0;
      }

      const title = util.escapeHtml(col.title || col.id);
      let tooltip = "";
      if (col.tooltip) {
        tooltip = util.escapeTooltip(col.tooltip);
        tooltip = ` title="${tooltip}"`;
      }
      let resizer = "";
      if (i < colCount - 1) {
        resizer = '<span class="wb-col-resizer"></span>';
      }
      colElem.innerHTML = `<span class="wb-col-title"${tooltip}>${title}</span>${resizer}`;
      if (this.isCellNav()) {
        colElem.classList.toggle("wb-active", i === this.activeColIdx);
      }
    }
  }

  /**
   * Render pending changes that were scheduled using {@link WunderbaumNode.update} if any.
   *
   * This is hardly ever neccessary, since we normally either
   * - call `update(ChangeType.TYPE)` (async, throttled), or
   * - call `update(ChangeType.TYPE, {immediate: true})` (synchronous)
   *
   * `updatePendingModifications()` will only force immediate execution of
   * pending async changes if any.
   */
  updatePendingModifications() {
    if (this.pendingChangeTypes.size > 0) {
      this._updateViewportImmediately();
    }
  }

  /**
   * This is the actual update method, which is wrapped inside a throttle method.
   * It calls `updateColumns()` and `_updateRows()`.
   *
   * This protected method should not be called directly but via
   * {@link WunderbaumNode.update}`, {@link Wunderbaum.update},
   * or {@link Wunderbaum.updatePendingModifications}.
   * @internal
   */
  protected _updateViewportImmediately() {
    if (this._disableUpdateCount) {
      this.log(
        `_updateViewportImmediately() IGNORED (disable level: ${this._disableUpdateCount})`
      );
      this._disableUpdateIgnoreCount++;
      return;
    }

    // Shorten container height to avoid v-scrollbar
    const FIX_ADJUST_HEIGHT = 1;
    const RF = RenderFlag;

    const pending = new Set(this.pendingChangeTypes);
    this.pendingChangeTypes.clear();

    const scrollOnly = pending.has(RF.scroll) && pending.size === 1;
    if (scrollOnly) {
      this._updateRows({ newNodesOnly: true });
      // this.log("_updateViewportImmediately(): scroll only.");
    } else {
      this.log("_updateViewportImmediately():", pending);
      let height = this.listContainerElement.clientHeight;
      // We cannot get the height for absolute positioned parent, so look at first col
      // let headerHeight = this.headerElement.clientHeight
      // let headerHeight = this.headerElement.children[0].children[0].clientHeight;
      // const headerHeight = this.options.headerHeightPx;
      const headerHeight = this.headerElement.clientHeight; // May be 0
      const wantHeight =
        this.element.clientHeight - headerHeight - FIX_ADJUST_HEIGHT;

      if (Math.abs(height - wantHeight) > 1.0) {
        // this.log("resize", height, wantHeight);
        this.listContainerElement.style.height = wantHeight + "px";
        height = wantHeight;
      }
      // console.profile(`_updateViewportImmediately()`)

      if (pending.has(RF.clearMarkup)) {
        this.visit((n) => {
          n.removeMarkup();
        });
      }

      // let widthModified = false;
      if (pending.has(RF.header)) {
        // widthModified = this._updateColumnWidths();
        this._updateColumnWidths();
        this._renderHeaderMarkup();
      }
      this._updateRows();
      // console.profileEnd(`_updateViewportImmediately()`)
    }

    if (this.options.connectTopBreadcrumb) {
      let path = this.getTopmostVpNode(true)?.getPath(false, "title", " > ");
      path = path ? path + " >" : "";
      this.options.connectTopBreadcrumb.textContent = path;
    }
    this._callEvent("update");
  }

  // /**
  //  * Assert that TR order matches the natural node order
  //  * @internal
  //  */
  // protected _validateRows(): boolean {
  //   let trs = this.nodeListElement.childNodes;
  //   let i = 0;
  //   let prev = -1;
  //   let ok = true;
  //   trs.forEach((element) => {
  //     const tr = element as HTMLTableRowElement;
  //     const top = Number.parseInt(tr.style.top);
  //     const n = (<any>tr)._wb_node;
  //     // if (i < 4) {
  //     //   console.info(
  //     //     `TR#${i}, rowIdx=${n._rowIdx} , top=${top}px: '${n.title}'`
  //     //   );
  //     // }
  //     if (prev >= 0 && top !== prev + ROW_HEIGHT) {
  //       n.logWarn(
  //         `TR order mismatch at index ${i}: top=${top}px != ${
  //           prev + ROW_HEIGHT
  //         }`
  //       );
  //       // throw new Error("fault");
  //       ok = false;
  //     }
  //     prev = top;
  //     i++;
  //   });
  //   return ok;
  // }

  /*
   * - Traverse all *visible* nodes of the whole tree, i.e. skip collapsed nodes.
   * - Store count of rows to `tree.treeRowCount`.
   * - Renumber `node._rowIdx` for all visible nodes.
   * - Calculate the index range that must be rendered to fill the viewport
   *   (including upper and lower prefetch)
   * -
   */
  protected _updateRows(options?: any): boolean {
    // const label = this.logTime("_updateRows");
    // this.log("_updateRows", opts)
    options = Object.assign({ newNodesOnly: false }, options);
    const newNodesOnly = !!options.newNodesOnly;

    const row_height = ROW_HEIGHT;
    const vp_height = this.element.clientHeight;
    const prefetch = RENDER_MAX_PREFETCH;
    // const grace_prefetch = RENDER_MAX_PREFETCH - RENDER_MIN_PREFETCH;
    const ofs = this.element.scrollTop;

    let startIdx = Math.max(0, ofs / row_height - prefetch);
    startIdx = Math.floor(startIdx);
    // Make sure start is always even, so the alternating row colors don't
    // change when scrolling:
    if (startIdx % 2) {
      startIdx--;
    }
    let endIdx = Math.max(0, (ofs + vp_height) / row_height + prefetch);
    endIdx = Math.ceil(endIdx);

    // const obsoleteViewNodes = this.viewNodes;
    // this.viewNodes = new Set();
    // const viewNodes = this.viewNodes;
    // this.debug("render", opts);
    const obsoleteNodes = new Set<WunderbaumNode>();
    this.nodeListElement.childNodes.forEach((elem) => {
      const tr = elem as HTMLTableRowElement;
      obsoleteNodes.add((<any>tr)._wb_node);
    });

    let idx = 0;
    let top = 0;
    let modified = false;
    let prevElem: HTMLDivElement | "first" | "last" = "first";

    this.visitRows(function (node) {
      // node.log("visit")
      const rowDiv = node._rowElem;

      // Renumber all expanded nodes
      if (node._rowIdx !== idx) {
        node._rowIdx = idx;
        modified = true;
      }

      if (idx < startIdx || idx > endIdx) {
        // row is outside viewport bounds
        if (rowDiv) {
          prevElem = rowDiv;
        }
      } else if (rowDiv && newNodesOnly) {
        obsoleteNodes.delete(node);
        // no need to update existing node markup
        rowDiv.style.top = idx * ROW_HEIGHT + "px";
        prevElem = rowDiv;
      } else {
        obsoleteNodes.delete(node);
        // Create new markup
        if (rowDiv) {
          rowDiv.style.top = idx * ROW_HEIGHT + "px";
        }
        node._render({ top: top, after: prevElem });
        // node.log("render", top, prevElem, "=>", node._rowElem);
        prevElem = node._rowElem!;
      }
      idx++;
      top += row_height;
    });
    this.treeRowCount = idx;
    for (const n of obsoleteNodes) {
      n._callEvent("discard");
      n.removeMarkup();
    }
    // Resize tree container
    this.nodeListElement.style.height = `${top}px`;
    // this.log(
    //   `_updateRows(scrollOfs:${ofs}, ${startIdx}..${endIdx})`,
    //   this.nodeListElement.style.height
    // );
    // this.logTimeEnd(label);
    // this._validateRows();
    return modified;
  }

  /**
   * Call `callback(node)` for all nodes in hierarchical order (depth-first, pre-order).
   * @see {@link IterableIterator<WunderbaumNode>}, {@link WunderbaumNode.visit}.
   *
   * @param {function} callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and
   *     children only.
   * @returns {boolean} false, if the iterator was stopped.
   */
  visit(callback: (node: WunderbaumNode) => any) {
    return this.root.visit(callback, false);
  }

  /**
   * Call callback(node) for all nodes in vertical order, top down (or bottom up).
   *
   * Note that this considers expansion state, i.e. filtered nodes and children
   * of collapsed nodes are skipped, unless `includeHidden` is set.
   *
   * Stop iteration if callback() returns false.<br>
   * Return false if iteration was stopped.
   *
   * @returns {boolean} false if iteration was canceled
   */
  visitRows(callback: NodeVisitCallback, options?: VisitRowsOptions): boolean {
    if (!this.root.hasChildren()) {
      return false;
    }
    if (options && options.reverse) {
      delete options.reverse;
      return this._visitRowsUp(callback, options);
    }
    options = options || {};
    let i,
      nextIdx,
      parent,
      res,
      siblings,
      stopNode: WunderbaumNode,
      siblingOfs = 0,
      skipFirstNode = options.includeSelf === false,
      includeHidden = !!options.includeHidden,
      checkFilter = !includeHidden && this.filterMode === "hide",
      node: WunderbaumNode = options.start || this.root.children![0];

    parent = node.parent;
    while (parent) {
      // visit siblings
      siblings = parent.children!;
      nextIdx = siblings.indexOf(node) + siblingOfs;
      util.assert(
        nextIdx >= 0,
        `Could not find ${node} in parent's children: ${parent}`
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
          res = node.visit((n: WunderbaumNode) => {
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

      if (!parent && options.wrap) {
        this.logDebug("visitRows(): wrap around");
        util.assert(options.start, "`wrap` option requires `start`");
        stopNode = options.start!;
        options.wrap = false;
        parent = this.root;
        siblingOfs = 0;
      }
    }
    return true;
  }

  /**
   * Call fn(node) for all nodes in vertical order, bottom up.
   * @internal
   */
  protected _visitRowsUp(
    callback: NodeVisitCallback,
    options: VisitRowsOptions
  ): boolean {
    let children,
      idx,
      parent,
      includeHidden = !!options.includeHidden,
      node = options.start || this.root.children![0];

    if (options.includeSelf !== false) {
      if (callback(node) === false) {
        return false;
      }
    }
    while (true) {
      parent = node.parent;
      children = parent.children!;

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

  /**
   * Reload the tree with a new source.
   *
   * Previous data is cleared. Note that also column- and type defintions may
   * be passed with the `source` object.
   */
  load(source: any) {
    this.clear();
    return this.root.load(source);
  }

  /**
   * Disable render requests during operations that would trigger many updates.
   *
   * ```js
   * try {
   *   tree.enableUpdate(false);
   *   // ... (long running operation that would trigger many updates)
   *   foo();
   *   // ... NOTE: make sure that async operations have finished, e.g.
   *   await foo();
   * } finally {
   *   tree.enableUpdate(true);
   * }
   * ```
   */
  public enableUpdate(flag: boolean): void {
    /*
        5  7  9                20       25   30
    1   >-------------------------------------<
    2      >--------------------<
    3         >--------------------------<
    */
    if (flag) {
      util.assert(
        this._disableUpdateCount > 0,
        "enableUpdate(true) was called too often"
      );
      this._disableUpdateCount--;
      // this.logDebug(
      //   `enableUpdate(${flag}): count -> ${this._disableUpdateCount}...`
      // );
      if (this._disableUpdateCount === 0) {
        this.logDebug(
          `enableUpdate(): active again. Re-painting to catch up with ${this._disableUpdateIgnoreCount} ignored update requests...`
        );
        this._disableUpdateIgnoreCount = 0;
        this.update(ChangeType.any, { immediate: true });
      }
    } else {
      this._disableUpdateCount++;
      // this.logDebug(
      //   `enableUpdate(${flag}): count -> ${this._disableUpdateCount}...`
      // );
      // this._disableUpdate = Date.now();
    }
    // return !flag; // return previous value
  }

  /* ---------------------------------------------------------------------------
   * FILTER
   * -------------------------------------------------------------------------*/
  /**
   * [ext-filter] Dim or hide nodes.
   */
  filterNodes(
    filter: string | NodeFilterCallback,
    options: FilterNodesOptions
  ) {
    return (this.extensions.filter as FilterExtension).filterNodes(
      filter,
      options
    );
  }

  /**
   * [ext-filter] Dim or hide whole branches.
   */
  filterBranches(
    filter: string | NodeFilterCallback,
    options: FilterNodesOptions
  ) {
    return (this.extensions.filter as FilterExtension).filterBranches(
      filter,
      options
    );
  }

  /**
   * [ext-filter] Reset the filter.
   *
   * @requires [[FilterExtension]]
   */
  clearFilter() {
    return (this.extensions.filter as FilterExtension).clearFilter();
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
    return (this.extensions.filter as FilterExtension).updateFilter();
  }
}
