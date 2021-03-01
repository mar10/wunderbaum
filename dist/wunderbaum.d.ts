declare module "util" {
    /*!
     * persisto.js - utils
     * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
     * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
     */
    export const MAX_INT = 9007199254740991;
    /**
     * Deferred is a ES6 Promise, that exposes the resolve() method
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
    /**
     * Bind event handler using event delegation:
     *
     * E.g. handle all 'input' events for input and textarea elements of a given
     * form
     * ```ts
     * onEvent("#form_1", "input", "input,textarea", function (e: Event) {
     *   console.log(e.type, e.target);
     * });
     * ```
     *
     * @param element HTMLElement or selector
     * @param eventName
     * @param selector
     * @param handler
     * @param bind
     */
    export function onEvent(element: HTMLElement | string, eventName: string, selector: string, handler: (e: Event) => boolean | void, bind?: any): void;
    export function toggleClass(element: HTMLElement | string, classname: string, force?: boolean): void;
    /**
     * jQuery Shims
     * http://youmightnotneedjquery.com
     */
    export function each(obj: any, callback: any): any;
    export function error(msg: string): void;
    export function assert(cond: boolean, msg?: string): void;
    export function extend(...args: any[]): any;
    export function isEmptyObject(obj: any): boolean;
    export function isPlainObject(obj: any): boolean;
    export function isArray(obj: any): boolean;
    export function noop(): any;
    export function ready(fn: any): void;
    export function type(obj: any): any;
}
declare module "wunderbaum" {
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
    enum ChangeType {
        any = "any",
        children = "children",
        status = "status"
    }
    type WunderbaumOptions = any;
    export class WunderbaumNode {
        static sequence: number;
        /** Reference to owning tree. */
        tree: Wunderbaum;
        /** Parent node (null for the invisible root node `tree.root`). */
        parent: WunderbaumNode;
        title: string;
        readonly key: string;
        readonly refKey: string | undefined;
        children: WunderbaumNode[] | null;
        lazy: boolean;
        expanded: boolean;
        selected: boolean;
        statusNodeType: string;
        subMatchCount: number;
        match: boolean;
        _rowIdx: number | undefined;
        _rowElem: HTMLElement | undefined;
        constructor(tree: Wunderbaum, parent: WunderbaumNode, data: any);
        /**
         * Return readable string representation for this instance.
         * @internal
         */
        toString(): string;
        /** Return true if node has children. Return undefined if not sure, i.e. the node is lazy and not yet loaded. */
        hasChildren(): boolean;
        /** Return true if this node is a temporarily generated system node like
         * 'loading', 'paging', or 'error' (node.statusNodeType contains the type).
         */
        isStatusNode(): boolean;
        /** Call fn(node) for all child nodes in hierarchical order (depth-first).<br>
         * Stop iteration, if fn() returns false. Skip current branch, if fn() returns "skip".<br>
         * Return false if iteration was stopped.
         *
         * @param {function} callback the callback function.
         *     Return false to stop iteration, return "skip" to skip this node and
         *     its children only.
         */
        visit(callback: (node: WunderbaumNode) => any, includeSelf?: boolean): any;
        /** Call fn(node) for all parent nodes, bottom-up, including invisible system root.<br>
         * Stop iteration, if callback() returns false.<br>
         * Return false if iteration was stopped.
         *
         * @param {function} callback the callback function.
         *     Return false to stop iteration, return "skip" to skip this node and children only.
         */
        visitParents(callback: (node: WunderbaumNode) => boolean | undefined, includeSelf?: boolean): boolean;
        /** Call fn(node) for all sibling nodes.<br>
         * Stop iteration, if fn() returns false.<br>
         * Return false if iteration was stopped.
         *
         * @param {function} fn the callback function.
         *     Return false to stop iteration.
         */
        visitSiblings(callback: (node: WunderbaumNode) => boolean | undefined, includeSelf?: boolean): boolean;
        setExpanded(flag?: boolean): void;
        render(opts: any): void;
        addChild(node: WunderbaumNode, before?: WunderbaumNode): void;
    }
    /**
     * A persistent plain object or array.
     *
     * See also [[WunderbaumOptions]].
     */
    export class Wunderbaum {
        static version: string;
        static sequence: number;
        readonly root: WunderbaumNode;
        readonly name: string;
        readonly element: HTMLElement;
        readonly treeElement: HTMLElement;
        readonly nodeListElement: HTMLElement;
        protected keyMap: any;
        protected refKeyMap: any;
        protected rows: WunderbaumNode[];
        protected activeNode: WunderbaumNode | null;
        protected opts: any;
        enableFilter: boolean;
        _enableUpdate: boolean;
        constructor(options: WunderbaumOptions);
        /** Log to console if opts.debugLevel >= 4 */
        debug(...args: any[]): void;
        /**
         * Return readable string representation for this instance.
         * @internal
         */
        toString(): string;
        log(...args: any[]): void;
        /** @internal */
        logTime(label: string): string;
        /** @internal */
        logTimeEnd(label: string): void;
        /** */
        renumber(opts: any): boolean;
        /** Redraw DOM elements.
         */
        render(opts?: any): void;
        /** Call callback(node) for all nodes in hierarchical order (depth-first).
         *
         * @param {function} callback the callback function.
         *     Return false to stop iteration, return "skip" to skip this node and children only.
         * @returns {boolean} false, if the iterator was stopped.
         */
        visit(callback: (node: WunderbaumNode) => any): any;
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
        visitRows(callback: (node: WunderbaumNode) => any, opts?: any): boolean;
        /** Call fn(node) for all nodes in vertical order, bottom up.
         * @internal
         */
        protected _visitRowsUp(callback: (node: WunderbaumNode) => any, opts: any): boolean;
        /** . */
        load(source: any): Promise<WunderbaumNode>;
        /** . */
        addChildren(parent: WunderbaumNode, data: any): void;
        /**
         *
         */
        enableUpdate(flag: boolean): boolean;
        protected setModified(node: WunderbaumNode | null, change: ChangeType): void;
        /** Download  data from the cloud, then call `.update()`. */
        protected _load(parent: WunderbaumNode, source: any): Promise<WunderbaumNode>;
    }
}
