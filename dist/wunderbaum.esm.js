/*!
 * persisto.js - utils
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Mon, 01 Mar 2021 17:43:39 GMT (https://github.com/mar10/wunderbaum)
 */
function toggleClass(element, classname, force) {
    if (typeof element === "string") {
        element = document.querySelector(element);
    }
    switch (force) {
        case true:
            element.classList.add(classname);
            break;
        case false:
            element.classList.remove(classname);
            break;
        default:
            element.classList.toggle(classname);
    }
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
function noop() { }

/*!
 * wunderbaum.ts
 *
 * A tree control.
 *
 * Copyright (c) 2021, Martin Wendt (https://wwWendt.de).
 * Released under the MIT license.
 *
 * @version v0.0.1-0
 * @date Mon, 01 Mar 2021 17:43:39 GMT
 */
// import { PersistoOptions } from "./wb_options";
const default_debuglevel = 1; // Replaced by rollup script
// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];
var ChangeType;
(function (ChangeType) {
    ChangeType["any"] = "any";
    ChangeType["children"] = "children";
    ChangeType["status"] = "status";
})(ChangeType || (ChangeType = {}));
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
    setExpanded(flag = true) {
        this.expanded = flag;
    }
    render(opts) {
        let parentElem;
        let titleSpan;
        let rowDiv = this._rowElem;
        if (rowDiv) {
            toggleClass(rowDiv, "wb-expanded", !!this.expanded);
            toggleClass(rowDiv, "wb-lazy", !!this.lazy);
            toggleClass(rowDiv, "wb-selected", !!this.selected);
            titleSpan = rowDiv.querySelector("span.wb-title");
        }
        else {
            let elem, nodeElem;
            parentElem = this.tree.nodeListElement;
            // parentElem = this.parent ? this.parent!._rowElem! : this.tree.element;
            rowDiv = document.createElement("div");
            rowDiv.classList.add("wb-row");
            if (this.expanded) {
                rowDiv.classList.add("wb-expanded");
            }
            if (this.lazy) {
                rowDiv.classList.add("wb-lazy");
            }
            if (this.selected) {
                rowDiv.classList.add("wb-selected");
            }
            nodeElem = document.createElement("span");
            nodeElem.classList.add("wb-node", "wb-col");
            rowDiv.appendChild(nodeElem);
            elem = document.createElement("i");
            elem.classList.add("wb-checkbox");
            elem.classList.add("bi", "bi-check2-square");
            nodeElem.appendChild(elem);
            elem = document.createElement("i");
            elem.classList.add("wb-indent");
            nodeElem.appendChild(elem);
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
        rowDiv.style.top = (this._rowIdx * 16) + "px";
        titleSpan.textContent = this.title;
        // Attach to DOM as late as possible
        if (!this._rowElem) {
            this._rowElem = rowDiv;
            parentElem.appendChild(rowDiv);
        }
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
}
WunderbaumNode.sequence = 0;
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
        this.rows = [];
        this.activeNode = null;
        this.enableFilter = false;
        this._enableUpdate = true;
        this.root = new WunderbaumNode(this, null, {
            key: "__root__",
            name: "__root__",
        });
        let opts = this.opts = extend({
            source: null,
            element: null,
            debugLevel: default_debuglevel,
            // Events
            change: noop,
            error: noop,
            receive: noop,
        }, options);
        if (typeof opts.element === "string") {
            this.element = document.querySelector(opts.element);
        }
        else {
            this.element = opts.element;
        }
        this.treeElement = this.element.querySelector("div.wunderbaum");
        this.nodeListElement = this.element.querySelector("div.wb-tree");
        this.name = opts.name || "wb_" + ++Wunderbaum.sequence;
        if (opts.source) {
            this.load(opts.source);
        }
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
    renumber(opts) {
        let label = this.logTime("renumber");
        let idx = 0;
        let top = 0;
        let height = 16;
        let modified = false;
        let start = opts.startIdx || 30;
        let end = opts.endIdx || start + 100;
        this.root.children[1].expanded = true;
        this.visitRows(function (node) {
            let prevIdx = node._rowIdx;
            if (prevIdx !== idx) {
                node._rowIdx = idx;
                modified = true;
            }
            if (idx < start && idx > end) {
                if (node._rowElem) {
                    node._rowElem.remove();
                    node._rowElem = undefined;
                }
            }
            else if (prevIdx != idx) {
                node.render({ top: top });
            }
            idx++;
            top += height;
        });
        // Resize tree container
        this.nodeListElement.style.height = "" + top;
        this.logTimeEnd(label);
        return modified;
    }
    /** Redraw DOM elements.
     */
    render(opts) {
        this.renumber({
            start: 100,
            end: 100 + 20,
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
            assert(nextIdx >= 0, "Could not find " +
                node +
                " in parent's children: " +
                parent);
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
        var children, idx, parent, includeHidden = !!opts.includeHidden, node = opts.start || this.root.children[0];
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
        return this._load(this.root, source);
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
        this.setModified(parent, ChangeType.children);
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
            this.renumber({});
            // this.render();
        }
        else {
            // 	this._dirtyRoots = null;
            this.debug("enableUpdate(false)...");
        }
        return !flag; // return previous value
    }
    setModified(node, change) {
    }
    /** Download  data from the cloud, then call `.update()`. */
    _load(parent, source) {
        let opts = this.opts;
        if (opts.debugLevel >= 2 && console.time) {
            console.time(this + "._load");
        }
        let self = this;
        let promise = new Promise(function (resolve, reject) {
            fetch(opts.source, { method: "GET" })
                .then(function (response) {
                if (response.ok) {
                    opts.receive.call(self, response);
                }
                else {
                    error("GET " +
                        opts.remote +
                        " returned " +
                        response.status +
                        ", " +
                        response);
                }
                return response.json(); // pas as `data` to next then()
            })
                .then(function (data) {
                let prev = self.enableUpdate(false);
                self.addChildren.call(self, parent, data);
                self.enableUpdate(prev);
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
Wunderbaum.version = "v0.0.1-0"; // Set to semver by 'grunt release'
Wunderbaum.sequence = 0;

export { Wunderbaum, WunderbaumNode };
