/*!
 * wunderbaum.ts
 *
 * A treegrid control.
 *
 * Copyright (c) 2021-2022, Martin Wendt (https://wwWendt.de).
 * https://github.com/mar10/wunderbaum
 *
 * Released under the MIT license.
 * @version @VERSION
 * @date @DATE
 */

import "./wunderbaum.scss";
import * as util from "./util";
import { FilterExtension } from "./wb_ext_filter";
import { KeynavExtension } from "./wb_ext_keynav";
import { LoggerExtension } from "./wb_ext_logger";
import { DndExtension } from "./wb_ext_dnd";
import { GridExtension } from "./wb_ext_grid";
import { ExtensionsDict, WunderbaumExtension } from "./wb_extension_base";

import {
  NavigationMode,
  ChangeType,
  DEFAULT_DEBUGLEVEL,
  FilterModeType,
  makeNodeTitleStartMatcher,
  MatcherType,
  NavigationModeOption,
  NodeStatusType,
  RENDER_MAX_PREFETCH,
  ROW_HEIGHT,
  TargetType as NodeRegion,
  ApplyCommandType,
} from "./common";
import { WunderbaumNode } from "./wb_node";
import { Deferred } from "./deferred";
// import { DebouncedFunction, throttle } from "./debounce";
import { EditExtension } from "./wb_ext_edit";
import { WunderbaumOptions } from "./wb_options";

// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];
// const MAX_CHANGED_NODES = 10;

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
  public readonly headerElement: HTMLDivElement | null;
  /** The `div.wb-scroll-container` element that contains the `nodeListElement`. */
  public readonly scrollContainer: HTMLDivElement;
  /** The `div.wb-node-list` element that contains all visible div.wb-row child elements. */
  public readonly nodeListElement: HTMLDivElement;

  protected readonly _updateViewportThrottled: (...args: any) => void;
  protected extensionList: WunderbaumExtension[] = [];
  protected extensions: ExtensionsDict = {};

  /** Merged options from constructor args and tree- and extension defaults. */
  public options: WunderbaumOptions;

  protected keyMap = new Map<string, WunderbaumNode>();
  protected refKeyMap = new Map<string, Set<WunderbaumNode>>();
  // protected viewNodes = new Set<WunderbaumNode>();
  protected treeRowCount = 0;
  protected _disableUpdateCount = 0;

  // protected eventHandlers : Array<function> = [];

  /** Currently active node if any. */
  public activeNode: WunderbaumNode | null = null;
  /** Current node hat has keyboard focus if any. */
  public focusNode: WunderbaumNode | null = null;

  /** Shared properties, referenced by `node.type`. */
  public types: { [key: string]: any } = {};
  /** List of column definitions. */
  public columns: any[] = [];

  protected _columnsById: { [key: string]: any } = {};
  protected resizeObserver: ResizeObserver;

  // Modification Status
  // protected changedSince = 0;
  // protected changes = new Set<ChangeType>();
  // protected changedNodes = new Set<WunderbaumNode>();
  protected changeRedrawRequestPending = false;

  /** A Promise that is resolved when the tree was initialized (similar to `init(e)` event). */
  public readonly ready: Promise<any>;
  /** Expose some useful methods of the util.ts module as `Wunderbaum.util`. */
  public static util = util;
  /** Expose some useful methods of the util.ts module as `tree._util`. */
  public _util = util;

  // --- FILTER ---
  public filterMode: FilterModeType = null;

  // --- KEYNAV ---
  /** @internal Use `setColumn()`/`getActiveColElem()`*/
  public activeColIdx = 0;
  /** @internal */
  public navMode = NavigationMode.row;
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
        source: null, // URL for GET/PUT, ajax options, or callback
        element: null, // <div class="wunderbaum">
        debugLevel: DEFAULT_DEBUGLEVEL, // 0:quiet, 1:errors, 2:warnings, 3:info, 4:verbose
        header: null, // Show/hide header (pass bool or string)
        headerHeightPx: ROW_HEIGHT,
        rowHeightPx: ROW_HEIGHT,
        columns: null,
        types: null,
        // escapeTitles: true,
        showSpinner: false,
        checkbox: true,
        minExpandLevel: 0,
        updateThrottleWait: 200,
        skeleton: false,
        // --- KeyNav ---
        navigationMode: NavigationModeOption.startRow,
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
      opts.navigationMode = NavigationModeOption.row;
    }

    if (
      opts.navigationMode === NavigationModeOption.cell ||
      opts.navigationMode === NavigationModeOption.startCell
    ) {
      this.navMode = NavigationMode.cellNav;
    }

    this._updateViewportThrottled = util.addaptiveThrottle(
      this._updateViewport.bind(this),
      {}
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
          id: colDiv.dataset.id || null,
          text: "" + colDiv.textContent,
        });
      }
    } else if (wantHeader) {
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
      // this.updateColumns({ render: false });
    } else {
      this.element.innerHTML = "";
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

    // --- apply iinitial options
    ["enabled"].forEach((optName) => {
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

    // TODO: This is sometimes required, because this.element.clientWidth
    //       has a wrong value at start???
    setTimeout(() => {
      this.updateViewport();
    }, 50);

    // --- Bind listeners
    this.scrollContainer.addEventListener("scroll", (e: Event) => {
      this.setModified(ChangeType.vscroll);
    });

    this.resizeObserver = new ResizeObserver((entries) => {
      this.setModified(ChangeType.vscroll);
      // this.log("ResizeObserver: Size changed", entries);
    });
    this.resizeObserver.observe(this.element);

    util.onEvent(this.nodeListElement, "click", "div.wb-row", (e) => {
      const info = Wunderbaum.getEventInfo(e);
      const node = info.node;
      // this.log("click", info, e);

      if (
        this._callEvent("click", { event: e, node: node, info: info }) === false
      ) {
        this.lastClickTime = Date.now();
        return false;
      }
      if (node) {
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
          node.setSelected(!node.isSelected());
        }
      }
      this.lastClickTime = Date.now();
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

      this._callEvent("focus", { flag: flag, event: e });
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
    let topIdx: number;
    const gracePy = 1; // ignore subpixel scrolling

    if (complete) {
      topIdx = Math.ceil(
        (this.scrollContainer.scrollTop - gracePy) / ROW_HEIGHT
      );
    } else {
      topIdx = Math.floor(this.scrollContainer.scrollTop / ROW_HEIGHT);
    }
    return this._getNodeByRowIdx(topIdx)!;
  }

  /** Return the lowest visible node in the viewport. */
  getLowestVpNode(complete = true) {
    let bottomIdx: number;
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
  addChildren(nodeData: any, options?: any): WunderbaumNode {
    return this.root.addChildren(nodeData, options);
  }

  /**
   * Apply a modification (or navigation) operation on the **tree or active node**.
   */
  applyCommand(cmd: ApplyCommandType, opts?: any): any;

  /**
   * Apply a modification (or navigation) operation on a **node**.
   * @see {@link WunderbaumNode.applyCommand}
   */
  applyCommand(cmd: ApplyCommandType, node: WunderbaumNode, opts?: any): any;

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
    opts?: any
  ): any {
    let // clipboard,
      node,
      refNode;
    // opts = $.extend(
    // 	{ setActive: true, clipboard: CLIPBOARD },
    // 	opts_
    // );
    if (nodeOrOpts instanceof WunderbaumNode) {
      node = nodeOrOpts;
    } else {
      node = this.getActiveNode()!;
      util.assert(opts === undefined);
      opts = nodeOrOpts;
    }
    // clipboard = opts.clipboard;

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
    this.setModified(ChangeType.structure);
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
   * to consider `node.NAME` setting and `tree.types[node.type].NAME`.
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
    return value ?? defaultValue;
  }

  /**
   *
   * @param name
   * @param value
   */
  setOption(name: string, value: any): void {
    this.log(`setOption(${name}, ${value})`);
    if (name.indexOf(".") === -1) {
      (this.options as any)[name] = value;
      switch (name) {
        case "enabled":
          this.setEnabled(!!value);
          break;
        default:
          break;
      }
      return;
    }
    const parts = name.split(".");
    const ext = this.extensions[parts[0]];
    ext!.setPluginOption(parts[1], value);
  }

  /**Return true if the tree (or one of its nodes) has the input focus. */
  hasFocus() {
    return this.element.contains(document.activeElement);
  }

  /** Run code, but defer `updateViewport()` until done. */
  runWithoutUpdate(func: () => any, hint = null): void {
    try {
      this.enableUpdate(false);
      const res = func();
      util.assert(!(res instanceof Promise));
      return res;
    } finally {
      this.enableUpdate(true);
    }
  }

  /** Recursively expand all expandable nodes (triggers lazy load id needed). */
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

  /** Return the number of nodes in the data model.*/
  count(visible = false): number {
    if (visible) {
      return this.treeRowCount;
      // return this.viewNodes.size;
    }
    return this.keyMap.size;
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
   * Find all nodes that matches condition.
   *
   * @param match title string to search for, or a
   *     callback function that returns `true` if a node is matched.
   *
   * @see {@link WunderbaumNode.findAll}
   */
  findAll(match: string | MatcherType) {
    return this.root.findAll(match);
  }

  /**
   * Find first node that matches condition.
   *
   * @param match title string to search for, or a
   *     callback function that returns `true` if a node is matched.
   * @see {@link WunderbaumNode.findFirst}
   *
   */
  findFirst(match: string | MatcherType) {
    return this.root.findFirst(match);
  }

  /**
   * Find the next visible node that starts with `match`, starting at `startNode`
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
    const pageSize = Math.floor(this.scrollContainer.clientHeight / ROW_HEIGHT);

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
  static getEventInfo(event: Event) {
    let target = <Element>event.target,
      cl = target.classList,
      parentCol = target.closest("span.wb-col") as HTMLSpanElement,
      node = Wunderbaum.getNode(target),
      tree = node ? node.tree : Wunderbaum.getTree(event),
      res = {
        tree: tree,
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
      if (event.type !== "mousemove" && !(event instanceof KeyboardEvent)) {
        console.warn("getEventInfo(): not found", event, res);
      }
      return res;
    }
    if (res.colIdx === -1) {
      res.colIdx = 0;
    }
    res.colDef = tree?.columns[res.colIdx];
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

  /** Log to console if opts.debugLevel >= 3 */
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

  /**
   * Make sure that this node is scrolled into the viewport.
   *
   * @param {boolean | PlainObject} [effects=false] animation options.
   * @param {object} [options=null] {topNode: null, effects: ..., parent: ...}
   *     this node will remain visible in
   *     any case, even if `this` is outside the scroll pane.
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
    if (newTop != null) {
      this.log(
        "scrollTo(" + nodeOfs + "): " + curTop + " => " + newTop,
        height
      );
      this.scrollContainer.scrollTop = newTop;
      this.setModified(ChangeType.vscroll);
    }
  }

  /**
   * Set column #colIdx to 'active'.
   *
   * This higlights the column header and -cells by adding the `wb-active` class.
   * Available in cell-nav and cell-edit mode, not in row-mode.
   */
  setColumn(colIdx: number) {
    util.assert(this.navMode !== NavigationMode.row);
    util.assert(0 <= colIdx && colIdx < this.columns.length);
    this.activeColIdx = colIdx;

    // Update `wb-active` class for all headers
    if (this.headerElement) {
      for (let rowDiv of this.headerElement.children) {
        let i = 0;
        for (let colDiv of rowDiv.children) {
          (colDiv as HTMLElement).classList.toggle("wb-active", i++ === colIdx);
        }
      }
    }

    this.activeNode?.setModified(ChangeType.status);

    // Update `wb-active` class for all cell spans
    for (let rowDiv of this.nodeListElement.children) {
      let i = 0;
      for (let colDiv of rowDiv.children) {
        (colDiv as HTMLElement).classList.toggle("wb-active", i++ === colIdx);
      }
    }
  }

  /** Set or remove keybaord focus to the tree container. */
  setFocus(flag = true) {
    if (flag) {
      this.element.focus();
    } else {
      this.element.blur();
    }
  }

  /** Schedule an update request to reflect a tree change. */
  setModified(change: ChangeType, options?: any): void;

  /** Schedule an update request to reflect a single node modification. */
  setModified(change: ChangeType, node: WunderbaumNode, options?: any): void;

  setModified(
    change: ChangeType,
    node?: WunderbaumNode | any,
    options?: any
  ): void {
    if (this._disableUpdateCount) {
      // Assuming that we redraw all when enableUpdate() is re-enabled.
      // this.log(
      //   `IGNORED setModified(${change}) node=${node} (disable level ${this._disableUpdateCount})`
      // );
      return;
    }
    // this.log(`setModified(${change}) node=${node}`);
    if (!(node instanceof WunderbaumNode)) {
      options = node;
    }
    const immediate = !!util.getOption(options, "immediate");

    switch (change) {
      case ChangeType.any:
      case ChangeType.structure:
      case ChangeType.header:
        this.changeRedrawRequestPending = true;
        this.updateViewport(immediate);
        break;
      case ChangeType.vscroll:
        this.updateViewport(immediate);
        break;
      case ChangeType.row:
      case ChangeType.data:
      case ChangeType.status:
        // Single nodes are immedialtely updated if already inside the viewport
        // (otherwise we can ignore)
        if (node._rowElem) {
          node.render({ change: change });
        }
        break;
      default:
        util.error(`Invalid change type ${change}`);
    }
  }

  /** Set the tree's navigation mode. */
  setNavigationMode(mode: NavigationMode) {
    // util.assert(this.cellNavMode);
    // util.assert(0 <= colIdx && colIdx < this.columns.length);
    if (mode === this.navMode) {
      return;
    }
    const prevMode = this.navMode;
    const cellMode = mode !== NavigationMode.row;

    this.navMode = mode;
    if (cellMode && prevMode === NavigationMode.row) {
      this.setColumn(0);
    }
    this.element.classList.toggle("wb-cell-mode", cellMode);
    this.element.classList.toggle(
      "wb-cell-edit-mode",
      mode === NavigationMode.cellEdit
    );
    // this.setModified(ChangeType.row, this.activeNode);
    this.activeNode?.setModified(ChangeType.status);
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

  /** Display tree status (ok, loading, error, noData) using styles and a dummy root node. */
  setStatus(
    status: NodeStatusType,
    message?: string,
    details?: string
  ): WunderbaumNode | null {
    return this.root.setStatus(status, message, details);
  }

  /** Update column headers and width. */
  updateColumns(opts?: any) {
    opts = Object.assign({ calculateCols: true, updateRows: true }, opts);
    const minWidth = 4;
    const vpWidth = this.element.clientWidth;
    let totalWeight = 0;
    let fixedWidth = 0;

    let modified = false;

    if (opts.calculateCols) {
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
      const restPx = Math.max(0, vpWidth - fixedWidth);
      let ofsPx = 0;

      for (let col of this.columns) {
        if (col._weight) {
          const px = Math.max(minWidth, (restPx * col._weight) / totalWeight);
          if (col._widthPx != px) {
            modified = true;
            col._widthPx = px;
          }
        }
        col._ofsPx = ofsPx;
        ofsPx += col._widthPx;
      }
    }
    // Every column has now a calculated `_ofsPx` and `_widthPx`
    // this.logInfo("UC", this.columns, vpWidth, this.element.clientWidth, this.element);
    // console.trace();
    // util.error("BREAK");
    if (modified) {
      this._renderHeaderMarkup();
      if (opts.updateRows) {
        this._updateRows();
      }
    }
  }

  /** Create/update header markup from `this.columns` definition.
   * @internal
   */
  protected _renderHeaderMarkup() {
    if (!this.headerElement) {
      return;
    }
    const headerRow = this.headerElement.querySelector(".wb-row")!;
    util.assert(headerRow);
    headerRow.innerHTML = "<span class='wb-col'></span>".repeat(
      this.columns.length
    );

    for (let i = 0; i < this.columns.length; i++) {
      const col = this.columns[i];
      const colElem = <HTMLElement>headerRow.children[i];

      colElem.style.left = col._ofsPx + "px";
      colElem.style.width = col._widthPx + "px";
      // colElem.textContent = col.title || col.id;
      const title = util.escapeHtml(col.title || col.id);
      colElem.innerHTML = `<span class="wb-col-title">${title}</span> <span class="wb-col-resizer"></span>`;
      // colElem.innerHTML = `${title} <span class="wb-col-resizer"></span>`;
    }
  }

  /** Render header and all rows that are visible in the viewport (async, throttled). */
  updateViewport(immediate = false) {
    // Call the `throttle` wrapper for `this._updateViewport()` which will
    // execute immediately on the leading edge of a sequence:
    if (immediate) {
      this._updateViewport();
    } else {
      this._updateViewportThrottled();
    }
  }

  /**
   * This is the actual update method, which is wrapped inside a throttle method.
   * This protected method should not be called directly but via
   * `tree.updateViewport()` or `tree.setModified()`.
   * It calls `updateColumns()` and `_updateRows()`.
   * @internal
   */
  protected _updateViewport() {
    if (this._disableUpdateCount) {
      this.log(
        `IGNORED _updateViewport() disable level: ${this._disableUpdateCount}`
      );
      return;
    }
    const newNodesOnly = !this.changeRedrawRequestPending;
    this.changeRedrawRequestPending = false;

    let height = this.scrollContainer.clientHeight;
    // We cannot get the height for absolute positioned parent, so look at first col
    // let headerHeight = this.headerElement.clientHeight
    // let headerHeight = this.headerElement.children[0].children[0].clientHeight;
    const headerHeight = this.options.headerHeightPx;
    const wantHeight = this.element.clientHeight - headerHeight;

    if (Math.abs(height - wantHeight) > 1.0) {
      // this.log("resize", height, wantHeight);
      this.scrollContainer.style.height = wantHeight + "px";
      height = wantHeight;
    }
    // console.profile(`_updateViewport()`)

    this.updateColumns({ updateRows: false });

    this._updateRows({ newNodesOnly: newNodesOnly });

    // console.profileEnd(`_updateViewport()`)

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
   * - Traverse all *visible* of the whole tree, i.e. skip collapsed nodes.
   * - Store count of rows to `tree.treeRowCount`.
   * - Renumber `node._rowIdx` for all visible nodes.
   * - Calculate the index range that must be rendered to fill the viewport
   *   (including upper and lower prefetch)
   * -
   */
  protected _updateRows(opts?: any): boolean {
    const label = this.logTime("_updateRows");
    // this.log("_updateRows", opts)
    opts = Object.assign({ newNodesOnly: false }, opts);
    const newNodesOnly = !!opts.newNodesOnly;

    const row_height = ROW_HEIGHT;
    const vp_height = this.scrollContainer.clientHeight;
    const prefetch = RENDER_MAX_PREFETCH;
    const ofs = this.scrollContainer.scrollTop;

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
        node.render({ top: top, after: prevElem });
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
    //   `render(scrollOfs:${ofs}, ${startIdx}..${endIdx})`,
    //   this.nodeListElement.style.height
    // );
    this.logTimeEnd(label);
    // this._validateRows();
    return modified;
  }

  /**
   * Call callback(node) for all nodes in hierarchical order (depth-first).
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
   * Call fn(node) for all nodes in vertical order, top down (or bottom up).
   *
   * Note that this considers expansion state, i.e. children of collapsed nodes
   * are skipped.
   *
   * Stop iteration, if fn() returns false.<br>
   * Return false if iteration was stopped.
   *
   * @param callback the callback function.
   *     Return false to stop iteration, return "skip" to skip this node and children only.
   * @param [options]
   *     Defaults:
   *     {start: First tree node, reverse: false, includeSelf: true, includeHidden: false, wrap: false}
   * @returns {boolean} false if iteration was canceled
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

  /**
   * Call fn(node) for all nodes in vertical order, bottom up.
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

  /**
   * Reload the tree with a new source.
   *
   * Previous data is cleared.
   * Pass `options.columns` to define a header (may also be part of `source.columns`).
   */
  load(source: any, options: any = {}) {
    this.clear();
    const columns = options.columns || source.columns;
    if (columns) {
      this.columns = options.columns;
      // this._renderHeaderMarkup();
      this.updateColumns({ calculateCols: false });
    }
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
        this.updateViewport();
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
