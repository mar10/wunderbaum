/*!
 * wunderbaum.js - utils
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, @DATE (https://github.com/mar10/wunderbaum)
 */
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
 * @param eventNames
 * @param selector
 * @param handler
 * @param bind
 */
function onEvent(rootElem, eventNames, selector, handler) {
    if (typeof rootElem === "string") {
        rootElem = document.querySelector(rootElem);
    }
    eventNames.split(" ").forEach((evn) => {
        rootElem.addEventListener(evn, function (e) {
            if (e.target) {
                let elem = e.target;
                if (elem.matches(selector)) {
                    return handler(e);
                }
                elem = elem.closest(selector);
                if (elem) {
                    return handler(e);
                }
            }
        });
    });
}
function error(msg) {
    throw new Error(msg);
}
function assert(cond, msg) {
    if (!cond) {
        msg = msg || "Assertion failed.";
        throw new Error(msg);
    }
}
function extend(...args) {
    for (let i = 1; i < args.length; i++) {
        let arg = args[i];
        for (let key in arg) {
            if (Object.prototype.hasOwnProperty.call(arg, key)) {
                args[0][key] = arg[key];
            }
        }
    }
    return args[0];
}
function isArray(obj) {
    return Array.isArray(obj);
}
/** A dummy function that does nothing ('no operation'). */
function noop(...args) { }

/*!
 * wunderbaum.js - common
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, @DATE (https://github.com/mar10/wunderbaum)
 */
var ChangeType;
(function (ChangeType) {
    ChangeType["any"] = "any";
    ChangeType["structure"] = "structure";
    ChangeType["status"] = "status";
})(ChangeType || (ChangeType = {}));
var TargetType;
(function (TargetType) {
    TargetType["unknown"] = "";
    TargetType["title"] = "title";
    TargetType["icon"] = "icon";
    TargetType["expander"] = "expander";
    TargetType["checkbox"] = "checkbox";
    TargetType["prefix"] = "prefix";
})(TargetType || (TargetType = {}));
const default_debuglevel = 1; // Replaced by rollup script
const ROW_HEIGHT = 25;
const RENDER_PREFETCH = 5;

/*!
 * wunderbaum.js - wunderbaum_node
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, @DATE (https://github.com/mar10/wunderbaum)
 */
class WunderbaumNode {
    constructor(tree, parent, data) {
        this.refKey = undefined;
        this.children = null;
        this.lazy = false;
        this.expanded = false;
        this.selected = false;
        this.statusNodeType = "";
        this.subMatchCount = 0;
        this.match = false;
        this._rowIdx = 0;
        this._rowElem = undefined;
        assert(!parent || parent.tree === tree);
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
    addChild(node, before) {
        if (this.children == null) {
            this.children = [node];
        }
        else if (before) {
            assert(false);
        }
        else {
            this.children.push(node);
        }
    }
    getLevel() {
        let i = 0, p = this.parent;
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
            }
            else if (this.children.length === 0) {
                // Loaded, but response was empty
                return false;
            }
            else if (this.children.length === 1 &&
                this.children[0].isStatusNode()) {
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
    async load(source) {
        let tree = this.tree;
        let opts = tree.opts;
        if (opts.debugLevel >= 2 && console.time) {
            console.time(this + "._load");
        }
        try {
            const response = await fetch(source, { method: "GET" });
            if (!response.ok) {
                error("GET " +
                    opts.remote +
                    " returned " +
                    response.status +
                    ", " +
                    response);
            }
            opts.receive.call(tree, response);
            const data = await response.json();
            let prev = tree.enableUpdate(false);
            tree.addChildren(this, data);
            tree.enableUpdate(prev);
        }
        catch (error) {
            opts.error.call(tree, error);
        }
        if (opts.debugLevel >= 2 && console.time) {
            console.timeEnd(this + "._load");
        }
    }
    removeMarkup() {
        if (this._rowElem) {
            delete this._rowElem._wb_node;
            this._rowElem.remove();
            this._rowElem = undefined;
        }
    }
    render(opts) {
        let elem, nodeElem;
        let parentElem;
        let rowDiv = this._rowElem;
        let titleSpan;
        let checkboxSpan;
        let iconSpan;
        let expanderSpan;
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
            titleSpan = rowDiv.querySelector("span.wb-title");
            expanderSpan = rowDiv.querySelector("i.wb-expander");
            checkboxSpan = rowDiv.querySelector("i.wb-checkbox");
            iconSpan = rowDiv.querySelector("i.wb-icon");
        }
        else {
            parentElem = this.tree.nodeListElement;
            rowDiv = document.createElement("div");
            // rowDiv.classList.add("wb-row");
            // Attach a node reference to the DOM Element:
            rowDiv._wb_node = this;
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
        }
        rowDiv.className = rowClasses.join(" ");
        // rowDiv.style.top = (this._rowIdx! * 1.1) + "em";
        rowDiv.style.top = this._rowIdx * ROW_HEIGHT + "px";
        if (expanderSpan) {
            if (this.isExpandable()) {
                if (this.expanded) {
                    expanderSpan.className = "wb-expander " + iconMap.expanderExpanded;
                }
                else {
                    expanderSpan.className = "wb-expander " + iconMap.expanderCollapsed;
                }
            }
            else {
                expanderSpan.classList.add("wb-indent");
            }
        }
        if (checkboxSpan) {
            if (this.selected) {
                checkboxSpan.className = "wb-checkbox " + iconMap.checkChecked;
            }
            else {
                checkboxSpan.className = "wb-checkbox " + iconMap.checkUnchecked;
            }
        }
        if (iconSpan) {
            if (this.expanded) {
                iconSpan.className = "wb-icon " + iconMap.folderOpen;
            }
            else if (this.children) {
                iconSpan.className = "wb-icon " + iconMap.folder;
            }
            else {
                iconSpan.className = "wb-icon " + iconMap.doc;
            }
        }
        titleSpan.textContent = this.title;
        // Attach to DOM as late as possible
        if (!this._rowElem) {
            this._rowElem = rowDiv;
            parentElem.appendChild(rowDiv);
        }
    }
    setActive(flag = true) {
        let prev = this.tree.activeNode;
        this.tree.activeNode = this;
        prev === null || prev === void 0 ? void 0 : prev.setDirty(ChangeType.status);
        this.setDirty(ChangeType.status);
    }
    setDirty(type) {
        if (type === ChangeType.structure) {
            this.tree.updateViewport();
        }
        else if (this._rowElem) {
            // otherwise not in viewport, so no need to render
            this.render({});
        }
    }
    setExpanded(flag = true) {
        this.expanded = flag;
        this.setDirty(ChangeType.structure);
    }
    setSelected(flag = true) {
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
    visit(callback, includeSelf = false) {
        let i, l, res = true, children = this.children;
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
    visitParents(callback, includeSelf = false) {
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
    visitSiblings(callback, includeSelf = false) {
        let i, l, n, ac = this.parent.children;
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
WunderbaumNode.sequence = 0;

/*!
 * wunderbaum.ts
 *
 * A tree control.
 *
 * Copyright (c) 2021, Martin Wendt (https://wwWendt.de).
 * Released under the MIT license.
 *
 * @version v0.0.1-0
 * @date @DATE
 */
// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];
/**
 * A persistent plain object or array.
 *
 * See also [[WunderbaumOptions]].
 */
class Wunderbaum {
    // ready: Promise<any>;
    constructor(options) {
        this.keyMap = {};
        this.refKeyMap = {};
        this.viewNodes = new Set();
        this.rows = [];
        this.activeNode = null;
        this.enableFilter = false;
        this._enableUpdate = true;
        /** Shared properties, referenced by `node.type`. */
        this.types = {};
        /** List of column definitions. */
        this.columns = [];
        let opts = (this.opts = extend({
            source: null,
            element: null,
            debugLevel: default_debuglevel,
            // Events
            change: noop,
            error: noop,
            receive: noop,
        }, options));
        this.name = opts.name || "wb_" + ++Wunderbaum.sequence;
        this.root = new WunderbaumNode(this, null, {
            key: "__root__",
            name: "__root__",
        });
        // --- Create Markup
        if (typeof opts.element === "string") {
            this.element = document.querySelector(opts.element);
        }
        else {
            this.element = opts.element;
        }
        this.treeElement = (this.element.querySelector("div.wunderbaum"));
        this.scrollContainer = (this.treeElement.querySelector("div.wb-scroll-container"));
        this.nodeListElement = (this.scrollContainer.querySelector("div.wb-node-list"));
        if (!this.nodeListElement) {
            alert("TODO: create markup");
        }
        // Load initial data
        if (opts.source) {
            this.nodeListElement.innerHTML =
                "<progress class='spinner'>loading...</progress>";
            this.load(opts.source).finally(() => {
                var _a;
                (_a = this.element.querySelector(".spinner")) === null || _a === void 0 ? void 0 : _a.remove();
            });
        }
        // Bind listeners
        this.scrollContainer.addEventListener("scroll", (e) => {
            this.updateViewport();
        });
        onEvent(this.nodeListElement, "click", "span.wb-node", (e) => {
            let info = this.getEventTarget(e), node = info.node;
            if (node) {
                node.setActive();
                if (info.type === TargetType.expander) {
                    node.setExpanded(!node.isExpanded());
                }
                else if (info.type === TargetType.checkbox) {
                    node.setSelected(!node.isSelected());
                }
            }
            // if(e.target.classList.)
            this.log("click", info);
        });
        onEvent(this.treeElement, "mousemove", "div.wb-header span.wb-col", (e) => {
            // this.log("mouse", e.target);
        });
    }
    /** */
    static getTree() { }
    /** */
    static getNode(obj) {
        if (obj instanceof Event) {
            obj = obj.target;
        }
        if (obj instanceof Element) {
            let nodeElem = obj.closest("div.wb-row");
            return nodeElem._wb_node;
        }
        return null;
    }
    /** Return a {node: FancytreeNode, type: TYPE} object for a mouse event.
     *
     * @param {Event} event Mouse event, e.g. click, ...
     * @returns {object} Return a {node: FancytreeNode, type: TYPE} object
     *     TYPE: 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon' | undefined
     */
    getEventTarget(event) {
        let target = event.target, cl = target.classList, node = Wunderbaum.getNode(event.target), res = { node: node, type: TargetType.unknown };
        if (cl.contains("wb-title")) {
            res.type = TargetType.title;
        }
        else if (cl.contains("wb-expander")) {
            res.type =
                node.hasChildren() === false ? TargetType.prefix : TargetType.expander;
        }
        else if (cl.contains("wb-checkbox")) {
            res.type = TargetType.checkbox;
        }
        else if (cl.contains("wb-icon") || cl.contains("wb-custom-icon")) {
            res.type = TargetType.icon;
        }
        else if (cl.contains("wb-node")) {
            // Somewhere near the title
            res.type = TargetType.title;
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
    getEventTargetType(event) {
        return this.getEventTarget(event).type;
    }
    /** Log to console if opts.debugLevel >= 4 */
    debug(...args) {
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
    log(...args) {
        if (this.opts.debugLevel >= 1) {
            Array.prototype.unshift.call(args, this.toString());
            console.log.apply(console, args);
        }
    }
    /** @internal */
    logTime(label) {
        if (this.opts.debugLevel >= 1) {
            console.time(label);
        }
        return label;
    }
    /** @internal */
    logTimeEnd(label) {
        if (this.opts.debugLevel >= 1) {
            console.timeEnd(label);
        }
    }
    /** */
    render(opts) {
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
        assert(start != null && end != null);
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
            }
            else {
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
    visit(callback) {
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
    visitRows(callback, opts) {
        if (!this.root.hasChildren()) {
            return false;
        }
        if (opts && opts.reverse) {
            delete opts.reverse;
            return this._visitRowsUp(callback, opts);
        }
        opts = opts || {};
        let i, nextIdx, parent, res, siblings, siblingOfs = 0, skipFirstNode = opts.includeSelf === false, includeHidden = !!opts.includeHidden, checkFilter = !includeHidden && this.enableFilter, node = opts.start || this.root.children[0];
        parent = node.parent;
        while (parent) {
            // visit siblings
            siblings = parent.children;
            nextIdx = siblings.indexOf(node) + siblingOfs;
            assert(nextIdx >= 0, "Could not find " + node + " in parent's children: " + parent);
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
                if (node.children &&
                    node.children.length &&
                    (includeHidden || node.expanded)) {
                    res = node.visit(function (n) {
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
    _visitRowsUp(callback, opts) {
        let children, idx, parent, includeHidden = !!opts.includeHidden, node = opts.start || this.root.children[0];
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
            }
            else {
                // Otherwise, goto prev. sibling
                idx = children.indexOf(node);
                node = children[idx - 1];
                // If the prev. sibling has children, follow down to last descendant
                while ((includeHidden || node.expanded) &&
                    node.children &&
                    node.children.length) {
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
    load(source) {
        return this.root.load(source);
    }
    /** . */
    addChildren(parent, data) {
        assert(isArray(data));
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
    enableUpdate(flag) {
        flag = flag !== false;
        if (!!this._enableUpdate === !!flag) {
            return flag;
        }
        this._enableUpdate = flag;
        if (flag) {
            this.debug("enableUpdate(true): redraw "); //, this._dirtyRoots);
            // this._callHook("treeStructureChanged", this, "enableUpdate");
            this.updateViewport();
        }
        else {
            // 	this._dirtyRoots = null;
            this.debug("enableUpdate(false)...");
        }
        return !flag; // return previous value
    }
    setModified(node, change) { }
    setColumns(columns) { }
}
Wunderbaum.version = "v0.0.1-0"; // Set to semver by 'grunt release'
Wunderbaum.sequence = 0;

export { Wunderbaum };
