declare module "util" {
    /*!
     * Wunderbaum - util
     * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    /** @module util */
    /** Readable names for `MouseEvent.button` */
    export const MOUSE_BUTTONS: {
        [key: number]: string;
    };
    export const MAX_INT = 9007199254740991;
    /**True if the client is using a macOS platform. */
    export const isMac: boolean;
    export type FunctionType = (...args: any[]) => any;
    export type EventCallbackType = (e: Event) => boolean | void;
    /**
     * A ES6 Promise, that exposes the resolve()/reject() methods.
     */
    export class Deferred {
        private thens;
        private catches;
        private status;
        private resolvedValue;
        private rejectedError;
        constructor();
        resolve(value?: any): void;
        reject(error?: any): void;
        then(cb: any): void;
        catch(cb: any): void;
        promise(): {
            then: (cb: any) => void;
            catch: (cb: any) => void;
        };
    }
    /**Throw an `Error` if `cond` is falsey. */
    export function assert(cond: any, msg?: string): void;
    /** Run `callback` when document was loaded. */
    export function documentReady(callback: () => void): void;
    /** Resolve when document was loaded. */
    export function documentReadyPromise(): Promise<void>;
    /**
     * Iterate over Object properties or array elements.
     *
     * @param obj `Object`, `Array` or null
     * @param callback(index, item) called for every item.
     *  `this` also contains the item.
     *  Return `false` to stop the iteration.
     */
    export function each(obj: any, callback: (index: number | string, item: any) => void | boolean): any;
    /** Shortcut for `throw new Error(msg)`.*/
    export function error(msg: string): void;
    /** Convert `<`, `>`, `&`, `"`, `'`, and `/` to the equivalent entities. */
    export function escapeHtml(s: string): string;
    /**Convert a regular expression string by escaping special characters (e.g. `"$"` -> `"\$"`) */
    export function escapeRegex(s: string): string;
    /** Convert `<`, `>`, `"`, `'`, and `/` (but not `&`) to the equivalent entities. */
    export function escapeTooltip(s: string): string;
    /** TODO */
    export function extractHtmlText(s: string): string;
    /**
     * Read the value from an HTML input element.
     *
     * If a `<span class="wb-col">` is passed, the first child input is used.
     * Depending on the target element type, `value` is interpreted accordingly.
     * For example for a checkbox, a value of true, false, or null is returned if
     * the element is checked, unchecked, or indeterminate.
     * For datetime input control a numerical value is assumed, etc.
     *
     * Common use case: store the new user input in a `change` event handler:
     *
     * ```ts
     *   change: (e) => {
     *     const tree = e.tree;
     *     const node = e.node;
     *     // Read the value from the input control that triggered the change event:
     *     let value = tree.getValueFromElem(e.element);
     *     // and store it to the node model (assuming the column id matches the property name)
     *     node.data[e.info.colId] = value;
     *   },
     * ```
     * @param elem `<input>` or `<select>` element. Also a parent `span.wb-col` is accepted.
     * @param coerce pass true to convert date/time inputs to `Date`.
     * @returns the value
     */
    export function getValueFromElem(elem: HTMLElement, coerce?: boolean): any;
    /**
     * Set the value of an HTML input element.
     *
     * If a `<span class="wb-col">` is passed, the first child input is used.
     * Depending on the target element type, `value` is interpreted accordingly.
     * For example a checkbox is set to checked, unchecked, or indeterminate if the
     * value is truethy, falsy, or `null`.
     * For datetime input control a numerical value is assumed, etc.
     *
     * Common use case: update embedded input controls in a `render` event handler:
     *
     * ```ts
     *   render: (e) => {
     *     // e.node.log(e.type, e, e.node.data);
     *
     *     for (const col of Object.values(e.renderColInfosById)) {
     *       switch (col.id) {
     *         default:
     *           // Assumption: we named column.id === node.data.NAME
     *           util.setValueToElem(col.elem, e.node.data[col.id]);
     *           break;
     *       }
     *     }
     *   },
     * ```
     *
     * @param elem `<input>` or `<select>` element Also a parent `span.wb-col` is accepted.
     * @param value a value that matches the target element.
     */
    export function setValueToElem(elem: HTMLElement, value: any): void;
    /** Show/hide element by setting the `display` style to 'none'. */
    export function setElemDisplay(elem: string | Element, flag: boolean): void;
    /** Create and return an unconnected `HTMLElement` from a HTML string. */
    export function elemFromHtml(html: string): HTMLElement;
    /** Return a HtmlElement from selector or cast an existing element. */
    export function elemFromSelector(obj: string | Element): HTMLElement | null;
    /** Return a EventTarget from selector or cast an existing element. */
    export function eventTargetFromSelector(obj: string | EventTarget): EventTarget | null;
    /**
     * Return a canonical descriptive string for a keyboard or mouse event.
     *
     * The result also contains a prefix for modifiers if any, for example
     * `"x"`, `"F2"`, `"Control+Home"`, or `"Shift+clickright"`.
     * This is especially useful in `switch` statements, to make sure that modifier
     * keys are considered and handled correctly:
     * ```ts
     *   const eventName = util.eventToString(e);
     *   switch (eventName) {
     *     case "+":
     *     case "Add":
     *       ...
     *       break;
     *     case "Enter":
     *     case "End":
     *     case "Control+End":
     *     case "Meta+ArrowDown":
     *     case "PageDown":
     *       ...
     *       break;
     *   }
     * ```
     */
    export function eventToString(event: Event): string;
    /**
     * Copy allproperties from one or more source objects to a target object.
     *
     * @returns the modified target object.
     */
    export function extend(...args: any[]): any;
    /** Return true if `obj` is of type `array`. */
    export function isArray(obj: any): boolean;
    /** Return true if `obj` is of type `Object` and has no propertied. */
    export function isEmptyObject(obj: any): boolean;
    /** Return true if `obj` is of type `function`. */
    export function isFunction(obj: any): boolean;
    /** Return true if `obj` is of type `Object`. */
    export function isPlainObject(obj: any): boolean;
    /** A dummy function that does nothing ('no operation'). */
    export function noop(...args: any[]): any;
    /**
     * Bind one or more event handlers directly to an [[EventTarget]].
     *
     * @param element EventTarget or selector
     * @param eventNames
     * @param handler
     */
    export function onEvent(rootTarget: EventTarget | string, eventNames: string, handler: EventCallbackType): void;
    /**
     * Bind one or more event handlers using event delegation.
     *
     * E.g. handle all 'input' events for input and textarea elements of a given
     * form:
     * ```ts
     * onEvent("#form_1", "input", "input,textarea", function (e: Event) {
     *   console.log(e.type, e.target);
     * });
     * ```
     *
     * @param element EventTarget or selector
     * @param eventNames
     * @param selector
     * @param handler
     */
    export function onEvent(rootTarget: EventTarget | string, eventNames: string, selector: string, handler: EventCallbackType): void;
    /** Return a wrapped handler method, that provides `this._super` and `this._superApply`.
     *
     * ```ts
      // Implement `opts.createNode` event to add the 'draggable' attribute
      overrideMethod(ctx.options, "createNode", (event, data) => {
        // Default processing if any
        this._super.apply(this, event, data);
        // Add 'draggable' attribute
        data.node.span.draggable = true;
      });
      ```
      */
    export function overrideMethod(instance: any, methodName: string, handler: FunctionType, ctx?: any): void;
    /** Run function after ms milliseconds and return a promise that resolves when done. */
    export function setTimeoutPromise(this: unknown, callback: (...args: any[]) => void, ms: number): Promise<unknown>;
    /**
     * Wait `ms` microseconds.
     *
     * Example:
     * ```js
     * await sleep(1000);
     * ```
     * @param ms duration
     * @returns
     */
    export function sleep(ms: number): Promise<unknown>;
    /**
     * Set or rotate checkbox status with support for tri-state.
     *
     * An initial 'indeterminate' state becomes 'checked' on the first call.
     *
     * If the input element has the class 'wb-tristate' assigned, the sequence is:<br>
     * 'indeterminate' -> 'checked' -> 'unchecked' -> 'indeterminate' -> ...<br>
     * Otherwise we toggle like <br>
     * 'checked' -> 'unchecked' -> 'checked' -> ...
     */
    export function toggleCheckbox(element: HTMLElement | string, value?: boolean | null, tristate?: boolean): void;
    /**
     * Return `opts.NAME` if opts is valid and
     *
     * @param opts dict, object, or null
     * @param name option name (use dot notation to access extension option, e.g. `filter.mode`)
     * @param defaultValue returned when `opts` is not an object, or does not have a NAME property
     */
    export function getOption(opts: any, name: string, defaultValue?: any): any;
    /** Convert an Array or space-separated string to a Set. */
    export function toSet(val: any): Set<string>;
    /** Return a canonical string representation for an object's type (e.g. 'array', 'number', ...). */
    export function type(obj: any): string;
    /**
     * Return a function that can be called instead of `callback`, but guarantees
     * a limited execution rate.
     * The execution rate is calculated based on the runtime duration of the
     * previous call.
     * Example:
     * ```js
     * throttledFoo = util.adaptiveThrottle(foo.bind(this), {});
     * throttledFoo();
     * throttledFoo();
     * ```
     */
    export function adaptiveThrottle(this: unknown, callback: (...args: any[]) => void, options: any): (...args: any[]) => void;
}
declare module "common" {
    /*!
     * Wunderbaum - common
     * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    import { MatcherCallback } from "types";
    import { WunderbaumNode } from "wb_node";
    export const DEFAULT_DEBUGLEVEL = 4;
    /**
     * Fixed height of a row in pixel. Must match the SCSS variable `$row-outer-height`.
     */
    export const ROW_HEIGHT = 22;
    /**
     * Fixed width of node icons in pixel. Must match the SCSS variable `$icon-outer-width`.
     */
    export const ICON_WIDTH = 20;
    /**
     * Adjust the width of the title span, so overflow ellipsis work.
     * (2 x `$col-padding-x` + 3px rounding errors).
     */
    export const TITLE_SPAN_PAD_Y = 7;
    /** Render row markup for N nodes above and below the visible viewport. */
    export const RENDER_MAX_PREFETCH = 5;
    /** Skip rendering new rows when we have at least N nodes rendeed above and below the viewport. */
    export const RENDER_MIN_PREFETCH = 5;
    /** Regular expression to detect if a string describes an image URL (in contrast
     * to a class name). Strings are considered image urls if they contain '.' or '/'.
     */
    export const TEST_IMG: RegExp;
    /**
     * Default node icons.
     * Requires bootstrap icons https://icons.getbootstrap.com
     */
    export const iconMap: {
        error: string;
        loading: string;
        noData: string;
        expanderExpanded: string;
        expanderCollapsed: string;
        expanderLazy: string;
        checkChecked: string;
        checkUnchecked: string;
        checkUnknown: string;
        radioChecked: string;
        radioUnchecked: string;
        radioUnknown: string;
        folder: string;
        folderOpen: string;
        folderLazy: string;
        doc: string;
    };
    export const KEY_NODATA = "__not_found__";
    /** Define which keys are handled by embedded <input> control, and should
     * *not* be passed to tree navigation handler in cell-edit mode.
     */
    export const INPUT_KEYS: {
        [key: string]: Array<string>;
    };
    /** Dict keys that are evaluated by source loader (others are added to `tree.data` instead). */
    export const RESERVED_TREE_SOURCE_KEYS: Set<string>;
    /** Map `KeyEvent.key` to navigation action. */
    export const KEY_TO_ACTION_DICT: {
        [key: string]: string;
    };
    /** Return a callback that returns true if the node title matches the string
     * or regular expression.
     * @see {@link WunderbaumNode.findAll}
     */
    export function makeNodeTitleMatcher(match: string | RegExp): MatcherCallback;
    /** Return a callback that returns true if the node title starts with a string (case-insensitive). */
    export function makeNodeTitleStartMatcher(s: string): MatcherCallback;
    /** Compare two nodes by title (case-insensitive). */
    export function nodeTitleSorter(a: WunderbaumNode, b: WunderbaumNode): number;
    export function inflateSourceData(source: any): void;
}
declare module "deferred" {
    /*!
     * Wunderbaum - deferred
     * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    type PromiseCallbackType = (val: any) => void;
    type finallyCallbackType = () => void;
    /**
     * Implement a ES6 Promise, that exposes a resolve() and reject() method.
     *
     * Loosely mimics {@link https://api.jquery.com/category/deferred-object/ | jQuery.Deferred}.
     * Example:
     * ```js
     * function foo() {
     *   let dfd = new Deferred(),
     *   ...
     *   dfd.resolve('foo')
     *   ...
     *   return dfd.promise();
     * }
     * ```
     */
    export class Deferred {
        private _promise;
        protected _resolve: any;
        protected _reject: any;
        constructor();
        /** Resolve the [[Promise]]. */
        resolve(value?: any): void;
        /** Reject the [[Promise]]. */
        reject(reason?: any): void;
        /** Return the native [[Promise]] instance.*/
        promise(): Promise<any>;
        /** Call [[Promise.then]] on the embedded promise instance.*/
        then(cb: PromiseCallbackType): Promise<void>;
        /** Call [[Promise.catch]] on the embedded promise instance.*/
        catch(cb: PromiseCallbackType): Promise<any>;
        /** Call [[Promise.finally]] on the embedded promise instance.*/
        finally(cb: finallyCallbackType): Promise<any>;
    }
}
declare module "wb_node" {
    /*!
     * Wunderbaum - wunderbaum_node
     * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    import "./wunderbaum.scss";
    import { Wunderbaum } from "wunderbaum";
    import { AddChildrenOptions, InsertNodeType, ApplyCommandOptions, ApplyCommandType, ChangeType, ExpandAllOptions, MakeVisibleOptions, MatcherCallback, NavigateOptions, NodeAnyCallback, NodeStatusType, NodeStringCallback, NodeVisitCallback, NodeVisitResponse, RenderOptions, ScrollIntoViewOptions, SetActiveOptions, SetExpandedOptions, SetSelectedOptions, SetStatusOptions, SortCallback, NodeToDictCallback, WbNodeData } from "types";
    /**
     * A single tree node.
     *
     * **NOTE:** <br>
     * Generally you should not modify properties directly, since this may break
     * the internal bookkeeping.
     */
    export class WunderbaumNode {
        static sequence: number;
        /** Reference to owning tree. */
        tree: Wunderbaum;
        /** Parent node (null for the invisible root node `tree.root`). */
        parent: WunderbaumNode;
        /** Name of the node.
         * @see Use {@link setTitle} to modify. */
        title: string;
        /** Unique key. Passed with constructor or defaults to `SEQUENCE`.
         * @see Use {@link setKey} to modify. */
        readonly key: string;
        /** Reference key. Unlike {@link key}, a `refKey` may occur multiple
         * times within a tree (in this case we have 'clone nodes').
         * @see Use {@link setKey} to modify.
         */
        readonly refKey: string | undefined;
        children: WunderbaumNode[] | null;
        checkbox?: boolean;
        /** If true, (in grid mode) no cells are rendered, except for the node title.*/
        colspan?: boolean;
        icon?: boolean | string;
        lazy: boolean;
        /** Expansion state.
         * @see {@link isExpandable}, {@link isExpanded}, {@link setExpanded}. */
        expanded: boolean;
        /** Selection state.
         * @see {@link isSelected}, {@link setSelected}. */
        selected: boolean;
        type?: string;
        tooltip?: string;
        /** Additional classes added to `div.wb-row`.
         * @see {@link hasClass}, {@link setClass}. */
        classes: Set<string> | null;
        /** Custom data that was passed to the constructor */
        data: any;
        statusNodeType?: string;
        _isLoading: boolean;
        _requestId: number;
        _errorInfo: any | null;
        _partsel: boolean;
        _partload: boolean;
        match?: boolean;
        subMatchCount?: number;
        subMatchBadge?: HTMLElement;
        /** @internal */
        titleWithHighlight?: string;
        _filterAutoExpanded?: boolean;
        _rowIdx: number | undefined;
        _rowElem: HTMLDivElement | undefined;
        constructor(tree: Wunderbaum, parent: WunderbaumNode, data: any);
        /**
         * Return readable string representation for this instance.
         * @internal
         */
        toString(): string;
        /**
         * Iterate all descendant nodes depth-first, pre-order using `for ... of ...` syntax.
         * More concise, but slightly slower than {@link WunderbaumNode.visit}.
         *
         * Example:
         * ```js
         * for(const n of node) {
         *   ...
         * }
         * ```
         */
        [Symbol.iterator](): IterableIterator<WunderbaumNode>;
        /** Call event handler if defined in tree.options.
         * Example:
         * ```js
         * node._callEvent("edit.beforeEdit", {foo: 42})
         * ```
         */
        _callEvent(type: string, extra?: any): any;
        /**
         * Append (or insert) a list of child nodes.
         *
         * Tip: pass `{ before: 0 }` to prepend new nodes as first children.
         *
         * @returns first child added
         */
        addChildren(nodeData: WbNodeData | WbNodeData[], options?: AddChildrenOptions): WunderbaumNode;
        /**
         * Append or prepend a node, or append a child node.
         *
         * This a convenience function that calls addChildren()
         *
         * @param nodeData node definition
         * @param [mode=child] 'before', 'after', 'firstChild', or 'child' ('over' is a synonym for 'child')
         * @returns new node
         */
        addNode(nodeData: WbNodeData, mode?: InsertNodeType): WunderbaumNode;
        /**
         * Apply a modification (or navigation) operation.
         *
         * @see {@link Wunderbaum.applyCommand}
         */
        applyCommand(cmd: ApplyCommandType, options: ApplyCommandOptions): any;
        /**
         * Add/remove one or more classes to `<div class='wb-row'>`.
         *
         * This also maintains `node.classes`, so the class will survive a re-render.
         *
         * @param className one or more class names. Multiple classes can be passed
         *     as space-separated string, array of strings, or set of strings.
         */
        setClass(className: string | string[] | Set<string>, flag?: boolean): void;
        /** Call `setExpanded()` on all descendant nodes. */
        expandAll(flag?: boolean, options?: ExpandAllOptions): Promise<void>;
        /**
         * Find all descendant nodes that match condition (excluding self).
         *
         * If `match` is a string, search for exact node title.
         * If `match` is a RegExp expression, apply it to node.title, using
         * [RegExp.test()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test).
         * If `match` is a callback, match all nodes for that the callback(node) returns true.
         *
         * Returns an empty array if no nodes were found.
         *
         * Examples:
         * ```js
         * // Match all node titles that match exactly 'Joe':
         * nodeList = node.findAll("Joe")
         * // Match all node titles that start with 'Joe' case sensitive:
         * nodeList = node.findAll(/^Joe/)
         * // Match all node titles that contain 'oe', case insensitive:
         * nodeList = node.findAll(/oe/i)
         * // Match all nodes with `data.price` >= 99:
         * nodeList = node.findAll((n) => {
         *   return n.data.price >= 99;
         * })
         * ```
         */
        findAll(match: string | RegExp | MatcherCallback): WunderbaumNode[];
        /** Return the direct child with a given key, index or null. */
        findDirectChild(ptr: number | string | WunderbaumNode): WunderbaumNode | null;
        /**
         * Find first descendant node that matches condition (excluding self) or null.
         *
         * @see {@link WunderbaumNode.findAll} for examples.
         */
        findFirst(match: string | RegExp | MatcherCallback): WunderbaumNode | null;
        /** Find a node relative to self.
         *
         * @see {@link Wunderbaum.findRelatedNode|tree.findRelatedNode()}
         */
        findRelatedNode(where: string, includeHidden?: boolean): any;
        /**
         * Iterator version of {@link WunderbaumNode.format}.
         */
        format_iter(name_cb?: NodeStringCallback, connectors?: string[]): IterableIterator<string>;
        /**
         * Return a multiline string representation of a node/subnode hierarchy.
         * Mostly useful for debugging.
         *
         * Example:
         * ```js
         * console.info(tree.getActiveNode().format((n)=>n.title));
         * ```
         * logs
         * ```
         * Books
         *  ├─ Art of War
         *  ╰─ Don Quixote
         * ```
         * @see {@link WunderbaumNode.format_iter}
         */
        format(name_cb?: NodeStringCallback, connectors?: string[]): string;
        /** Return the `<span class='wb-col'>` element with a given index or id.
         * @returns {WunderbaumNode | null}
         */
        getColElem(colIdx: number | string): HTMLSpanElement;
        /** Return the first child node or null.
         * @returns {WunderbaumNode | null}
         */
        getFirstChild(): WunderbaumNode;
        /** Return the last child node or null.
         * @returns {WunderbaumNode | null}
         */
        getLastChild(): WunderbaumNode;
        /** Return node depth (starting with 1 for top level nodes). */
        getLevel(): number;
        /** Return the successive node (under the same parent) or null. */
        getNextSibling(): WunderbaumNode | null;
        /** Return the parent node (null for the system root node). */
        getParent(): WunderbaumNode | null;
        /** Return an array of all parent nodes (top-down).
         * @param includeRoot Include the invisible system root node.
         * @param includeSelf Include the node itself.
         */
        getParentList(includeRoot?: boolean, includeSelf?: boolean): any[];
        /** Return a string representing the hierachical node path, e.g. "a/b/c".
         * @param includeSelf
         * @param node property name or callback
         * @param separator
         */
        getPath(includeSelf?: boolean, part?: keyof WunderbaumNode | NodeAnyCallback, separator?: string): string;
        /** Return the preceeding node (under the same parent) or null. */
        getPrevSibling(): WunderbaumNode | null;
        /** Return true if node has children.
         * Return undefined if not sure, i.e. the node is lazy and not yet loaded.
         */
        hasChildren(): boolean;
        /** Return true if node has className set. */
        hasClass(className: string): boolean;
        /** Return true if this node is the currently active tree node. */
        isActive(): boolean;
        /** Return true if this node is a direct or indirect parent of `other`.
         * (See also [[isParentOf]].)
         */
        isAncestorOf(other: WunderbaumNode): boolean;
        /** Return true if this node is a **direct** subnode of `other`.
         * (See also [[isDescendantOf]].)
         */
        isChildOf(other: WunderbaumNode): boolean;
        /** Return true if this node's title spans all columns, i.e. the node has no
         * grid cells.
         */
        isColspan(): boolean;
        /** Return true if this node is a direct or indirect subnode of `other`.
         * (See also [[isChildOf]].)
         */
        isDescendantOf(other: WunderbaumNode): boolean;
        /** Return true if this node has children, i.e. the node is generally expandable.
         * If `andCollapsed` is set, we also check if this node is collapsed, i.e.
         * an expand operation is currently possible.
         */
        isExpandable(andCollapsed?: boolean): boolean;
        /** Return true if this node is currently in edit-title mode. */
        isEditing(): boolean;
        /** Return true if this node is currently expanded. */
        isExpanded(): boolean;
        /** Return true if this node is the first node of its parent's children. */
        isFirstSibling(): boolean;
        /** Return true if this node is the last node of its parent's children. */
        isLastSibling(): boolean;
        /** Return true if this node is lazy (even if data was already loaded) */
        isLazy(): boolean;
        /** Return true if node is lazy and loaded. For non-lazy nodes always return true. */
        isLoaded(): boolean;
        /** Return true if node is currently loading, i.e. a GET request is pending. */
        isLoading(): boolean;
        /** Return true if this node is a temporarily generated status node of type 'paging'. */
        isPagingNode(): boolean;
        /** Return true if this node is a **direct** parent of `other`.
         * (See also [[isAncestorOf]].)
         */
        isParentOf(other: WunderbaumNode): boolean;
        /** (experimental) Return true if this node is partially loaded. */
        isPartload(): boolean;
        /** Return true if this node is partially selected (tri-state). */
        isPartsel(): boolean;
        /** Return true if this node has DOM representaion, i.e. is displayed in the viewport. */
        isRendered(): boolean;
        /** Return true if this node is the (invisible) system root node.
         * (See also [[isTopLevel()]].)
         */
        isRootNode(): boolean;
        /** Return true if this node is selected, i.e. the checkbox is set. */
        isSelected(): boolean;
        /** Return true if this node is a temporarily generated system node like
         * 'loading', 'paging', or 'error' (node.statusNodeType contains the type).
         */
        isStatusNode(): boolean;
        /** Return true if this a top level node, i.e. a direct child of the (invisible) system root node. */
        isTopLevel(): boolean;
        /** Return true if node is marked lazy but not yet loaded.
         * For non-lazy nodes always return false.
         */
        isUnloaded(): boolean;
        /** Return true if all parent nodes are expanded. Note: this does not check
         * whether the node is scrolled into the visible part of the screen or viewport.
         */
        isVisible(): boolean;
        protected _loadSourceObject(source: any, level?: number): void;
        _fetchWithOptions(source: any): Promise<any>;
        /** Download  data from the cloud, then call `.update()`. */
        load(source: any): Promise<void>;
        /**Load content of a lazy node. */
        loadLazy(forceReload?: boolean): Promise<void>;
        /** Alias for `logDebug` */
        log(...args: any[]): void;
        logDebug(...args: any[]): void;
        logError(...args: any[]): void;
        logInfo(...args: any[]): void;
        logWarn(...args: any[]): void;
        /** Expand all parents and optionally scroll into visible area as neccessary.
         * Promise is resolved, when lazy loading and animations are done.
         * @param {object} [options] passed to `setExpanded()`.
         *     Defaults to {noAnimation: false, noEvents: false, scrollIntoView: true}
         */
        makeVisible(options?: MakeVisibleOptions): Promise<any>;
        /** Move this node to targetNode. */
        moveTo(targetNode: WunderbaumNode, mode?: InsertNodeType, map?: NodeAnyCallback): void;
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
        navigate(where: string, options?: NavigateOptions): Promise<any>;
        /** Delete this node and all descendants. */
        remove(): void;
        /** Remove all descendants of this node. */
        removeChildren(): void;
        /** Remove all HTML markup from the DOM. */
        removeMarkup(): void;
        protected _getRenderInfo(): any;
        protected _createIcon(parentElem: HTMLElement, replaceChild: HTMLElement | null, showLoading: boolean): HTMLElement | null;
        /**
         * Create a whole new `<div class="wb-row">` element.
         * @see {@link WunderbaumNode.render}
         */
        protected _render_markup(opts: RenderOptions): void;
        /**
         * Render `node.title`, `.icon` into an existing row.
         *
         * @see {@link WunderbaumNode.render}
         */
        protected _render_data(opts: RenderOptions): void;
        /**
         * Update row classes to reflect active, focuses, etc.
         * @see {@link WunderbaumNode.render}
         */
        protected _render_status(opts: RenderOptions): void;
        /**
         * Create or update node's markup.
         *
         * `options.change` defaults to ChangeType.data, which updates the title,
         * icon, and status. It also triggers the `render` event, that lets the user
         * create or update the content of embeded cell elements.
         *
         * If only the status or other class-only modifications have changed,
         * `options.change` should be set to ChangeType.status instead for best
         * efficiency.
         *
         * Calling `setModified` instead may be a better alternative.
         * @see {@link WunderbaumNode.setModified}
         */
        render(options?: RenderOptions): void;
        /**
         * Remove all children, collapse, and set the lazy-flag, so that the lazyLoad
         * event is triggered on next expand.
         */
        resetLazy(): void;
        /** Convert node (or whole branch) into a plain object.
         *
         * The result is compatible with node.addChildren().
         *
         * @param include child nodes
         * @param callback(dict, node) is called for every node, in order to allow
         *     modifications.
         *     Return `false` to ignore this node or `"skip"` to include this node
         *     without its children.
         * @see {@link Wunderbaum.toDictArray}.
         */
        toDict(recursive?: boolean, callback?: NodeToDictCallback): WbNodeData;
        /** Return an option value that has a default, but may be overridden by a
         * callback or a node instance attribute.
         *
         * Evaluation sequence:
         *
         * - If `tree.options.<name>` is a callback that returns something, use that.
         * - Else if `node.<name>` is defined, use that.
         * - Else if `tree.types[<node.type>]` is a value, use that.
         * - Else if `tree.options.<name>` is a value, use that.
         * - Else use `defaultValue`.
         *
         * @param name name of the option property (on node and tree)
         * @param defaultValue return this if nothing else matched
         * {@link Wunderbaum.getOption|Wunderbaum.getOption()}
         */
        getOption(name: string, defaultValue?: any): any;
        /** Make sure that this node is visible in the viewport.
         * @see {@link Wunderbaum.scrollTo|Wunderbaum.scrollTo()}
         */
        scrollIntoView(options?: ScrollIntoViewOptions): Promise<void>;
        /**
         * Activate this node, deactivate previous, send events, activate column and scroll int viewport.
         */
        setActive(flag?: boolean, options?: SetActiveOptions): Promise<any>;
        /**
         * Expand or collapse this node.
         */
        setExpanded(flag?: boolean, options?: SetExpandedOptions): Promise<void>;
        /**
         * Set keyboard focus here.
         * @see {@link setActive}
         */
        setFocus(flag?: boolean): void;
        /** Set a new icon path or class. */
        setIcon(icon: string): void;
        /** Change node's {@link key} and/or {@link refKey}.  */
        setKey(key: string | null, refKey: string | null): void;
        /**
         * Trigger a repaint, typically after a status or data change.
         *
         * `change` defaults to 'data', which handles modifcations of title, icon,
         * and column content. It can be reduced to 'ChangeType.status' if only
         * active/focus/selected state has changed.
         *
         * This method will eventually call  {@link WunderbaumNode.render()} with
         * default options, but may be more consistent with the tree's
         * {@link Wunderbaum.setModified()} API.
         */
        setModified(change?: ChangeType): void;
        /** Modify the check/uncheck state. */
        setSelected(flag?: boolean, options?: SetSelectedOptions): void;
        /** Display node status (ok, loading, error, noData) using styles and a dummy child node. */
        setStatus(status: NodeStatusType, options?: SetStatusOptions): WunderbaumNode | null;
        /** Rename this node. */
        setTitle(title: string): void;
        _sortChildren(cmp: SortCallback, deep: boolean): void;
        /**
         * Sort child list by title or custom criteria.
         * @param {function} cmp custom compare function(a, b) that returns -1, 0, or 1
         *    (defaults to sorting by title).
         * @param {boolean} deep pass true to sort all descendant nodes recursively
         */
        sortChildren(cmp?: SortCallback | null, deep?: boolean): void;
        /**
         * Trigger `modifyChild` event on a parent to signal that a child was modified.
         * @param {string} operation Type of change: 'add', 'remove', 'rename', 'move', 'data', ...
         */
        triggerModifyChild(operation: string, child: WunderbaumNode | null, extra?: any): void;
        /**
         * Trigger `modifyChild` event on node.parent(!).
         * @param {string} operation Type of change: 'add', 'remove', 'rename', 'move', 'data', ...
         * @param {object} [extra]
         */
        triggerModify(operation: string, extra?: any): void;
        /**
         * Call `callback(node)` for all child nodes in hierarchical order (depth-first, pre-order).
         *
         * Stop iteration, if fn() returns false. Skip current branch, if fn()
         * returns "skip".<br>
         * Return false if iteration was stopped.
         *
         * @param {function} callback the callback function.
         *     Return false to stop iteration, return "skip" to skip this node and
         *     its children only.
         * @see {@link IterableIterator<WunderbaumNode>}, {@link Wunderbaum.visit}.
         */
        visit(callback: NodeVisitCallback, includeSelf?: boolean): NodeVisitResponse;
        /** Call fn(node) for all parent nodes, bottom-up, including invisible system root.<br>
         * Stop iteration, if callback() returns false.<br>
         * Return false if iteration was stopped.
         *
         * @param callback the callback function. Return false to stop iteration
         */
        visitParents(callback: (node: WunderbaumNode) => boolean | void, includeSelf?: boolean): boolean;
        /**
         * Call fn(node) for all sibling nodes.<br>
         * Stop iteration, if fn() returns false.<br>
         * Return false if iteration was stopped.
         *
         * @param {function} fn the callback function.
         *     Return false to stop iteration.
         */
        visitSiblings(callback: (node: WunderbaumNode) => boolean | void, includeSelf?: boolean): boolean;
        /**
         * [ext-filter] Return true if this node is matched by current filter (or no filter is active).
         */
        isMatched(): boolean;
    }
}
declare module "wb_options" {
    /*!
     * Wunderbaum - utils
     * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    import { BoolOptionResolver, ColumnDefinitionList, DndOptionsType, NavModeEnum, NodeTypeDefinitionMap, WbActivateEventType, WbChangeEventType, WbClickEventType, WbDeactivateEventType, WbEnhanceTitleEventType, WbErrorEventType, WbInitEventType, WbKeydownEventType, WbNodeData, WbNodeEventType, WbReceiveEventType, WbRenderEventType, WbTreeEventType } from "types";
    /**
     * Available options for [[Wunderbaum]].
     *
     * Options are passed to the constructor as plain object:
     *
     * ```js
     * const tree = new mar10.Wunderbaum({
     *   id: "demo",
     *   element: document.getElementById("demo-tree"),
     *   source: "url/of/data/request",
     *   ...
     * });
     * ```
     *
     * Event handlers are also passed as callbacks
     *
     * ```js
     * const tree = new mar10.Wunderbaum({
     *   ...
     *   init: (e) => {
     *     console.log(`Tree ${e.tree} was initialized and loaded.`)
     *   },
     *   activate: (e) => {
     *     console.log(`Node ${e.node} was activated.`)
     *   },
     *   ...
     * });
     * ```
     */
    export interface WunderbaumOptions {
        /**
         * The target `div` element (or selector) that shall become a Wunderbaum.
         */
        element: string | HTMLDivElement;
        /**
         * The identifier of this tree. Used to reference the instance, especially
         * when multiple trees are present (e.g. `tree = mar10.Wunderbaum.getTree("demo")`).
         *
         * Default: `"wb_" + COUNTER`.
         */
        id?: string;
        /**
         * Define the initial tree data. Typically a URL of an endpoint that serves
         * a JSON formatted structure, but also a callback, Promise, or static data
         * is allowed.
         *
         * Default: `{}`.
         */
        source?: string | Array<WbNodeData>;
        /**
         * Define shared attributes for multiple nodes of the same type.
         * This allows for more compact data models. Type definitions can be passed
         * as tree option, or be part of a `source` response.
         *
         * Default: `{}`.
         */
        types?: NodeTypeDefinitionMap;
        /**
         * A list of maps that define column headers. If this option is set,
         * Wunderbaum becomes a treegrid control instead of a plain tree.
         * Column definitions can be passed as tree option, or be part of a `source`
         * response.
         * Default: `[]` meaning this is a plain tree.
         */
        columns?: ColumnDefinitionList;
        /**
         * If true, add a `wb-skeleton` class to all nodes, that will result in a
         * 'glow' effect. Typically used with initial dummy nodes, while loading the
         * real data.
         * Default: false.
         */
        skeleton?: boolean;
        /**
         * Translation map for some system messages.
         */
        strings?: any;
        /**
         * 0:quiet, 1:errors, 2:warnings, 3:info, 4:verbose
         * Default: 3 (4 in local debug environment)
         */
        debugLevel?: number;
        /**
         * Number of levels that are forced to be expanded, and have no expander icon.
         * E.g. 1 would keep all toplevel nodes expanded.
         * Default: 0
         */
        minExpandLevel?: number;
        /**
         * If true, allow to expand parent nodes, even if `node.children` conatains
         * an empty array (`[]`). This is the the behavior of macOS Finder, for example.
         * Default: false
         */
        emptyChildListExpandable?: boolean;
        /**
         * Height of a node row div.
         * Default: 22
         */
        rowHeightPx?: number;
        /**
         * Collapse siblings when a node is expanded.
         * Default: false
         */
        autoCollapse?: boolean;
        /**
         * HTMLElement that receives the top nodes breadcrumb.
         * Default: undefined
         */
        connectTopBreadcrumb?: HTMLElement;
        /**
         * Default:  NavModeEnum.startRow
         */
        navigationModeOption?: NavModeEnum;
        /**
         * Show/hide header (default: null)
         * null: assume false for plain tree and true for grids.
         * string: use text as header (only for plain trees)
         * true: display a header (use tree's id as text for plain trees)
         * false: do not display a header
         */
        header?: boolean | string | null;
        /**
         *
         */
        showSpinner?: boolean;
        /**
         * If true, render a checkbox before the node tile to allow selection with the
         * mouse.
         * Default: false.
         */
        checkbox?: boolean | "radio" | BoolOptionResolver;
        /**
         * Default: 200
         */
        updateThrottleWait?: number;
        /**
         * Default: true
         */
        enabled?: boolean;
        /**
         * Default: false
         */
        fixedCol?: boolean;
        /**
         * Default: true
         */
        quicksearch?: boolean;
        dnd?: DndOptionsType;
        edit?: any;
        filter?: any;
        grid?: any;
        /**
         *
         * @category Callback
         */
        activate?: (e: WbActivateEventType) => void;
        /**
         *
         * Return `false` to prevent default handling, e.g. activating the node.
         * @category Callback
         */
        beforeActivate?: (e: WbActivateEventType) => void;
        /**
         *
         * @category Callback
         */
        change?: (e: WbChangeEventType) => void;
        /**
         *
         * Return `false` to prevent default handling, e.g. activating the node.
         * @category Callback
         */
        click?: (e: WbClickEventType) => void;
        /**
         *
         * @category Callback
         */
        dblclick?: (e: WbClickEventType) => void;
        /**
         *
         * Return `false` to prevent default handling, e.g. deactivating the node
         * and activating the next.
         * @category Callback
         */
        deactivate?: (e: WbDeactivateEventType) => void;
        /**
         *
         * @category Callback
         */
        discard?: (e: WbNodeEventType) => void;
        /**
         *
         * @category Callback
         */
        enhanceTitle?: (e: WbEnhanceTitleEventType) => void;
        /**
         *
         * @category Callback
         */
        error?: (e: WbErrorEventType) => void;
        /**
         *
         * Check `e.flag` for status.
         * @category Callback
         */
        focus?: (e: WbTreeEventType) => void;
        /**
         * Fires when the tree markup was created and the initial source data was loaded.
         * Typical use cases would be activating a node, setting focus, enabling other
         * controls on the page, etc.<br>
         * Check `e.error` for status.
         * @category Callback
         */
        init?: (e: WbInitEventType) => void;
        /**
         *
         * @category Callback
         */
        keydown?: (e: WbKeydownEventType) => void;
        /**
         * Fires when a node that was marked 'lazy', is expanded for the first time.
         * Typically we return an endpoint URL or the Promise of a fetch request that
         * provides a (potentially nested) list of child nodes.
         * @category Callback
         */
        lazyLoad?: (e: WbNodeEventType) => void;
        /**
         * Fires when data was loaded (initial request, reload, or lazy loading),
         * after the data is applied and rendered.
         * @category Callback
         */
        load?: (e: WbNodeEventType) => void;
        /**
         * @category Callback
         */
        modifyChild?: (e: WbNodeEventType) => void;
        /**
         * Fires when data was fetched (initial request, reload, or lazy loading),
         * but before the data is applied and rendered.
         * Here we can modify and adjust the received data, for example to convert an
         * external response to native Wunderbaum syntax.
         * @category Callback
         */
        receive?: (e: WbReceiveEventType) => void;
        /**
         * Fires when a node is about to be displayed.
         * The default HTML markup is already created, but not yet added to the DOM.
         * Now we can tweak the markup, create HTML elements in this node's column
         * cells, etc.
         * See also `Custom Rendering` for details.
         * @category Callback
         */
        render?: (e: WbRenderEventType) => void;
        /**
         *
         * @category Callback
         */
        renderStatusNode?: (e: WbRenderEventType) => void;
        /**
         *
         * Check `e.flag` for status.
         * @category Callback
         */
        select?: (e: WbNodeEventType) => void;
        /**
         * Fires when the viewport content was updated, after scroling, expanding etc.
         * @category Callback
         */
        update?: (e: WbTreeEventType) => void;
    }
}
declare module "types" {
    /*!
     * Wunderbaum - types
     * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    import { WunderbaumNode } from "wb_node";
    import { Wunderbaum } from "wunderbaum";
    /** Passed to `find...()` methods. Should return true if node matches. */
    export type MatcherCallback = (node: WunderbaumNode) => boolean;
    /** Passed to `sortChildren()` methods. Should return -1, 0, or 1. */
    export type SortCallback = (a: WunderbaumNode, b: WunderbaumNode) => number;
    /** When set as option, called when the value is needed (e.g. `colspan` type definition). */
    export type BoolOptionResolver = (node: WunderbaumNode) => boolean;
    /** When set as option, called when the value is needed (e.g. `icon` type definition). */
    export type BoolOrStringOptionResolver = (node: WunderbaumNode) => boolean | string;
    /** A callback that receives a node instance and returns an arbitrary value type. */
    export type NodeAnyCallback = (node: WunderbaumNode) => any;
    /** A callback that receives a node instance and returns a string value. */
    export type NodeStringCallback = (node: WunderbaumNode) => string;
    /** A callback that receives a node instance and returns an iteration modifier. */
    export type NodeVisitCallback = (node: WunderbaumNode) => NodeVisitResponse;
    /** A callback that receives a node instance and returns a string value. */
    export type NodeVisitResponse = "skip" | boolean | void;
    /** A callback that receives a node-data dictionary and a node instance and returns an iteration modifier. */
    export type NodeToDictCallback = (dict: WbNodeData, node: WunderbaumNode) => NodeVisitResponse;
    /** A plain object (dictionary) that represents a node instance. */
    export interface WbNodeData {
        title: string;
        key?: string;
        refKey?: string;
        expanded?: boolean;
        selected?: boolean;
        checkbox?: boolean | string;
        colspan?: boolean;
        children?: Array<WbNodeData>;
        treeId?: string;
    }
    export interface WbTreeEventType {
        /** Name of the event. */
        type: string;
        /** The affected tree instance. */
        tree: Wunderbaum;
        /** Exposed utility module methods
         * (see [API docs](https://mar10.github.io/wunderbaum/api/modules/util.html)).
         */
        util: any;
        /** Originating HTML event if any (e.g. `click`). */
        event?: Event;
    }
    export interface WbNodeEventType extends WbTreeEventType {
        /** The affected target node. */
        node: WunderbaumNode;
        /**
         * Contains the node's type information, i.e. `tree.types[node.type]` if
         * defined. Set to `{}` otherwise. @see {@link Wunderbaum.types}
         */
        typeInfo: NodeTypeDefinition;
    }
    export interface WbActivateEventType extends WbNodeEventType {
        prevNode: WunderbaumNode;
        /** The original event. */
        event: Event;
    }
    export interface WbChangeEventType extends WbNodeEventType {
        info: WbEventInfo;
        inputElem: HTMLInputElement;
        inputValue: any;
    }
    export interface WbClickEventType extends WbTreeEventType {
        /** The original event. */
        event: MouseEvent;
        node: WunderbaumNode;
        info: WbEventInfo;
    }
    export interface WbErrorEventType extends WbNodeEventType {
        error: any;
    }
    export interface WbDeactivateEventType extends WbNodeEventType {
        nextNode: WunderbaumNode;
        /** The original event. */
        event: Event;
    }
    export interface WbEnhanceTitleEventType extends WbNodeEventType {
        titleSpan: HTMLSpanElement;
    }
    export interface WbFocusEventType extends WbTreeEventType {
        /** The original event. */
        event: FocusEvent;
        /** True if `focusin`, false if `focusout`. */
        flag: boolean;
    }
    export interface WbKeydownEventType extends WbTreeEventType {
        /** The original event. */
        event: KeyboardEvent;
        node: WunderbaumNode;
        info: WbEventInfo;
        /** Canical name of the key including modifiers. @see {@link util.eventToString} */
        eventName: string;
    }
    export interface WbInitEventType extends WbTreeEventType {
        error?: any;
    }
    export interface WbReceiveEventType extends WbNodeEventType {
        response: any;
    }
    export interface WbRenderEventType extends WbNodeEventType {
        /**
         * True if the node's markup was not yet created. In this case the render
         * event should create embeddeb input controls (in addition to update the
         * values according to to current node data).
         */
        isNew: boolean;
        /** The node's `<span class='wb-node'>` element. */
        nodeElem: HTMLSpanElement;
        /** True if the node only displays the title and is stretched over all remaining columns. */
        isColspan: boolean;
        /**
         * Array of node's `<span class='wb-col'>` elements.
         * The first element is `<span class='wb-node wb-col'>`, which contains the
         * node title and icon (`idx: 0`, id: '*'`).
         */
        allColInfosById: ColumnEventInfoMap;
        /**
         * Array of node's `<span class='wb-node'>` elements, *that should be rendered*.
         * In contrast to `allColInfosById`, the node title is not part of this array.
         * If node.isColspan() is true, this array is empty (`[]`).
         */
        renderColInfosById: ColumnEventInfoMap;
    }
    /**
     * Contains the node's type information, i.e. `tree.types[node.type]` if
     * defined. @see {@link Wunderbaum.types}
     */
    export interface NodeTypeDefinition {
        /** En/disable checkbox for matching nodes. */
        checkbox?: boolean | BoolOrStringOptionResolver;
        /** Optional class names that are added to all `div.wb-row` elements of matching nodes. */
        classes?: string;
        /** Only show title and hide other columns if any. */
        colspan?: boolean | BoolOptionResolver;
        /** Default icon for matching nodes. */
        icon?: boolean | string | BoolOrStringOptionResolver;
        /**
         * See also {@link WunderbaumNode.getOption|WunderbaumNode.getOption()}
         * to evaluate `node.NAME` setting and `tree.types[node.type].NAME`.
         */
        [key: string]: unknown;
    }
    export type NodeTypeDefinitionMap = {
        [type: string]: NodeTypeDefinition;
    };
    /**
     * Column type definitions.
     * @see {@link Wunderbaum.columns}
     */
    export interface ColumnDefinition {
        /** Column ID as defined in `tree.columns` definition ("*" for title column). */
        id: string;
        /** Column header (defaults to id) */
        title: string;
        /** Column header tooltip (optional) */
        tooltip?: string;
        /** Column width or weight.
         * Either an absolute pixel value (e.g. `"50px"`) or a relative weight (e.g. `1`)
         * that is used to calculate the width  inside the remaining available space.
         * Default: `"*"`, which is interpreted as `1`.
         */
        width?: string | number;
        /** Only used for columns with a relative weight.
         * Default: `4px`.
         */
        minWidth?: string | number;
        /** Optional class names that are added to all `span.wb-col` header AND data
         * elements of that column.
         */
        classes?: string;
        /** If `headerClasses` is a string, it will be used for the header element,
         * while `classes` is used for data elements.
         */
        headerClasses?: string;
        /** Optional HTML content that is rendered into all `span.wb-col` elements of that column.*/
        html?: string;
        _weight?: number;
        _widthPx?: number;
        _ofsPx?: number;
    }
    export type ColumnDefinitionList = Array<ColumnDefinition>;
    /**
     * Column information (passed to the `render` event).
     */
    export interface ColumnEventInfo {
        /** Column ID as defined in `tree.columns` definition ("*" for title column). */
        id: string;
        /** Column index (0: leftmost title column). */
        idx: number;
        /** The cell's `<span class='wb-col'>` element (null for plain trees). */
        elem: HTMLSpanElement | null;
        /** The value of `tree.columns[]` for the current index. */
        info: ColumnDefinition;
    }
    export type ColumnEventInfoMap = {
        [colId: string]: ColumnEventInfo;
    };
    /**
     * Additional inforation derived from mouse or keyboard events.
     * @see {@link Wunderbaum.getEventInfo}
     */
    export interface WbEventInfo {
        /** The tree instance. */
        tree: Wunderbaum;
        /** The affected node instance instance if any. */
        node: WunderbaumNode | null;
        /** The affected part of the node span (e.g. title, expander, ...). */
        region: NodeRegion;
        /** The definition of the affected column if any. */
        colDef?: ColumnDefinition;
        /** The index of affected column or -1. */
        colIdx: number;
        /** The column definition ID of affected column if any. */
        colId?: string;
        /** The affected column's span tag if any. */
        colElem?: HTMLSpanElement;
    }
    export type FilterModeType = null | "dim" | "hide";
    export type ApplyCommandType = "addChild" | "addSibling" | "copy" | "cut" | "down" | "first" | "indent" | "last" | "left" | "moveDown" | "moveUp" | "outdent" | "pageDown" | "pageUp" | "parent" | "paste" | "remove" | "rename" | "right" | "up";
    export type NodeFilterResponse = "skip" | "branch" | boolean | void;
    export type NodeFilterCallback = (node: WunderbaumNode) => NodeFilterResponse;
    /**
     * Possible values for {@link WunderbaumNode.setModified()} and {@link Wunderbaum.setModified()}.
     */
    export enum ChangeType {
        /** Re-render the whole viewport, headers, and all rows. */
        any = "any",
        /** A node's title, icon, columns, or status have changed. Update the existing row markup. */
        data = "data",
        /** The `tree.columns` definition has changed beyond simple width adjustments. */
        colStructure = "colStructure",
        /** The viewport/window was resized. Adjust layout attributes for all elements. */
        resize = "resize",
        /** A node's definition has changed beyond status and data. Re-render the whole row's markup. */
        row = "row",
        /** Nodes have been added, removed, etc. Update markup. */
        structure = "structure",
        /** A node's status has changed. Update current row's classes, to reflect active, selected, ... */
        status = "status",
        /** Vertical scroll event. Update the 'top' property of all rows. */
        scroll = "scroll"
    }
    export enum RenderFlag {
        clearMarkup = "clearMarkup",
        header = "header",
        redraw = "redraw",
        scroll = "scroll"
    }
    /** Possible values for {@link WunderbaumNode.setStatus()}. */
    export enum NodeStatusType {
        ok = "ok",
        loading = "loading",
        error = "error",
        noData = "noData"
    }
    /** Define the subregion of a node, where an event occurred. */
    export enum NodeRegion {
        unknown = "",
        checkbox = "checkbox",
        column = "column",
        expander = "expander",
        icon = "icon",
        prefix = "prefix",
        title = "title"
    }
    /** Initial navigation mode and possible transition. */
    export enum NavModeEnum {
        startRow = "startRow",
        cell = "cell",
        startCell = "startCell",
        row = "row"
    }
    /** Possible values for {@link WunderbaumNode.addChildren()}. */
    export interface AddChildrenOptions {
        /** Insert children before this node (or index)
         * @default undefined or null:  append as last child
         */
        before?: WunderbaumNode | number | null;
        /**
         * Set `node.expanded = true` according to tree.options.minExpandLevel.
         * This does *not* load lazy nodes.
         * @default true
         */
        applyMinExpanLevel?: boolean;
        /** (@internal Internal use, do not set! ) */
        _level?: number;
    }
    /** Possible values for {@link Wunderbaum.applyCommand()} and {@link WunderbaumNode.applyCommand()}. */
    export interface ApplyCommandOptions {
        [key: string]: unknown;
    }
    /** Possible values for {@link Wunderbaum.expandAll()} and {@link WunderbaumNode.expandAll()}. */
    export interface ExpandAllOptions {
        /** Restrict expand level @default 99 */
        depth?: number;
        /** Expand and load lazy nodes @default false  */
        loadLazy?: boolean;
        /** Ignore `minExpandLevel` option @default false */
        force?: boolean;
    }
    /** Possible values for {@link Wunderbaum.filterNodes()} and {@link Wunderbaum.filterBranches()}. */
    export interface FilterNodesOptions {
        mode?: string;
        leavesOnly?: boolean;
        fuzzy?: boolean;
        highlight?: boolean;
        hideExpanders?: boolean;
        autoExpand?: boolean;
        noData?: boolean;
    }
    /** Possible values for {@link WunderbaumNode.makeVisible()}. */
    export interface MakeVisibleOptions {
        /** Do not animate expand (currently not implemented). @default false */
        noAnimation?: boolean;
        /** Scroll node into visible viewport area if required. @default true */
        scrollIntoView?: boolean;
        /** Do not send events. @default false */
        noEvents?: boolean;
    }
    /** Possible values for {@link WunderbaumNode.navigate()}. */
    export interface NavigateOptions {
        /** Activate the new node (otherwise focus only). @default true */
        activate?: boolean;
        /** Originating event (e.g. KeyboardEvent) if any. */
        event?: Event;
    }
    /** Possible values for {@link WunderbaumNode.render()}. */
    export interface RenderOptions {
        /** Which parts need update? @default ChangeType.data */
        change?: ChangeType;
        /** Where to append a new node. @default 'last' */
        after?: any;
        /** @internal. @default false */
        isNew?: boolean;
        /** @internal. @default false */
        preventScroll?: boolean;
        /** @internal. @default false */
        isDataChange?: boolean;
        /** @internal. @default false */
        top?: number;
        /** @internal. @default true */
        resizeCols?: boolean;
    }
    /** Possible values for {@link WunderbaumNode.scrollIntoView()} `options` argument. */
    export interface ScrollIntoViewOptions {
        /** Do not animate (currently not implemented). @default false */
        noAnimation?: boolean;
        /** Do not send events. @default false */
        noEvents?: boolean;
        /** Keep this node visible at the top in any case. */
        topNode?: WunderbaumNode;
        /** Add N pixel offset at top. */
        ofsY?: number;
    }
    /** Possible values for {@link Wunderbaum.scrollTo()} `options` argument. */
    export interface ScrollToOptions extends ScrollIntoViewOptions {
        /** Which node to scroll into the viewport.*/
        node: WunderbaumNode;
    }
    /** Possible values for {@link WunderbaumNode.setActive()} `options` argument. */
    export interface SetActiveOptions {
        /** Generate (de)activate event, even if node already has this status (default: false). */
        retrigger?: boolean;
        /** Do not generate (de)activate event  (default: false). */
        noEvents?: boolean;
        /** Set node as focused node (default: true). */
        focusNode?: boolean;
        /** Set node as focused node (default: false). */
        focusTree?: boolean;
        /** Optional original event that will be passed to the (de)activate handler. */
        event?: Event;
        /** Call {@link Wunderbaum.setColumn}. */
        colIdx?: number;
    }
    /** Possible values for {@link WunderbaumNode.setExpanded()} `options` argument. */
    export interface SetExpandedOptions {
        /** Ignore {@link WunderbaumOptions.minExpandLevel}. @default false */
        force?: boolean;
        /** Immediately update viewport (async otherwise). @default false */
        immediate?: boolean;
        /** Do not animate expand (currently not implemented). @default false */
        noAnimation?: boolean;
        /** Do not send events. @default false */
        noEvents?: boolean;
        /** Scroll up to bring expanded nodes into viewport. @default false */
        scrollIntoView?: boolean;
    }
    /** Possible values for {@link WunderbaumNode.setModified()} `options` argument. */
    export interface SetModifiedOptions {
        /** Force immediate redraw instead of throttled/async mode. @default false */
        immediate?: boolean;
    }
    /** Possible values for {@link WunderbaumNode.setSelected()} `options` argument. */
    export interface SetSelectedOptions {
        /** Ignore restrictions. @default false */
        force?: boolean;
        /** Do not send events. @default false */
        noEvents?: boolean;
    }
    /** Possible values for {@link WunderbaumNode.setStatus()} `options` argument. */
    export interface SetStatusOptions {
        /** Displayed as status node title. */
        message?: string;
        /** Used as tooltip. */
        details?: string;
    }
    /** Options passed to {@link Wunderbaum.visitRows()}. */
    export interface VisitRowsOptions {
        /** Skip filtered nodes and children of collapsed nodes. @default false */
        includeHidden?: boolean;
        /** Return the start node as first result. @default true */
        includeSelf?: boolean;
        /** Traverse in opposite direction, i.e. bottom up. @default false */
        reverse?: boolean;
        /** Start traversal at this node @default first (topmost) tree node */
        start?: WunderbaumNode | null;
        /** Wrap around at last node and continue at the top,
         * until the start node is reached again @default false */
        wrap?: boolean;
    }
    export type InsertNodeType = "before" | "after" | "prependChild" | "appendChild";
    export type DropRegionType = "over" | "before" | "after";
    export type DropRegionTypeSet = Set<DropRegionType>;
    export type DndOptionsType = {
        /**
         * Expand nodes after n milliseconds of hovering
         * @default 1500
         */
        autoExpandMS: 1500;
        /**
         * true: Drag multiple (i.e. selected) nodes. Also a callback() is allowed
         * @default false
         */
        multiSource: false;
        /**
         * Restrict the possible cursor shapes and modifier operations (can also be set in the dragStart event)
         * @default "all"
         */
        effectAllowed: "all";
        /**
         * Default dropEffect ('copy', 'link', or 'move') when no modifier is pressed (overide in dragDrag, dragOver).
         * @default "move"
         */
        dropEffectDefault: string;
        /**
         * Prevent dropping nodes from different Wunderbaum trees
         * @default false
         */
        preventForeignNodes: boolean;
        /**
         * Prevent dropping items on unloaded lazy Wunderbaum tree nodes
         * @default true
         */
        preventLazyParents: boolean;
        /**
         * Prevent dropping items other than Wunderbaum tree nodes
         * @default false
         */
        preventNonNodes: boolean;
        /**
         * Prevent dropping nodes on own descendants
         * @default true
         */
        preventRecursion: boolean;
        /**
         * Prevent dropping nodes under same direct parent
         * @default false
         */
        preventSameParent: false;
        /**
         * Prevent dropping nodes 'before self', etc. (move only)
         * @default true
         */
        preventVoidMoves: boolean;
        /**
         * Enable auto-scrolling while dragging
         * @default true
         */
        scroll: boolean;
        /**
         * Active top/bottom margin in pixel
         * @default 20
         */
        scrollSensitivity: 20;
        /**
         * Pixel per event
         * @default 5
         */
        scrollSpeed: 5;
        /**
         * Optional callback passed to `toDict` on dragStart @since 2.38
         * @default null
         */
        sourceCopyHook: null;
        /**
         * Callback(sourceNode, data), return true, to enable dnd drag
         * @default null
         */
        dragStart?: WbNodeEventType;
        /**
         * Callback(sourceNode, data)
         * @default null
         */
        dragDrag: null;
        /**
         * Callback(sourceNode, data)
         * @default null
         */
        dragEnd: null;
        /**
         * Callback(targetNode, data), return true, to enable dnd drop
         * @default null
         */
        dragEnter: null;
        /**
         * Callback(targetNode, data)
         * @default null
         */
        dragOver: null;
        /**
         * Callback(targetNode, data), return false to prevent autoExpand
         * @default null
         */
        dragExpand: null;
        /**
         * Callback(targetNode, data)
         * @default null
         */
        dragDrop: null;
        /**
         * Callback(targetNode, data)
         * @default null
         */
        dragLeave: null;
    };
}
declare module "wb_extension_base" {
    import { Wunderbaum } from "wunderbaum";
    export type ExtensionsDict = {
        [key: string]: WunderbaumExtension;
    };
    export abstract class WunderbaumExtension {
        enabled: boolean;
        readonly id: string;
        readonly tree: Wunderbaum;
        readonly treeOpts: any;
        readonly extensionOpts: any;
        constructor(tree: Wunderbaum, id: string, defaults: any);
        /** Called on tree (re)init after all extensions are added, but before loading.*/
        init(): void;
        getPluginOption(name: string, defaultValue?: any): any;
        setPluginOption(name: string, value: any): void;
        setEnabled(flag?: boolean): void;
        onKeyEvent(data: any): boolean | undefined;
        onRender(data: any): boolean | undefined;
    }
}
declare module "debounce" {
    /*!
     * debounce & throttle, taken from https://github.com/lodash/lodash v4.17.21
     * MIT License: https://raw.githubusercontent.com/lodash/lodash/4.17.21-npm/LICENSE
     * Modified for TypeScript type annotations.
     */
    type Procedure = (...args: any[]) => any;
    type DebounceOptions = {
        leading?: boolean;
        maxWait?: number;
        trailing?: boolean;
    };
    type ThrottleOptions = {
        leading?: boolean;
        trailing?: boolean;
    };
    export interface DebouncedFunction<F extends Procedure> {
        (this: ThisParameterType<F>, ...args: Parameters<F>): ReturnType<F>;
        cancel: () => void;
        flush: () => any;
        pending: () => boolean;
    }
    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked, or until the next browser frame is drawn. The debounced function
     * comes with a `cancel` method to cancel delayed `func` invocations and a
     * `flush` method to immediately invoke them. Provide `options` to indicate
     * whether `func` should be invoked on the leading and/or trailing edge of the
     * `wait` timeout. The `func` is invoked with the last arguments provided to the
     * debounced function. Subsequent calls to the debounced function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * If `wait` is omitted in an environment with `requestAnimationFrame`, `func`
     * invocation will be deferred until the next frame is drawn (typically about
     * 16ms).
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `debounce` and `throttle`.
     *
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0]
     *  The number of milliseconds to delay; if omitted, `requestAnimationFrame` is
     *  used (if available).
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', debounce(calculateLayout, 150))
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }))
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * const debounced = debounce(batchLog, 250, { 'maxWait': 1000 })
     * const source = new EventSource('/stream')
     * jQuery(source).on('message', debounced)
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel)
     *
     * // Check for pending invocations.
     * const status = debounced.pending() ? "Pending..." : "Ready"
     */
    export function debounce<F extends Procedure>(func: F, wait?: number, options?: DebounceOptions): DebouncedFunction<F>;
    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds (or once per browser frame). The throttled function
     * comes with a `cancel` method to cancel delayed `func` invocations and a
     * `flush` method to immediately invoke them. Provide `options` to indicate
     * whether `func` should be invoked on the leading and/or trailing edge of the
     * `wait` timeout. The `func` is invoked with the last arguments provided to the
     * throttled function. Subsequent calls to the throttled function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the throttled function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * If `wait` is omitted in an environment with `requestAnimationFrame`, `func`
     * invocation will be deferred until the next frame is drawn (typically about
     * 16ms).
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `throttle` and `debounce`.
     *
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0]
     *  The number of milliseconds to throttle invocations to; if omitted,
     *  `requestAnimationFrame` is used (if available).
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=true]
     *  Specify invoking on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // Avoid excessively updating the position while scrolling.
     * jQuery(window).on('scroll', throttle(updatePosition, 100))
     *
     * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
     * const throttled = throttle(renewToken, 300000, { 'trailing': false })
     * jQuery(element).on('click', throttled)
     *
     * // Cancel the trailing throttled invocation.
     * jQuery(window).on('popstate', throttled.cancel)
     */
    export function throttle<F extends Procedure>(func: F, wait?: number, options?: ThrottleOptions): DebouncedFunction<F>;
}
declare module "wb_ext_filter" {
    import { FilterNodesOptions, NodeFilterCallback } from "types";
    import { Wunderbaum } from "wunderbaum";
    import { WunderbaumExtension } from "wb_extension_base";
    export class FilterExtension extends WunderbaumExtension {
        queryInput?: HTMLInputElement;
        lastFilterArgs: IArguments | null;
        constructor(tree: Wunderbaum);
        init(): void;
        setPluginOption(name: string, value: any): void;
        _applyFilterNoUpdate(filter: string | NodeFilterCallback, branchMode: boolean, _opts: any): void;
        _applyFilterImpl(filter: string | NodeFilterCallback, branchMode: boolean, _opts: any): number;
        /**
         * [ext-filter] Dim or hide nodes.
         */
        filterNodes(filter: string | NodeFilterCallback, options: FilterNodesOptions): void;
        /**
         * [ext-filter] Dim or hide whole branches.
         */
        filterBranches(filter: string | NodeFilterCallback, options: FilterNodesOptions): void;
        /**
         * [ext-filter] Re-apply current filter.
         */
        updateFilter(): void;
        /**
         * [ext-filter] Reset the filter.
         */
        clearFilter(): void;
    }
}
declare module "wb_ext_keynav" {
    import { Wunderbaum } from "wunderbaum";
    import { WunderbaumExtension } from "wb_extension_base";
    export class KeynavExtension extends WunderbaumExtension {
        constructor(tree: Wunderbaum);
        protected _getEmbeddedInputElem(elem: any): HTMLInputElement | null;
        protected _isCurInputFocused(): boolean;
        onKeyEvent(data: any): boolean | undefined;
    }
}
declare module "wb_ext_logger" {
    import { WunderbaumExtension } from "wb_extension_base";
    import { Wunderbaum } from "wunderbaum";
    export class LoggerExtension extends WunderbaumExtension {
        readonly prefix: string;
        protected ignoreEvents: Set<string>;
        constructor(tree: Wunderbaum);
        init(): void;
        onKeyEvent(data: any): boolean | undefined;
    }
}
declare module "wb_ext_dnd" {
    import { Wunderbaum } from "wunderbaum";
    import { WunderbaumExtension } from "wb_extension_base";
    import { WunderbaumNode } from "wb_node";
    import { DropRegionType, DropRegionTypeSet } from "types";
    export class DndExtension extends WunderbaumExtension {
        protected srcNode: WunderbaumNode | null;
        protected lastTargetNode: WunderbaumNode | null;
        protected lastEnterStamp: number;
        protected lastAllowedDropRegions: DropRegionTypeSet | null;
        protected lastDropEffect: string | null;
        protected lastDropRegion: DropRegionType | false;
        constructor(tree: Wunderbaum);
        init(): void;
        /** Cleanup classes after target node is no longer hovered. */
        protected _leaveNode(): void;
        /** */
        protected unifyDragover(res: any): DropRegionTypeSet | false;
        /** */
        protected _calcDropRegion(e: DragEvent, allowed: DropRegionTypeSet | null): DropRegionType | false;
        protected autoScroll(event: DragEvent): number;
        protected onDragEvent(e: DragEvent): boolean;
        protected onDropEvent(e: DragEvent): boolean;
    }
}
declare module "drag_observer" {
    /*!
     * Wunderbaum - drag_observer
     * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    export type DragCallbackArgType = {
        /** "dragstart", "drag", or "dragstop". */
        type: string;
        /** Original mouse or touch event that triggered the drag event. */
        event: MouseEvent | TouchEvent;
        /** Element which is currently dragged. */
        dragElem: HTMLElement | null;
        /** Relative horizontal drag distance since start. */
        dx: number;
        /** Relative vertical drag distance since start. */
        dy: number;
        /** False if drag was canceled. */
        apply?: boolean;
    };
    export type DragCallbackType = (e: DragCallbackArgType) => boolean | void;
    type DragObserverOptionsType = {
        /**Event target (typically `window.document`). */
        root: EventTarget;
        /**Event delegation selector.*/
        selector?: string;
        /**Minimum drag distance in px. */
        thresh?: number;
        /**Return `false` to cancel drag. */
        dragstart: DragCallbackType;
        drag?: DragCallbackType;
        dragstop?: DragCallbackType;
    };
    /**
     * Convert mouse- and touch events to 'dragstart', 'drag', and 'dragstop'.
     */
    export class DragObserver {
        protected _handler: any;
        protected root: EventTarget;
        protected start: {
            x: number;
            y: number;
            altKey: boolean;
            ctrlKey: boolean;
            metaKey: boolean;
            shiftKey: boolean;
        };
        protected dragElem: HTMLElement | null;
        protected dragging: boolean;
        protected events: string[];
        protected opts: DragObserverOptionsType;
        constructor(opts: DragObserverOptionsType);
        /** Unregister all event listeners. */
        disconnect(): void;
        getDragElem(): HTMLElement | null;
        isDragging(): boolean;
        stopDrag(cb_event?: DragCallbackArgType): void;
        protected handleEvent(e: MouseEvent): boolean | void;
    }
}
declare module "wb_ext_grid" {
    /*!
     * Wunderbaum - ext-grid
     * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    import { Wunderbaum } from "wunderbaum";
    import { WunderbaumExtension } from "wb_extension_base";
    import { DragCallbackArgType, DragObserver } from "drag_observer";
    export class GridExtension extends WunderbaumExtension {
        protected observer: DragObserver;
        constructor(tree: Wunderbaum);
        init(): void;
        protected handleDrag(e: DragCallbackArgType): void;
    }
}
declare module "wb_ext_edit" {
    /*!
     * Wunderbaum - ext-edit
     * Copyright (c) 2021-2023, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    import { Wunderbaum } from "wunderbaum";
    import { WunderbaumExtension } from "wb_extension_base";
    import { WunderbaumNode } from "wb_node";
    import { InsertNodeType, WbNodeData } from "types";
    export class EditExtension extends WunderbaumExtension {
        protected debouncedOnChange: (e: Event) => void;
        protected curEditNode: WunderbaumNode | null;
        protected relatedNode: WunderbaumNode | null;
        constructor(tree: Wunderbaum);
        protected _applyChange(eventName: string, node: WunderbaumNode, colElem: HTMLElement, extra: any): Promise<any>;
        protected _onChange(e: Event): void;
        init(): void;
        _preprocessKeyEvent(data: any): boolean | undefined;
        /** Return true if a title is currently being edited. */
        isEditingTitle(node?: WunderbaumNode): boolean;
        /** Start renaming, i.e. replace the title with an embedded `<input>`. */
        startEditTitle(node?: WunderbaumNode | null): void;
        /**
         *
         * @param apply
         * @returns
         */
        stopEditTitle(apply: boolean): void;
        _stopEditTitle(apply: boolean, options: any): void;
        /**
         * Create a new child or sibling node and start edit mode.
         */
        createNode(mode?: InsertNodeType, node?: WunderbaumNode | null, init?: string | WbNodeData): void;
    }
}
declare module "wunderbaum" {
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
    import "./wunderbaum.scss";
    import * as util from "util";
    import { ExtensionsDict, WunderbaumExtension } from "wb_extension_base";
    import { ApplyCommandType, ChangeType, ColumnDefinitionList, ExpandAllOptions, FilterModeType, MatcherCallback, NavModeEnum, NodeStatusType, NodeStringCallback, NodeTypeDefinitionMap, ScrollToOptions, SetActiveOptions, SetModifiedOptions, SetStatusOptions, WbEventInfo, ApplyCommandOptions, AddChildrenOptions, VisitRowsOptions, NodeFilterCallback, FilterNodesOptions, RenderFlag, NodeVisitCallback, SortCallback, NodeToDictCallback, WbNodeData } from "types";
    import { WunderbaumNode } from "wb_node";
    import { WunderbaumOptions } from "wb_options";
    /**
     * A persistent plain object or array.
     *
     * See also [[WunderbaumOptions]].
     */
    export class Wunderbaum {
        protected static sequence: number;
        protected enabled: boolean;
        /** Wunderbaum release version number "MAJOR.MINOR.PATCH". */
        static version: string;
        /** The invisible root node, that holds all visible top level nodes. */
        readonly root: WunderbaumNode;
        /** Unique tree ID as passed to constructor. Defaults to `"wb_SEQUENCE"`. */
        readonly id: string;
        /** The `div` container element that was passed to the constructor. */
        readonly element: HTMLDivElement;
        /** The `div.wb-header` element if any. */
        readonly headerElement: HTMLDivElement;
        /** The `div.wb-list-container` element that contains the `nodeListElement`. */
        readonly listContainerElement: HTMLDivElement;
        /** The `div.wb-node-list` element that contains all visible div.wb-row child elements. */
        readonly nodeListElement: HTMLDivElement;
        /** Contains additional data that was sent as response to an Ajax source load request. */
        readonly data: {
            [key: string]: any;
        };
        protected readonly _updateViewportThrottled: (...args: any) => void;
        protected extensionList: WunderbaumExtension[];
        protected extensions: ExtensionsDict;
        /** Merged options from constructor args and tree- and extension defaults. */
        options: WunderbaumOptions;
        protected keyMap: Map<string, WunderbaumNode>;
        protected refKeyMap: Map<string, Set<WunderbaumNode>>;
        protected treeRowCount: number;
        protected _disableUpdateCount: number;
        protected _disableUpdateIgnoreCount: number;
        /** Currently active node if any. */
        activeNode: WunderbaumNode | null;
        /** Current node hat has keyboard focus if any. */
        focusNode: WunderbaumNode | null;
        /** Shared properties, referenced by `node.type`. */
        types: NodeTypeDefinitionMap;
        /** List of column definitions. */
        columns: ColumnDefinitionList;
        protected _columnsById: {
            [key: string]: any;
        };
        protected resizeObserver: ResizeObserver;
        protected pendingChangeTypes: Set<RenderFlag>;
        /** A Promise that is resolved when the tree was initialized (similar to `init(e)` event). */
        readonly ready: Promise<any>;
        /** Expose some useful methods of the util.ts module as `Wunderbaum.util`. */
        static util: typeof util;
        /** Expose some useful methods of the util.ts module as `tree._util`. */
        _util: typeof util;
        filterMode: FilterModeType;
        /** @internal Use `setColumn()`/`getActiveColElem()`*/
        activeColIdx: number;
        /** @internal */
        _cellNavMode: boolean;
        /** @internal */
        lastQuicksearchTime: number;
        /** @internal */
        lastQuicksearchTerm: string;
        protected lastClickTime: number;
        constructor(options: WunderbaumOptions);
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
        static getTree(el?: Element | Event | number | string | WunderbaumNode): Wunderbaum | null;
        /**
         * Return a WunderbaumNode instance from element or event.
         */
        static getNode(el: Element | Event): WunderbaumNode | null;
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
        [Symbol.iterator](): IterableIterator<WunderbaumNode>;
        /** @internal */
        protected _registerExtension(extension: WunderbaumExtension): void;
        /** Called on tree (re)init after markup is created, before loading. */
        protected _initExtensions(): void;
        /** Add node to tree's bookkeeping data structures. */
        _registerNode(node: WunderbaumNode): void;
        /** Remove node from tree's bookkeeping data structures. */
        _unregisterNode(node: WunderbaumNode): void;
        /** Call all hook methods of all registered extensions.*/
        protected _callHook(hook: keyof WunderbaumExtension, data?: any): any;
        /**
         * Call tree method or extension method if defined.
         *
         * Example:
         * ```js
         * tree._callMethod("edit.startEdit", "arg1", "arg2")
         * ```
         */
        _callMethod(name: string, ...args: any[]): any;
        /**
         * Call event handler if defined in tree or tree.EXTENSION options.
         *
         * Example:
         * ```js
         * tree._callEvent("edit.beforeEdit", {foo: 42})
         * ```
         */
        _callEvent(type: string, extra?: any): any;
        /** Return the node for  given row index. */
        protected _getNodeByRowIdx(idx: number): WunderbaumNode | null;
        /** Return the topmost visible node in the viewport. */
        getTopmostVpNode(complete?: boolean): WunderbaumNode;
        /** Return the lowest visible node in the viewport. */
        getLowestVpNode(complete?: boolean): WunderbaumNode;
        /** Return preceeding visible node in the viewport. */
        protected _getPrevNodeInView(node?: WunderbaumNode, ofs?: number): WunderbaumNode;
        /** Return following visible node in the viewport. */
        protected _getNextNodeInView(node?: WunderbaumNode, ofs?: number): WunderbaumNode;
        /**
         * Append (or insert) a list of toplevel nodes.
         *
         * @see {@link WunderbaumNode.addChildren}
         */
        addChildren(nodeData: any, options?: AddChildrenOptions): WunderbaumNode;
        /**
         * Apply a modification (or navigation) operation on the **tree or active node**.
         */
        applyCommand(cmd: ApplyCommandType, options?: ApplyCommandOptions): any;
        /**
         * Apply a modification (or navigation) operation on a **node**.
         * @see {@link WunderbaumNode.applyCommand}
         */
        applyCommand(cmd: ApplyCommandType, node: WunderbaumNode, options?: ApplyCommandOptions): any;
        /** Delete all nodes. */
        clear(): void;
        /**
         * Clear nodes and markup and detach events and observers.
         *
         * This method may be useful to free up resources before re-creating a tree
         * on an existing div, for example in unittest suites.
         * Note that this Wunderbaum instance becomes unusable afterwards.
         */
        destroy(): void;
        /**
         * Return `tree.option.NAME` (also resolving if this is a callback).
         *
         * See also {@link WunderbaumNode.getOption|WunderbaumNode.getOption()}
         * to evaluate `node.NAME` setting and `tree.types[node.type].NAME`.
         *
         * @param name option name (use dot notation to access extension option, e.g.
         * `filter.mode`)
         */
        getOption(name: string, defaultValue?: any): any;
        /**
         * Set tree option.
         * Use dot notation to set plugin option, e.g. "filter.mode".
         */
        setOption(name: string, value: any): void;
        /** Return true if the tree (or one of its nodes) has the input focus. */
        hasFocus(): boolean;
        /**
         * Return true if the tree displays a header. Grids have a header unless the
         * `header` option is set to `false`. Plain trees have a header if the `header`
         * option is a string or `true`.
         */
        hasHeader(): boolean;
        /** Run code, but defer rendering of viewport until done. */
        runWithoutUpdate(func: () => any, hint?: any): void;
        /** Recursively expand all expandable nodes (triggers lazy load id needed). */
        expandAll(flag?: boolean, options?: ExpandAllOptions): Promise<void>;
        /** Recursively select all nodes. */
        selectAll(flag?: boolean): void;
        /** Return the number of nodes in the data model.*/
        count(visible?: boolean): number;
        /** @internal sanity check. */
        _check(): void;
        /**
         * Find all nodes that match condition.
         *
         * @see {@link WunderbaumNode.findAll}
         */
        findAll(match: string | RegExp | MatcherCallback): WunderbaumNode[];
        /**
         * Find first node that matches condition.
         *
         * @see {@link WunderbaumNode.findFirst}
         */
        findFirst(match: string | RegExp | MatcherCallback): WunderbaumNode;
        /**
         * Find first node that matches condition.
         *
         * @param match title string to search for, or a
         *     callback function that returns `true` if a node is matched.
         * @see {@link WunderbaumNode.findFirst}
         *
         */
        findKey(key: string): WunderbaumNode | null;
        /**
         * Find the next visible node that starts with `match`, starting at `startNode`
         * and wrap-around at the end.
         */
        findNextNode(match: string | MatcherCallback, startNode?: WunderbaumNode | null): WunderbaumNode | null;
        /**
         * Find a node relative to another node.
         *
         * @param node
         * @param where 'down', 'first', 'last', 'left', 'parent', 'right', or 'up'.
         *   (Alternatively the keyCode that would normally trigger this move,
         *   e.g. `$.ui.keyCode.LEFT` = 'left'.
         * @param includeHidden Not yet implemented
         */
        findRelatedNode(node: WunderbaumNode, where: string, includeHidden?: boolean): any;
        /**
         * Iterator version of {@link Wunderbaum.format}.
         */
        format_iter(name_cb?: NodeStringCallback, connectors?: string[]): IterableIterator<string>;
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
        format(name_cb?: NodeStringCallback, connectors?: string[]): string;
        /**
         * Return the active cell (`span.wb-col`) of the currently active node or null.
         */
        getActiveColElem(): HTMLSpanElement;
        /**
         * Return the currently active node or null.
         */
        getActiveNode(): WunderbaumNode;
        /**
         * Return the first top level node if any (not the invisible root node).
         */
        getFirstChild(): WunderbaumNode;
        /**
         * Return the currently active node or null.
         */
        getFocusNode(): WunderbaumNode;
        /** Return a {node: WunderbaumNode, region: TYPE} object for a mouse event.
         *
         * @param {Event} event Mouse event, e.g. click, ...
         * @returns {object} Return a {node: WunderbaumNode, region: TYPE} object
         *     TYPE: 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon' | undefined
         */
        static getEventInfo(event: Event): WbEventInfo;
        /**
         * Return readable string representation for this instance.
         * @internal
         */
        toString(): string;
        /** Return true if any node is currently in edit-title mode. */
        isEditing(): boolean;
        /**
         * Return true if any node is currently beeing loaded, i.e. a Ajax request is pending.
         */
        isLoading(): boolean;
        /** Alias for {@link Wunderbaum.logDebug}.
         * @alias Wunderbaum.logDebug
         */
        log: (...args: any[]) => void;
        /** Log to console if opts.debugLevel >= 4 */
        logDebug(...args: any[]): void;
        /** Log error to console. */
        logError(...args: any[]): void;
        /** Log to console if opts.debugLevel >= 3 */
        logInfo(...args: any[]): void;
        /** @internal */
        logTime(label: string): string;
        /** @internal */
        logTimeEnd(label: string): void;
        /** Log to console if opts.debugLevel >= 2 */
        logWarn(...args: any[]): void;
        /**
         * Make sure that this node is vertically scrolled into the viewport.
         *
         * Nodes that are above the visible area become the top row, nodes that are
         * below the viewport become the bottom row.
         */
        scrollTo(nodeOrOpts: ScrollToOptions | WunderbaumNode): void;
        /**
         * Make sure that this node is horizontally scrolled into the viewport.
         * Called by {@link setColumn}.
         */
        protected scrollToHorz(): void;
        /**
         * Set column #colIdx to 'active'.
         *
         * This higlights the column header and -cells by adding the `wb-active` class.
         * Available in cell-nav mode only.
         */
        setColumn(colIdx: number): void;
        /** Set or remove keybaord focus to the tree container. */
        setActiveNode(key: string, flag?: boolean, options?: SetActiveOptions): void;
        /** Set or remove keybaord focus to the tree container. */
        setFocus(flag?: boolean): void;
        /**
         * Schedule an update request to reflect a tree change.
         * The render operation is async and debounced unless the `immediate` option
         * is set.
         * Use {@link WunderbaumNode.setModified()} if only a single node has changed,
         * or {@link WunderbaumNode.render()}) to pass special options.
         */
        setModified(change: ChangeType, options?: SetModifiedOptions): void;
        /**
         * Update a row to reflect a single node's modification.
         *
         * @see {@link WunderbaumNode.setModified()}, {@link WunderbaumNode.render()}
         */
        setModified(change: ChangeType, node: WunderbaumNode, options?: SetModifiedOptions): void;
        /** Disable mouse and keyboard interaction (return prev. state). */
        setEnabled(flag?: boolean): boolean;
        /** Return false if tree is disabled. */
        isEnabled(): boolean;
        /** Return true if tree has more than one column, i.e. has additional data columns. */
        isGrid(): boolean;
        /** Return true if cell-navigation mode is acive. */
        isCellNav(): boolean;
        /** Return true if row-navigation mode is acive. */
        isRowNav(): boolean;
        /** Set the tree's navigation mode. */
        setCellNav(flag?: boolean): void;
        /** Set the tree's navigation mode option. */
        setNavigationOption(mode: NavModeEnum, reset?: boolean): void;
        /** Display tree status (ok, loading, error, noData) using styles and a dummy root node. */
        setStatus(status: NodeStatusType, options?: SetStatusOptions): WunderbaumNode | null;
        /** Add or redefine node type definitions. */
        setTypes(types: any, replace?: boolean): void;
        /**
         * Sort nodes list by title or custom criteria.
         * @param {function} cmp custom compare function(a, b) that returns -1, 0, or 1
         *    (defaults to sorting by title).
         * @param {boolean} deep pass true to sort all descendant nodes recursively
         */
        sortChildren(cmp?: SortCallback | null, deep?: boolean): void;
        /** Convert tree to an array of plain objects.
         *
         * @param callback(dict, node) is called for every node, in order to allow
         *     modifications.
         *     Return `false` to ignore this node or `"skip"` to include this node
         *     without its children.
         * @see {@link WunderbaumNode.toDict}.
         */
        toDictArray(callback?: NodeToDictCallback): Array<WbNodeData>;
        /**
         * Update column headers and column width.
         * Return true if at least one column width changed.
         */
        _updateColumnWidths(): boolean;
        /** Create/update header markup from `this.columns` definition.
         * @internal
         */
        protected _renderHeaderMarkup(): void;
        /**
         * Render pending changes that were scheduled using {@link WunderbaumNode.setModified} if any.
         *
         * This is hardly ever neccessary, since we normally either
         * - call `setModified(ChangeType.TYPE)` (async, throttled), or
         * - call `setModified(ChangeType.TYPE, {immediate: true})` (synchronous)
         *
         * `updatePendingModifications()` will only force immediate execution of
         * pending async changes if any.
         */
        updatePendingModifications(): void;
        /**
         * This is the actual update method, which is wrapped inside a throttle method.
         * It calls `updateColumns()` and `_updateRows()`.
         *
         * This protected method should not be called directly but via
         * {@link WunderbaumNode.setModified}`, {@link Wunderbaum.setModified},
         * or {@link Wunderbaum.updatePendingModifications}.
         * @internal
         */
        protected _updateViewportImmediately(): void;
        protected _updateRows(options?: any): boolean;
        /**
         * Call `callback(node)` for all nodes in hierarchical order (depth-first, pre-order).
         * @see {@link IterableIterator<WunderbaumNode>}, {@link WunderbaumNode.visit}.
         *
         * @param {function} callback the callback function.
         *     Return false to stop iteration, return "skip" to skip this node and
         *     children only.
         * @returns {boolean} false, if the iterator was stopped.
         */
        visit(callback: (node: WunderbaumNode) => any): import("types").NodeVisitResponse;
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
        visitRows(callback: NodeVisitCallback, options?: VisitRowsOptions): boolean;
        /**
         * Call fn(node) for all nodes in vertical order, bottom up.
         * @internal
         */
        protected _visitRowsUp(callback: NodeVisitCallback, options: VisitRowsOptions): boolean;
        /**
         * Reload the tree with a new source.
         *
         * Previous data is cleared. Note that also column- and type defintions may
         * be passed with the `source` object.
         */
        load(source: any): Promise<void>;
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
        enableUpdate(flag: boolean): void;
        /**
         * [ext-filter] Dim or hide nodes.
         */
        filterNodes(filter: string | NodeFilterCallback, options: FilterNodesOptions): void;
        /**
         * [ext-filter] Dim or hide whole branches.
         */
        filterBranches(filter: string | NodeFilterCallback, options: FilterNodesOptions): void;
        /**
         * [ext-filter] Reset the filter.
         *
         * @requires [[FilterExtension]]
         */
        clearFilter(): void;
        /**
         * [ext-filter] Return true if a filter is currently applied.
         *
         * @requires [[FilterExtension]]
         */
        isFilterActive(): boolean;
        /**
         * [ext-filter] Re-apply current filter.
         *
         * @requires [[FilterExtension]]
         */
        updateFilter(): void;
    }
}
