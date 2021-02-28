(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.mar10 = {}));
}(this, (function (exports) { 'use strict';

    /*!
     * persisto.js - utils
     * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
     * v0.0.1-0, Sun, 28 Feb 2021 13:30:59 GMT (https://github.com/mar10/wunderbaum)
     */
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
     * @date Sun, 28 Feb 2021 13:30:59 GMT
     */
    // import { PersistoOptions } from "./wb_options";
    const default_debuglevel = 1; // Replaced by rollup script
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
            this._rowIdx = 0;
            this._rowElem = undefined;
            assert(parent.tree === tree);
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
        visit(callback, includeSelf = false) {
        }
        setExpanded(flag = true) {
            this.expanded = flag;
        }
        render() {
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
     * See also [[PersistoOptions]].
     */
    class Wunderbaum {
        // ready: Promise<any>;
        constructor(options) {
            this.keyMap = {};
            this.refKeyMap = {};
            this.rows = [];
            this.activeNode = null;
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
            }, options);
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
        debug(...args) {
            if (this.opts.debugLevel >= 2) {
                Array.prototype.unshift.call(args, this.toString());
                console.log.apply(console, args);
            }
        }
        /* Log to console if opts.debugLevel >= 1 */
        log(...args) {
            if (this.opts.debugLevel >= 1) {
                Array.prototype.unshift.call(args, this.toString());
                console.log.apply(console, args);
            }
        }
        logTime(label) {
            if (this.opts.debugLevel >= 1) {
                console.time(label);
            }
            return label;
        }
        logTimeEnd(label) {
            if (this.opts.debugLevel >= 1) {
                console.timeEnd(label);
            }
        }
        /** */
        visit(callback, includeSelf = false) {
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
        load(source) {
            return this._load(this.root, source);
        }
        /** . */
        addChildren(parent, data) {
            assert(isArray(data));
            for (let i = 0; data.length; i++) {
                let d = data[i];
                d.children;
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
        enableUpdate(node, change) {
            return true;
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
                        opts.pull.call(self, response);
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
    Wunderbaum.version = "v0.0.1-0"; // Set to semver by 'grunt release'
    Wunderbaum.sequence = 0;

    exports.Wunderbaum = Wunderbaum;
    exports.WunderbaumNode = WunderbaumNode;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
