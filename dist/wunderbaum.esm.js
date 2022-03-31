/*!
 * Wunderbaum - util
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
/** Readable names for `MouseEvent.button` */
const MOUSE_BUTTONS = {
    0: "",
    1: "left",
    2: "middle",
    3: "right",
    4: "back",
    5: "forward",
};
const MAX_INT = 9007199254740991;
const userInfo = _getUserInfo();
/**True if the user is using a macOS platform. */
const isMac = userInfo.isMac;
const REX_HTML = /[&<>"'/]/g; // Escape those characters
const REX_TOOLTIP = /[<>"'/]/g; // Don't escape `&` in tooltips
const ENTITY_MAP = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
};
/**
 * A ES6 Promise, that exposes the resolve()/reject() methods.
 */
class Deferred$1 {
    constructor() {
        this.thens = [];
        this.catches = [];
        this.status = "";
    }
    resolve(value) {
        if (this.status) {
            throw new Error("already settled");
        }
        this.status = "resolved";
        this.resolvedValue = value;
        this.thens.forEach((t) => t(value));
        this.thens = []; // Avoid memleaks.
    }
    reject(error) {
        if (this.status) {
            throw new Error("already settled");
        }
        this.status = "rejected";
        this.rejectedError = error;
        this.catches.forEach((c) => c(error));
        this.catches = []; // Avoid memleaks.
    }
    then(cb) {
        if (status === "resolved") {
            cb(this.resolvedValue);
        }
        else {
            this.thens.unshift(cb);
        }
    }
    catch(cb) {
        if (this.status === "rejected") {
            cb(this.rejectedError);
        }
        else {
            this.catches.unshift(cb);
        }
    }
    promise() {
        return {
            then: this.then,
            catch: this.catch,
        };
    }
}
/**Throw an `Error` if `cond` is falsey. */
function assert(cond, msg) {
    if (!cond) {
        msg = msg || "Assertion failed.";
        throw new Error(msg);
    }
}
function _getUserInfo() {
    const nav = navigator;
    // const ua = nav.userAgentData;
    const res = {
        isMac: /Mac/.test(nav.platform),
    };
    return res;
}
/** Run `callback` when document was loaded. */
function documentReady(callback) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback);
    }
    else {
        callback();
    }
}
/** Resolve when document was loaded. */
function documentReadyPromise() {
    return new Promise((resolve) => {
        documentReady(resolve);
    });
}
/**
 * Iterate over Object properties or array elements.
 *
 * @param obj `Object`, `Array` or null
 * @param callback(index, item) called for every item.
 *  `this` also contains the item.
 *  Return `false` to stop the iteration.
 */
function each(obj, callback) {
    if (obj == null) {
        // accept `null` or `undefined`
        return obj;
    }
    let length = obj.length, i = 0;
    if (typeof length === "number") {
        for (; i < length; i++) {
            if (callback.call(obj[i], i, obj[i]) === false) {
                break;
            }
        }
    }
    else {
        for (let k in obj) {
            if (callback.call(obj[i], k, obj[k]) === false) {
                break;
            }
        }
    }
    return obj;
}
/** Shortcut for `throw new Error(msg)`.*/
function error(msg) {
    throw new Error(msg);
}
/** Convert `<`, `>`, `&`, `"`, `'`, and `/` to the equivalent entities. */
function escapeHtml(s) {
    return ("" + s).replace(REX_HTML, function (s) {
        return ENTITY_MAP[s];
    });
}
// export function escapeRegExp(s: string) {
//   return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
// }
/**Convert a regular expression string by escaping special characters (e.g. `"$"` -> `"\$"`) */
function escapeRegex(s) {
    return ("" + s).replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
}
/** Convert `<`, `>`, `"`, `'`, and `/` (but not `&`) to the equivalent entities. */
function escapeTooltip(s) {
    return ("" + s).replace(REX_TOOLTIP, function (s) {
        return ENTITY_MAP[s];
    });
}
/** TODO */
function extractHtmlText(s) {
    if (s.indexOf(">") >= 0) {
        error("not implemented");
        // return $("<div/>").html(s).text();
    }
    return s;
}
/**
 * Read the value from an HTML input element.
 *
 * If a `<span class="wb-col">` is passed, the first child input is used.
 * Depending on the target element type, `value` is interpreted accordingly.
 * For example for a checkbox, a value of true, false, or null is returned if the
 * the element is checked, unchecked, or indeterminate.
 * For datetime input control a numerical value is assumed, etc.
 *
 * Common use case: store the new user input in the `change` event:
 *
 * ```ts
 *   change: (e) => {
 *     // Read the value from the input control that triggered the change event:
 *     let value = e.tree.getValueFromElem(e.element);
 *     //
 *     e.node.data[]
 *   },
 * ```
 * @param elem `<input>` or `<select>` element Also a parent `span.wb-col` is accepted.
 * @param coerce pass true to convert date/time inputs to `Date`.
 * @returns the value
 */
function getValueFromElem(elem, coerce = false) {
    const tag = elem.tagName;
    let value = null;
    if (tag === "SPAN" && elem.classList.contains("wb-col")) {
        const span = elem;
        const embeddedInput = span.querySelector("input,select");
        if (embeddedInput) {
            return getValueFromElem(embeddedInput, coerce);
        }
        span.innerText = "" + value;
    }
    else if (tag === "INPUT") {
        const input = elem;
        const type = input.type;
        switch (type) {
            case "button":
            case "reset":
            case "submit":
            case "image":
                break;
            case "checkbox":
                value = input.indeterminate ? null : input.checked;
                break;
            case "date":
            case "datetime":
            case "datetime-local":
            case "month":
            case "time":
            case "week":
                value = coerce ? input.valueAsDate : input.value;
                break;
            case "number":
            case "range":
                value = input.valueAsNumber;
                break;
            case "radio":
                const name = input.name;
                const checked = input.parentElement.querySelector(`input[name="${name}"]:checked`);
                value = checked ? checked.value : undefined;
                break;
            case "text":
            default:
                value = input.value;
        }
    }
    else if (tag === "SELECT") {
        const select = elem;
        value = select.value;
    }
    return value;
}
/**
 * Set the value of an HTML input element.
 *
 * If a `<span class="wb-col">` is passed, the first child input is used.
 * Depending on the target element type, `value` is interpreted accordingly.
 * For example a checkbox is set to checked, unchecked, or indeterminate if the
 * value is truethy, falsy, or `null`.
 * For datetime input control a numerical value is assumed, etc.
 *
 * @param elem `<input>` or `<select>` element Also a parent `span.wb-col` is accepted.
 * @param value a value that matches the target element.
 */
function setValueToElem(elem, value) {
    const tag = elem.tagName;
    if (tag === "SPAN" && elem.classList.contains("wb-col")) {
        const span = elem;
        const embeddedInput = span.querySelector("input,select");
        if (embeddedInput) {
            return setValueToElem(embeddedInput, value);
        }
        span.innerText = "" + value;
    }
    else if (tag === "INPUT") {
        const input = elem;
        const type = input.type;
        switch (type) {
            case "checkbox":
                input.indeterminate = value == null;
                input.checked = !!value;
                break;
            case "date":
            case "month":
            case "time":
            case "week":
            case "datetime":
            case "datetime-local":
                input.valueAsDate = value;
                break;
            case "number":
            case "range":
                input.valueAsNumber = value;
                break;
            case "radio":
                assert(false, "not implemented");
                // const name = input.name;
                // const checked = input.parentElement!.querySelector(
                //   `input[name="${name}"]:checked`
                // );
                // value = checked ? (<HTMLInputElement>checked).value : undefined;
                break;
            case "button":
            case "reset":
            case "submit":
            case "image":
                break;
            case "text":
            default:
                input.innerText = value;
        }
    }
    else if (tag === "SELECT") {
        const select = elem;
        select.value = value;
    }
    // return value;
}
/** Return an unconnected `HTMLElement` from a HTML string. */
function elemFromHtml(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
}
const _IGNORE_KEYS = new Set(["Alt", "Control", "Meta", "Shift"]);
/** Return a HtmlElement from selector or cast an existing element. */
function elemFromSelector(obj) {
    if (!obj) {
        return null; //(null as unknown) as HTMLElement;
    }
    if (typeof obj === "string") {
        return document.querySelector(obj);
    }
    return obj;
}
/**
 * Return a descriptive string for a keyboard or mouse event.
 *
 * The result also contains a prefix for modifiers if any, for example
 * `"x"`, `"F2"`, `"Control+Home"`, or `"Shift+clickright"`.
 */
function eventToString(event) {
    let key = event.key, et = event.type, s = [];
    if (event.altKey) {
        s.push("Alt");
    }
    if (event.ctrlKey) {
        s.push("Control");
    }
    if (event.metaKey) {
        s.push("Meta");
    }
    if (event.shiftKey) {
        s.push("Shift");
    }
    if (et === "click" || et === "dblclick") {
        s.push(MOUSE_BUTTONS[event.button] + et);
    }
    else if (et === "wheel") {
        s.push(et);
        // } else if (!IGNORE_KEYCODES[key]) {
        //   s.push(
        //     SPECIAL_KEYCODES[key] ||
        //     String.fromCharCode(key).toLowerCase()
        //   );
    }
    else if (!_IGNORE_KEYS.has(key)) {
        s.push(key);
    }
    return s.join("+");
}
function extend(...args) {
    for (let i = 1; i < args.length; i++) {
        let arg = args[i];
        if (arg == null) {
            continue;
        }
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
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}
function isFunction(obj) {
    return typeof obj === "function";
}
function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
}
/** A dummy function that does nothing ('no operation'). */
function noop(...args) { }
function onEvent(rootElem, eventNames, selectorOrHandler, handlerOrNone) {
    let selector, handler;
    rootElem = elemFromSelector(rootElem);
    if (handlerOrNone) {
        selector = selectorOrHandler;
        handler = handlerOrNone;
    }
    else {
        selector = "";
        handler = selectorOrHandler;
    }
    eventNames.split(" ").forEach((evn) => {
        rootElem.addEventListener(evn, function (e) {
            if (!selector) {
                return handler(e); // no event delegation
            }
            else if (e.target) {
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
/** Return a wrapped handler method, that provides `this._super`.
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
function overrideMethod(instance, methodName, handler, ctx) {
    let prevSuper, prevSuperApply, self = ctx || instance, prevFunc = instance[methodName], _super = (...args) => {
        return prevFunc.apply(self, args);
    }, _superApply = (argsArray) => {
        return prevFunc.apply(self, argsArray);
    };
    let wrapper = (...args) => {
        try {
            prevSuper = self._super;
            prevSuperApply = self._superApply;
            self._super = _super;
            self._superApply = _superApply;
            return handler.apply(self, args);
        }
        finally {
            self._super = prevSuper;
            self._superApply = prevSuperApply;
        }
    };
    instance[methodName] = wrapper;
}
/** Run function after ms milliseconds and return a promise that resolves when done. */
function setTimeoutPromise(callback, ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(callback.apply(self));
            }
            catch (err) {
                reject(err);
            }
        }, ms);
    });
}
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
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Set or rotate checkbox status with support for tri-state.
 */
function toggleCheckbox(element, value, tristate) {
    const input = elemFromSelector(element);
    assert(input.type === "checkbox");
    tristate !== null && tristate !== void 0 ? tristate : (tristate = input.classList.contains("wb-tristate") || input.indeterminate);
    if (value === undefined) {
        const curValue = input.indeterminate ? null : input.checked;
        switch (curValue) {
            case true:
                value = false;
                break;
            case false:
                value = tristate ? null : true;
                break;
            case null:
                value = true;
                break;
        }
    }
    input.indeterminate = value == null;
    input.checked = !!value;
}
/**
 * Return `opts.NAME` if opts is valid and
 *
 * @param opts dict, object, or null
 * @param name option name (use dot notation to access extension option, e.g. `filter.mode`)
 * @param defaultValue returned when `opts` is not an object, or does not have a NAME property
 */
function getOption(opts, name, defaultValue = undefined) {
    let ext;
    // Lookup `name` in options dict
    if (opts && name.indexOf(".") >= 0) {
        [ext, name] = name.split(".");
        opts = opts[ext];
    }
    let value = opts ? opts[name] : null;
    // Use value from value options dict, fallback do default
    return value !== null && value !== void 0 ? value : defaultValue;
}
/** Convert an Array or space-separated string to a Set. */
function toSet(val) {
    if (val instanceof Set) {
        return val;
    }
    if (typeof val === "string") {
        let set = new Set();
        for (const c of val.split(" ")) {
            set.add(c.trim());
        }
        return set;
    }
    if (Array.isArray(val)) {
        return new Set(val);
    }
    throw new Error("Cannot convert to Set<string>: " + val);
}
function type(obj) {
    return Object.prototype.toString
        .call(obj)
        .replace(/^\[object (.+)\]$/, "$1")
        .toLowerCase();
}

var util = /*#__PURE__*/Object.freeze({
  __proto__: null,
  MOUSE_BUTTONS: MOUSE_BUTTONS,
  MAX_INT: MAX_INT,
  isMac: isMac,
  Deferred: Deferred$1,
  assert: assert,
  documentReady: documentReady,
  documentReadyPromise: documentReadyPromise,
  each: each,
  error: error,
  escapeHtml: escapeHtml,
  escapeRegex: escapeRegex,
  escapeTooltip: escapeTooltip,
  extractHtmlText: extractHtmlText,
  getValueFromElem: getValueFromElem,
  setValueToElem: setValueToElem,
  elemFromHtml: elemFromHtml,
  elemFromSelector: elemFromSelector,
  eventToString: eventToString,
  extend: extend,
  isArray: isArray,
  isEmptyObject: isEmptyObject,
  isFunction: isFunction,
  isPlainObject: isPlainObject,
  noop: noop,
  onEvent: onEvent,
  overrideMethod: overrideMethod,
  setTimeoutPromise: setTimeoutPromise,
  sleep: sleep,
  toggleCheckbox: toggleCheckbox,
  getOption: getOption,
  toSet: toSet,
  type: type
});

/*!
 * Wunderbaum - common
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
const DEFAULT_DEBUGLEVEL = 4; // Replaced by rollup script
const ROW_HEIGHT = 22;
const ICON_WIDTH = 20;
const ROW_EXTRA_PAD = 7; // 2x $col-padding-x + 3px rounding errors
const RENDER_MAX_PREFETCH = 5;
const TEST_IMG = new RegExp(/\.|\//); // strings are considered image urls if they contain '.' or '/'
var ChangeType;
(function (ChangeType) {
    ChangeType["any"] = "any";
    ChangeType["row"] = "row";
    ChangeType["structure"] = "structure";
    ChangeType["status"] = "status";
})(ChangeType || (ChangeType = {}));
var NodeStatusType;
(function (NodeStatusType) {
    NodeStatusType["ok"] = "ok";
    NodeStatusType["loading"] = "loading";
    NodeStatusType["error"] = "error";
    NodeStatusType["noData"] = "noData";
    // paging = "paging",
})(NodeStatusType || (NodeStatusType = {}));
/**Define the subregion of a node, where an event occurred. */
var TargetType;
(function (TargetType) {
    TargetType["unknown"] = "";
    TargetType["checkbox"] = "checkbox";
    TargetType["column"] = "column";
    TargetType["expander"] = "expander";
    TargetType["icon"] = "icon";
    TargetType["prefix"] = "prefix";
    TargetType["title"] = "title";
})(TargetType || (TargetType = {}));
let iconMap = {
    error: "bi bi-exclamation-triangle",
    // loading: "bi bi-hourglass-split",
    loading: "bi bi-arrow-repeat wb-spin",
    // loading: '<div class="spinner-border spinner-border-sm" role="status"> <span class="visually-hidden">Loading...</span> </div>',
    // noData: "bi bi-search",
    noData: "bi bi-question-circle",
    expanderExpanded: "bi bi-chevron-down",
    // expanderExpanded: "bi bi-dash-square",
    expanderCollapsed: "bi bi-chevron-right",
    // expanderCollapsed: "bi bi-plus-square",
    expanderLazy: "bi bi-chevron-right wb-helper-lazy-expander",
    // expanderLazy: "bi bi-chevron-bar-right",
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
var NavigationModeOption;
(function (NavigationModeOption) {
    NavigationModeOption["startRow"] = "startRow";
    NavigationModeOption["cell"] = "cell";
    NavigationModeOption["startCell"] = "startCell";
    NavigationModeOption["row"] = "row";
})(NavigationModeOption || (NavigationModeOption = {}));
var NavigationMode;
(function (NavigationMode) {
    NavigationMode["row"] = "row";
    NavigationMode["cellNav"] = "cellNav";
    NavigationMode["cellEdit"] = "cellEdit";
})(NavigationMode || (NavigationMode = {}));
/** Map `KeyEvent.key` to navigation action. */
const KEY_TO_ACTION_DICT = {
    " ": "toggleSelect",
    "+": "expand",
    Add: "expand",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    Backspace: "parent",
    "/": "collapseAll",
    Divide: "collapseAll",
    End: "lastCol",
    Home: "firstCol",
    "Control+End": "last",
    "Control+Home": "first",
    "*": "expandAll",
    Multiply: "expandAll",
    PageDown: "pageDown",
    PageUp: "pageUp",
    "-": "collapse",
    Subtract: "collapse",
};
/** */
function makeNodeTitleMatcher(s) {
    s = escapeRegex(s.toLowerCase());
    return function (node) {
        return node.title.toLowerCase().indexOf(s) >= 0;
    };
}
/** */
function makeNodeTitleStartMatcher(s) {
    s = escapeRegex(s);
    const reMatch = new RegExp("^" + s, "i");
    return function (node) {
        return reMatch.test(node.title);
    };
}

/*!
 * Wunderbaum - wb_extension_base
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
class WunderbaumExtension {
    constructor(tree, id, defaults) {
        this.enabled = true;
        this.tree = tree;
        this.id = id;
        this.treeOpts = tree.options;
        const opts = tree.options;
        if (this.treeOpts[id] === undefined) {
            opts[id] = this.extensionOpts = extend({}, defaults);
        }
        else {
            // TODO: do we break existing object instance references here?
            this.extensionOpts = extend({}, defaults, opts[id]);
            opts[id] = this.extensionOpts;
        }
        this.enabled = this.getPluginOption("enabled", true);
    }
    /** Called on tree (re)init after all extensions are added, but before loading.*/
    init() {
        this.tree.element.classList.add("wb-ext-" + this.id);
    }
    // protected callEvent(name: string, extra?: any): any {
    //   let func = this.extensionOpts[name];
    //   if (func) {
    //     return func.call(
    //       this.tree,
    //       util.extend(
    //         {
    //           event: this.id + "." + name,
    //         },
    //         extra
    //       )
    //     );
    //   }
    // }
    getPluginOption(name, defaultValue) {
        var _a;
        return (_a = this.extensionOpts[name]) !== null && _a !== void 0 ? _a : defaultValue;
    }
    setPluginOption(name, value) {
        this.extensionOpts[name] = value;
    }
    setEnabled(flag = true) {
        return this.setPluginOption("enabled", !!flag);
        // this.enabled = !!flag;
    }
    onKeyEvent(data) {
        return;
    }
    onRender(data) {
        return;
    }
}

/*!
 * debounce & throttle, taken from https://github.com/lodash/lodash v4.17.21
 * MIT License: https://raw.githubusercontent.com/lodash/lodash/4.17.21-npm/LICENSE
 * Modified for TypeScript type annotations.
 */
/* --- */
/** Detect free variable `global` from Node.js. */
const freeGlobal = typeof global === "object" &&
    global !== null &&
    global.Object === Object &&
    global;
/** Detect free variable `globalThis` */
const freeGlobalThis = typeof globalThis === "object" &&
    globalThis !== null &&
    globalThis.Object == Object &&
    globalThis;
/** Detect free variable `self`. */
const freeSelf = typeof self === "object" && self !== null && self.Object === Object && self;
/** Used as a reference to the global object. */
const root = freeGlobalThis || freeGlobal || freeSelf || Function("return this")();
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * isObject({})
 * // => true
 *
 * isObject([1, 2, 3])
 * // => true
 *
 * isObject(Function)
 * // => true
 *
 * isObject(null)
 * // => false
 */
function isObject(value) {
    const type = typeof value;
    return value != null && (type === "object" || type === "function");
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
function debounce(func, wait = 0, options = {}) {
    let lastArgs, lastThis, maxWait, result, timerId, lastCallTime;
    let lastInvokeTime = 0;
    let leading = false;
    let maxing = false;
    let trailing = true;
    // Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
    const useRAF = !wait && wait !== 0 && typeof root.requestAnimationFrame === "function";
    if (typeof func !== "function") {
        throw new TypeError("Expected a function");
    }
    wait = +wait || 0;
    if (isObject(options)) {
        leading = !!options.leading;
        maxing = "maxWait" in options;
        maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait;
        trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    function invokeFunc(time) {
        const args = lastArgs;
        const thisArg = lastThis;
        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    }
    function startTimer(pendingFunc, wait) {
        if (useRAF) {
            root.cancelAnimationFrame(timerId);
            return root.requestAnimationFrame(pendingFunc);
        }
        return setTimeout(pendingFunc, wait);
    }
    function cancelTimer(id) {
        if (useRAF) {
            return root.cancelAnimationFrame(id);
        }
        clearTimeout(id);
    }
    function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = startTimer(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
    }
    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;
        return maxing
            ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
            : timeWaiting;
    }
    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxing && timeSinceLastInvoke >= maxWait));
    }
    function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        // Restart the timer.
        timerId = startTimer(timerExpired, remainingWait(time));
    }
    function trailingEdge(time) {
        timerId = undefined;
        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
    }
    function cancel() {
        if (timerId !== undefined) {
            cancelTimer(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
    }
    function flush() {
        return timerId === undefined ? result : trailingEdge(Date.now());
    }
    function pending() {
        return timerId !== undefined;
    }
    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);
        lastArgs = args;
        lastThis = this;
        lastCallTime = time;
        if (isInvoking) {
            if (timerId === undefined) {
                return leadingEdge(lastCallTime);
            }
            if (maxing) {
                // Handle invocations in a tight loop.
                timerId = startTimer(timerExpired, wait);
                return invokeFunc(lastCallTime);
            }
        }
        if (timerId === undefined) {
            timerId = startTimer(timerExpired, wait);
        }
        return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;
    return debounced;
}
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
function throttle(func, wait = 0, options = {}) {
    let leading = true;
    let trailing = true;
    if (typeof func !== "function") {
        throw new TypeError("Expected a function");
    }
    if (isObject(options)) {
        leading = "leading" in options ? !!options.leading : leading;
        trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    return debounce(func, wait, {
        leading,
        trailing,
        maxWait: wait,
    });
}

/*!
 * Wunderbaum - ext-filter
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
const START_MARKER = "\uFFF7";
const END_MARKER = "\uFFF8";
const RE_START_MARKER = new RegExp(escapeRegex(START_MARKER), "g");
const RE_END_MARTKER = new RegExp(escapeRegex(END_MARKER), "g");
class FilterExtension extends WunderbaumExtension {
    constructor(tree) {
        super(tree, "filter", {
            autoApply: true,
            autoExpand: false,
            counter: true,
            fuzzy: false,
            hideExpandedCounter: true,
            hideExpanders: false,
            highlight: true,
            leavesOnly: false,
            mode: "hide",
            noData: true, // Display a 'no data' status node if result is empty
        });
        this.lastFilterArgs = null;
    }
    init() {
        super.init();
        let attachInput = this.getPluginOption("attachInput");
        if (attachInput) {
            this.queryInput = elemFromSelector(attachInput);
            onEvent(this.queryInput, "input", debounce((e) => {
                // this.tree.log("query", e);
                this.filterNodes(this.queryInput.value.trim(), {});
            }, 700));
        }
    }
    _applyFilterNoUpdate(filter, branchMode, _opts) {
        return this.tree.runWithoutUpdate(() => {
            return this._applyFilterImpl(filter, branchMode, _opts);
        });
    }
    _applyFilterImpl(filter, branchMode, _opts) {
        let match, temp, start = Date.now(), count = 0, tree = this.tree, treeOpts = tree.options, escapeTitles = treeOpts.escapeTitles, prevAutoCollapse = treeOpts.autoCollapse, opts = extend({}, treeOpts.filter, _opts), hideMode = opts.mode === "hide", leavesOnly = !!opts.leavesOnly && !branchMode;
        // Default to 'match title substring (case insensitive)'
        if (typeof filter === "string") {
            if (filter === "") {
                tree.logInfo("Passing an empty string as a filter is handled as clearFilter().");
                this.clearFilter();
                return;
            }
            if (opts.fuzzy) {
                // See https://codereview.stackexchange.com/questions/23899/faster-javascript-fuzzy-string-matching-function/23905#23905
                // and http://www.quora.com/How-is-the-fuzzy-search-algorithm-in-Sublime-Text-designed
                // and http://www.dustindiaz.com/autocomplete-fuzzy-matching
                match = filter
                    .split("")
                    // Escaping the `filter` will not work because,
                    // it gets further split into individual characters. So,
                    // escape each character after splitting
                    .map(escapeRegex)
                    .reduce(function (a, b) {
                    // create capture groups for parts that comes before
                    // the character
                    return a + "([^" + b + "]*)" + b;
                }, "");
            }
            else {
                match = escapeRegex(filter); // make sure a '.' is treated literally
            }
            let re = new RegExp(match, "i");
            let reHighlight = new RegExp(escapeRegex(filter), "gi");
            filter = (node) => {
                if (!node.title) {
                    return false;
                }
                let text = escapeTitles ? node.title : extractHtmlText(node.title);
                // `.match` instead of `.test` to get the capture groups
                let res = text.match(re);
                if (res && opts.highlight) {
                    if (escapeTitles) {
                        if (opts.fuzzy) {
                            temp = _markFuzzyMatchedChars(text, res, escapeTitles);
                        }
                        else {
                            // #740: we must not apply the marks to escaped entity names, e.g. `&quot;`
                            // Use some exotic characters to mark matches:
                            temp = text.replace(reHighlight, function (s) {
                                return START_MARKER + s + END_MARKER;
                            });
                        }
                        // now we can escape the title...
                        node.titleWithHighlight = escapeHtml(temp)
                            // ... and finally insert the desired `<mark>` tags
                            .replace(RE_START_MARKER, "<mark>")
                            .replace(RE_END_MARTKER, "</mark>");
                    }
                    else {
                        if (opts.fuzzy) {
                            node.titleWithHighlight = _markFuzzyMatchedChars(text, res);
                        }
                        else {
                            node.titleWithHighlight = text.replace(reHighlight, function (s) {
                                return "<mark>" + s + "</mark>";
                            });
                        }
                    }
                    // node.debug("filter", escapeTitles, text, node.titleWithHighlight);
                }
                return !!res;
            };
        }
        tree.filterMode = opts.mode;
        this.lastFilterArgs = arguments;
        tree.element.classList.toggle("wb-ext-filter-hide", !!hideMode);
        tree.element.classList.toggle("wb-ext-filter-dim", !hideMode);
        tree.element.classList.toggle("wb-ext-filter-hide-expanders", !!opts.hideExpanders);
        // Reset current filter
        tree.root.subMatchCount = 0;
        tree.visit((node) => {
            delete node.match;
            delete node.titleWithHighlight;
            node.subMatchCount = 0;
        });
        // statusNode = tree.root.findDirectChild(KEY_NODATA);
        // if (statusNode) {
        //   statusNode.remove();
        // }
        tree.setStatus(NodeStatusType.ok);
        // Adjust node.hide, .match, and .subMatchCount properties
        treeOpts.autoCollapse = false; // #528
        tree.visit((node) => {
            if (leavesOnly && node.children != null) {
                return;
            }
            let res = filter(node);
            if (res === "skip") {
                node.visit(function (c) {
                    c.match = false;
                }, true);
                return "skip";
            }
            let matchedByBranch = false;
            if ((branchMode || res === "branch") && node.parent.match) {
                res = true;
                matchedByBranch = true;
            }
            if (res) {
                count++;
                node.match = true;
                node.visitParents((p) => {
                    if (p !== node) {
                        p.subMatchCount += 1;
                    }
                    // Expand match (unless this is no real match, but only a node in a matched branch)
                    if (opts.autoExpand && !matchedByBranch && !p.expanded) {
                        p.setExpanded(true, {
                            noAnimation: true,
                            noEvents: true,
                            scrollIntoView: false,
                        });
                        p._filterAutoExpanded = true;
                    }
                }, true);
            }
        });
        treeOpts.autoCollapse = prevAutoCollapse;
        if (count === 0 && opts.noData && hideMode) {
            tree.root.setStatus(NodeStatusType.noData);
        }
        // Redraw whole tree
        tree.logInfo(`Filter '${match}' found ${count} nodes in ${Date.now() - start} ms.`);
        return count;
    }
    /**
     * [ext-filter] Dim or hide nodes.
     *
     * @param {boolean} [opts={autoExpand: false, leavesOnly: false}]
     */
    filterNodes(filter, opts) {
        return this._applyFilterNoUpdate(filter, false, opts);
    }
    /**
     * [ext-filter] Dim or hide whole branches.
     *
     * @param {boolean} [opts={autoExpand: false}]
     */
    filterBranches(filter, opts) {
        return this._applyFilterNoUpdate(filter, true, opts);
    }
    /**
     * [ext-filter] Re-apply current filter.
     */
    updateFilter() {
        let tree = this.tree;
        if (tree.filterMode &&
            this.lastFilterArgs &&
            tree.options.filter.autoApply) {
            this._applyFilterNoUpdate.apply(this, this.lastFilterArgs);
        }
        else {
            tree.logWarn("updateFilter(): no filter active.");
        }
    }
    /**
     * [ext-filter] Reset the filter.
     */
    clearFilter() {
        let tree = this.tree, 
        // statusNode = tree.root.findDirectChild(KEY_NODATA),
        escapeTitles = tree.options.escapeTitles;
        // enhanceTitle = tree.options.enhanceTitle,
        tree.enableUpdate(false);
        // if (statusNode) {
        //   statusNode.remove();
        // }
        tree.setStatus(NodeStatusType.ok);
        // we also counted root node's subMatchCount
        delete tree.root.match;
        delete tree.root.subMatchCount;
        tree.visit((node) => {
            if (node.match && node._rowElem) {
                // #491, #601
                let titleElem = node._rowElem.querySelector("span.wb-title");
                if (escapeTitles) {
                    titleElem.textContent = node.title;
                }
                else {
                    titleElem.innerHTML = node.title;
                }
                node._callEvent("enhanceTitle", { titleElem: titleElem });
            }
            delete node.match;
            delete node.subMatchCount;
            delete node.titleWithHighlight;
            if (node.subMatchBadge) {
                node.subMatchBadge.remove();
                delete node.subMatchBadge;
            }
            if (node._filterAutoExpanded && node.expanded) {
                node.setExpanded(false, {
                    noAnimation: true,
                    noEvents: true,
                    scrollIntoView: false,
                });
            }
            delete node._filterAutoExpanded;
        });
        tree.filterMode = null;
        this.lastFilterArgs = null;
        tree.element.classList.remove(
        // "wb-ext-filter",
        "wb-ext-filter-dim", "wb-ext-filter-hide");
        // tree._callHook("treeStructureChanged", this, "clearFilter");
        // tree.render();
        tree.enableUpdate(true);
    }
}
/**
 * @description Marks the matching charecters of `text` either by `mark` or
 * by exotic*Chars (if `escapeTitles` is `true`) based on `matches`
 * which is an array of matching groups.
 * @param {string} text
 * @param {RegExpMatchArray} matches
 */
function _markFuzzyMatchedChars(text, matches, escapeTitles = false) {
    let matchingIndices = [];
    // get the indices of matched characters (Iterate through `RegExpMatchArray`)
    for (let _matchingArrIdx = 1; _matchingArrIdx < matches.length; _matchingArrIdx++) {
        let _mIdx = 
        // get matching char index by cumulatively adding
        // the matched group length
        matches[_matchingArrIdx].length +
            (_matchingArrIdx === 1 ? 0 : 1) +
            (matchingIndices[matchingIndices.length - 1] || 0);
        matchingIndices.push(_mIdx);
    }
    // Map each `text` char to its position and store in `textPoses`.
    let textPoses = text.split("");
    if (escapeTitles) {
        // If escaping the title, then wrap the matchng char within exotic chars
        matchingIndices.forEach(function (v) {
            textPoses[v] = START_MARKER + textPoses[v] + END_MARKER;
        });
    }
    else {
        // Otherwise, Wrap the matching chars within `mark`.
        matchingIndices.forEach(function (v) {
            textPoses[v] = "<mark>" + textPoses[v] + "</mark>";
        });
    }
    // Join back the modified `textPoses` to create final highlight markup.
    return textPoses.join("");
}

/*!
 * Wunderbaum - ext-keynav
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
class KeynavExtension extends WunderbaumExtension {
    constructor(tree) {
        super(tree, "keynav", {});
    }
    onKeyEvent(data) {
        let event = data.event, eventName = eventToString(event), focusNode, node = data.node, tree = this.tree, opts = data.options, handled = true, activate = !event.ctrlKey || opts.autoActivate;
        const navModeOption = opts.navigationMode;
        tree.logDebug(`onKeyEvent: ${eventName}`);
        // Let callback prevent default processing
        if (tree._callEvent("keydown", data) === false) {
            return false;
        }
        // Let ext-edit trigger editing
        if (tree._callMethod("edit._preprocessKeyEvent", data) === false) {
            return false;
        }
        // Set focus to active (or first node) if no other node has the focus yet
        if (!node) {
            const activeNode = tree.getActiveNode();
            const firstNode = tree.getFirstChild();
            if (!activeNode && firstNode && eventName === "ArrowDown") {
                firstNode.logInfo("Keydown: activate first node.");
                firstNode.setActive();
                return;
            }
            focusNode = activeNode || firstNode;
            if (focusNode) {
                focusNode.setFocus();
                node = tree.getFocusNode();
                node.logInfo("Keydown: force focus on active node.");
            }
        }
        if (tree.navMode === NavigationMode.row) {
            // --- Quick-Search
            if (opts.quicksearch &&
                eventName.length === 1 &&
                /^\w$/.test(eventName)
            // && !$target.is(":input:enabled")
            ) {
                // Allow to search for longer streaks if typed in quickly
                const stamp = Date.now();
                if (stamp - tree.lastQuicksearchTime > 500) {
                    tree.lastQuicksearchTerm = "";
                }
                tree.lastQuicksearchTime = stamp;
                tree.lastQuicksearchTerm += eventName;
                let matchNode = tree.findNextNode(tree.lastQuicksearchTerm, tree.getActiveNode());
                if (matchNode) {
                    matchNode.setActive(true, { event: event });
                }
                event.preventDefault();
                return;
            }
            // Pre-Evaluate expand/collapse action for LEFT/RIGHT
            switch (eventName) {
                case "ArrowLeft":
                    if (node.expanded) {
                        eventName = "Subtract"; // collapse
                    }
                    break;
                case "ArrowRight":
                    if (!node.expanded && (node.children || node.lazy)) {
                        eventName = "Add"; // expand
                    }
                    else if (navModeOption === NavigationModeOption.startRow) {
                        tree.setCellMode(NavigationMode.cellNav);
                        return;
                    }
                    break;
            }
            // Standard navigation (row mode)
            switch (eventName) {
                case "+":
                case "Add":
                    // case "=": // 187: '+' @ Chrome, Safari
                    node.setExpanded(true);
                    break;
                case "-":
                case "Subtract":
                    node.setExpanded(false);
                    break;
                case " ":
                    // if (node.isPagingNode()) {
                    //   tree._triggerNodeEvent("clickPaging", ctx, event);
                    // } else
                    if (node.getOption("checkbox")) {
                        node.setSelected(!node.isSelected());
                    }
                    else {
                        node.setActive(true, { event: event });
                    }
                    break;
                case "Enter":
                    node.setActive(true, { event: event });
                    break;
                case "ArrowDown":
                case "ArrowLeft":
                case "ArrowRight":
                case "ArrowUp":
                case "Backspace":
                case "End":
                case "Home":
                case "Control+End":
                case "Control+Home":
                case "PageDown":
                case "PageUp":
                    node.navigate(eventName, { activate: activate, event: event });
                    break;
                default:
                    handled = false;
            }
        }
        else {
            // Standard navigation (cell mode)
            switch (eventName) {
                case " ":
                    if (tree.activeColIdx === 0 && node.getOption("checkbox")) {
                        node.setSelected(!node.isSelected());
                        handled = true;
                    }
                    else {
                        // [Space] key should trigger embedded checkbox
                        const elem = tree.getActiveColElem();
                        const cb = elem === null || elem === void 0 ? void 0 : elem.querySelector("input[type=checkbox]");
                        cb === null || cb === void 0 ? void 0 : cb.click();
                    }
                    break;
                case "Enter":
                    if (tree.activeColIdx === 0 && node.isExpandable()) {
                        node.setExpanded(!node.isExpanded());
                        handled = true;
                    }
                    break;
                case "Escape":
                    if (tree.navMode === NavigationMode.cellEdit) {
                        tree.setCellMode(NavigationMode.cellNav);
                        handled = true;
                    }
                    else if (tree.navMode === NavigationMode.cellNav) {
                        tree.setCellMode(NavigationMode.row);
                        handled = true;
                    }
                    break;
                case "ArrowLeft":
                    if (tree.activeColIdx > 0) {
                        tree.setColumn(tree.activeColIdx - 1);
                        handled = true;
                    }
                    else if (navModeOption !== NavigationModeOption.cell) {
                        tree.setCellMode(NavigationMode.row);
                        handled = true;
                    }
                    break;
                case "ArrowRight":
                    if (tree.activeColIdx < tree.columns.length - 1) {
                        tree.setColumn(tree.activeColIdx + 1);
                        handled = true;
                    }
                    break;
                case "ArrowDown":
                case "ArrowUp":
                case "Backspace":
                case "End":
                case "Home":
                case "Control+End":
                case "Control+Home":
                case "PageDown":
                case "PageUp":
                    node.navigate(eventName, { activate: activate, event: event });
                    break;
                default:
                    handled = false;
            }
        }
        if (handled) {
            event.preventDefault();
        }
        return;
    }
}

/*!
 * Wunderbaum - ext-logger
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
class LoggerExtension extends WunderbaumExtension {
    constructor(tree) {
        super(tree, "logger", {});
        this.ignoreEvents = new Set([
            "enhanceTitle",
            "render",
            "discard",
        ]);
        this.prefix = tree + ".ext-logger";
    }
    init() {
        const tree = this.tree;
        // this.ignoreEvents.add();
        if (tree.getOption("debugLevel") >= 4) {
            // const self = this;
            const ignoreEvents = this.ignoreEvents;
            const prefix = this.prefix;
            overrideMethod(tree, "callEvent", function (name, extra) {
                if (ignoreEvents.has(name)) {
                    return tree._superApply(arguments);
                }
                let start = Date.now();
                const res = tree._superApply(arguments);
                console.debug(`${prefix}: callEvent('${name}') took ${Date.now() - start} ms.`, arguments[1]);
                return res;
            });
        }
    }
    onKeyEvent(data) {
        // this.tree.logInfo("onKeyEvent", eventToString(data.event), data);
        console.debug(`${this.prefix}: onKeyEvent()`, data);
        return;
    }
}

/*!
 * Wunderbaum - ext-dnd
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
const nodeMimeType = "application/x-wunderbaum-node";
// type AllowedDropRegionType =
//   | "after"
//   | "afterBefore"
//   // | "afterBeforeOver" // == all == true
//   | "afterOver"
//   | "all" // == true
//   | "before"
//   | "beforeOver"
//   | "none" // == false == "" == null
//   | "over"; // == "child"
class DndExtension extends WunderbaumExtension {
    constructor(tree) {
        super(tree, "dnd", {
            autoExpandMS: 1500,
            // dropMarkerInsertOffsetX: -16, // Additional offset for drop-marker with hitMode = "before"/"after"
            // dropMarkerOffsetX: -24, // Absolute position offset for .fancytree-drop-marker relatively to ..fancytree-title (icon/img near a node accepting drop)
            // #1021 `document.body` is not available yet
            // dropMarkerParent: "body", // Root Container used for drop marker (could be a shadow root)
            multiSource: false,
            effectAllowed: "all",
            // dropEffect: "auto", // 'copy'|'link'|'move'|'auto'(calculate from `effectAllowed`+modifier keys) or callback(node, data) that returns such string.
            dropEffectDefault: "move",
            preventForeignNodes: false,
            preventLazyParents: true,
            preventNonNodes: false,
            preventRecursion: true,
            preventSameParent: false,
            preventVoidMoves: true,
            scroll: true,
            scrollSensitivity: 20,
            scrollSpeed: 5,
            // setTextTypeJson: false, // Allow dragging of nodes to different IE windows
            sourceCopyHook: null,
            // Events (drag support)
            dragStart: null,
            dragDrag: null,
            dragEnd: null,
            // Events (drop support)
            dragEnter: null,
            dragOver: null,
            dragExpand: null,
            dragDrop: null,
            dragLeave: null, // Callback(targetNode, data)
        });
        // public dropMarkerElem?: HTMLElement;
        this.srcNode = null;
        this.lastTargetNode = null;
        this.lastEnterStamp = 0;
        this.lastAllowedDropRegions = null;
        this.lastDropEffect = null;
        this.lastDropRegion = false;
    }
    init() {
        super.init();
        // Store the current scroll parent, which may be the tree
        // container, any enclosing div, or the document.
        // #761: scrollParent() always needs a container child
        // $temp = $("<span>").appendTo(this.$container);
        // this.$scrollParent = $temp.scrollParent();
        // $temp.remove();
        const tree = this.tree;
        const dndOpts = tree.options.dnd;
        // Enable drag support if dragStart() is specified:
        if (dndOpts.dragStart) {
            onEvent(tree.element, "dragstart drag dragend", this.onDragEvent.bind(this));
        }
        // Enable drop support if dragEnter() is specified:
        if (dndOpts.dragEnter) {
            onEvent(tree.element, "dragenter dragover dragleave drop", this.onDropEvent.bind(this));
        }
    }
    /** Cleanup classes after target node is no longer hovered. */
    _leaveNode() {
        // We remove the marker on dragenter from the previous target:
        const ltn = this.lastTargetNode;
        this.lastEnterStamp = 0;
        if (ltn) {
            ltn.removeClass("wb-drop-target wb-drop-over wb-drop-after wb-drop-before");
            this.lastTargetNode = null;
        }
    }
    /** */
    unifyDragover(res) {
        if (res === false) {
            return false;
        }
        else if (res instanceof Set) {
            return res.size > 0 ? res : false;
        }
        else if (res === true) {
            return new Set(["over", "before", "after"]);
        }
        else if (typeof res === "string" || isArray(res)) {
            res = toSet(res);
            return res.size > 0 ? res : false;
        }
        throw new Error("Unsupported drop region definition: " + res);
    }
    /** */
    _calcDropRegion(e, allowed) {
        const dy = e.offsetY;
        if (!allowed) {
            return false;
        }
        else if (allowed.size === 3) {
            return dy < 0.25 * ROW_HEIGHT
                ? "before"
                : dy > 0.75 * ROW_HEIGHT
                    ? "after"
                    : "over";
        }
        else if (allowed.size === 1 && allowed.has("over")) {
            return "over";
        }
        else {
            // Only 'before' and 'after':
            return dy > ROW_HEIGHT / 2 ? "after" : "before";
        }
    }
    /* Implement auto scrolling when drag cursor is in top/bottom area of scroll parent. */
    autoScroll(event) {
        let tree = this.tree, dndOpts = tree.options.dnd, sp = tree.scrollContainer, sensitivity = dndOpts.scrollSensitivity, speed = dndOpts.scrollSpeed, scrolled = 0;
        const scrollTop = sp.offsetTop;
        if (scrollTop + sp.offsetHeight - event.pageY < sensitivity) {
            const delta = sp.scrollHeight - sp.clientHeight - scrollTop;
            if (delta > 0) {
                sp.scrollTop = scrolled = scrollTop + speed;
            }
        }
        else if (scrollTop > 0 && event.pageY - scrollTop < sensitivity) {
            sp.scrollTop = scrolled = scrollTop - speed;
        }
        // if (scrolled) {
        //   tree.logDebug("autoScroll: " + scrolled + "px");
        // }
        return scrolled;
    }
    onDragEvent(e) {
        // const tree = this.tree;
        const dndOpts = this.treeOpts.dnd;
        const srcNode = Wunderbaum.getNode(e);
        if (!srcNode) {
            return;
        }
        if (e.type !== "drag") {
            this.tree.logDebug("onDragEvent." + e.type + ", srcNode: " + srcNode, e);
        }
        // --- dragstart ---
        if (e.type === "dragstart") {
            // Set a default definition of allowed effects
            e.dataTransfer.effectAllowed = dndOpts.effectAllowed; //"copyMove"; // "all";
            // Let user cancel the drag operation, override effectAllowed, etc.:
            const res = srcNode._callEvent("dnd.dragStart", { event: e });
            if (!res) {
                e.preventDefault();
                return false;
            }
            let nodeData = srcNode.toDict(true, (n) => {
                // We don't want to re-use the key on drop:
                n._org_key = n.key;
                delete n.key;
            });
            nodeData.treeId = srcNode.tree.id;
            const json = JSON.stringify(nodeData);
            e.dataTransfer.setData(nodeMimeType, json);
            // e.dataTransfer!.setData("text/html", $(node.span).html());
            e.dataTransfer.setData("text/plain", srcNode.title);
            this.srcNode = srcNode;
            setTimeout(() => {
                // Decouple this call, so the CSS is applied to the node, but not to
                // the system generated drag image
                srcNode.addClass("wb-drag-source");
            }, 0);
            // --- drag ---
        }
        else if (e.type === "drag") ;
        else if (e.type === "dragend") {
            srcNode.removeClass("wb-drag-source");
            this.srcNode = null;
            if (this.lastTargetNode) {
                this._leaveNode();
            }
        }
        return true;
    }
    onDropEvent(e) {
        // const isLink = event.dataTransfer.types.includes("text/uri-list");
        const targetNode = Wunderbaum.getNode(e);
        const dndOpts = this.treeOpts.dnd;
        const dt = e.dataTransfer;
        if (!targetNode) {
            this._leaveNode();
            return;
        }
        if (e.type !== "dragover") {
            this.tree.logDebug("onDropEvent." +
                e.type +
                " targetNode: " +
                targetNode +
                ", ea: " +
                (dt === null || dt === void 0 ? void 0 : dt.effectAllowed) +
                ", de: " +
                (dt === null || dt === void 0 ? void 0 : dt.dropEffect), ", cy: " + e.offsetY, ", r: " + this._calcDropRegion(e, this.lastAllowedDropRegions), e);
        }
        // --- dragenter ---
        if (e.type === "dragenter") {
            this.lastAllowedDropRegions = null;
            // `dragleave` is not reliable with event delegation, so we generate it
            // from dragenter:
            if (this.lastTargetNode && this.lastTargetNode !== targetNode) {
                this._leaveNode();
            }
            this.lastTargetNode = targetNode;
            this.lastEnterStamp = Date.now();
            if (
            // Don't allow void operation ('drop on self')
            (dndOpts.preventVoidMoves && targetNode === this.srcNode) ||
                targetNode.isStatusNode()) {
                dt.dropEffect = "none";
                return true; // Prevent drop operation
            }
            // User may return a set of regions (or `false` to prevent drop)
            let regionSet = targetNode._callEvent("dnd.dragEnter", { event: e });
            //
            regionSet = this.unifyDragover(regionSet);
            if (!regionSet) {
                dt.dropEffect = "none";
                return true; // Prevent drop operation
            }
            this.lastAllowedDropRegions = regionSet;
            this.lastDropEffect = dt.dropEffect;
            targetNode.addClass("wb-drop-target");
            e.preventDefault(); // Allow drop (Drop operation is denied by default)
            return false;
            // --- dragover ---
        }
        else if (e.type === "dragover") {
            this.autoScroll(e);
            const region = this._calcDropRegion(e, this.lastAllowedDropRegions);
            this.lastDropRegion = region;
            if (dndOpts.autoExpandMS > 0 &&
                targetNode.isExpandable(true) &&
                !targetNode._isLoading &&
                Date.now() - this.lastEnterStamp > dndOpts.autoExpandMS &&
                targetNode._callEvent("dnd.dragExpand", { event: e }) !== false) {
                targetNode.setExpanded();
            }
            if (!region) {
                return; // We already rejected in dragenter
            }
            targetNode.toggleClass("wb-drop-over", region === "over");
            targetNode.toggleClass("wb-drop-before", region === "before");
            targetNode.toggleClass("wb-drop-after", region === "after");
            // console.log("dragover", e);
            // dt.dropEffect = this.lastDropEffect!;
            e.preventDefault(); // Allow drop (Drop operation is denied by default)
            return false;
            // --- dragleave ---
        }
        else if (e.type === "dragleave") ;
        else if (e.type === "drop") {
            e.stopPropagation(); // prevent browser from opening links?
            this._leaveNode();
            targetNode._callEvent("dnd.drop", {
                event: e,
                region: this.lastDropRegion,
                sourceNode: this.srcNode,
            });
        }
    }
}

/*!
 * Wunderbaum - deferred
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
/**
 * Deferred is a ES6 Promise, that exposes the resolve() and reject()` method.
 *
 * Loosely mimics [`jQuery.Deferred`](https://api.jquery.com/category/deferred-object/).
 */
class Deferred {
    constructor() {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    /** Resolve the [[Promise]]. */
    resolve(value) {
        this._resolve(value);
    }
    /** Reject the [[Promise]]. */
    reject(reason) {
        this._reject(reason);
    }
    /** Return the native [[Promise]] instance.*/
    promise() {
        return this._promise;
    }
    /** Call [[Promise.then]] on the embedded promise instance.*/
    then(cb) {
        return this._promise.then(cb);
    }
    /** Call [[Promise.catch]] on the embedded promise instance.*/
    catch(cb) {
        return this._promise.catch(cb);
    }
    /** Call [[Promise.finally]] on the embedded promise instance.*/
    finally(cb) {
        return this._promise.finally(cb);
    }
}

/*!
 * Wunderbaum - wunderbaum_node
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
/** Top-level properties that can be passed with `data`. */
const NODE_PROPS = new Set([
    // TODO: use NODE_ATTRS instead?
    "classes",
    "expanded",
    "icon",
    "key",
    "lazy",
    "refKey",
    "selected",
    "title",
    "tooltip",
    "type",
]);
const NODE_ATTRS = new Set([
    "checkbox",
    "expanded",
    "extraClasses",
    "folder",
    "icon",
    "iconTooltip",
    "key",
    "lazy",
    "partsel",
    "radiogroup",
    "refKey",
    "selected",
    "statusNodeType",
    "title",
    "tooltip",
    "type",
    "unselectable",
    "unselectableIgnore",
    "unselectableStatus",
]);
class WunderbaumNode {
    constructor(tree, parent, data) {
        var _a, _b;
        this.refKey = undefined;
        this.children = null;
        this.lazy = false;
        this.expanded = false;
        this.selected = false;
        /** Additional classes added to `div.wb-row`. */
        this.extraClasses = new Set();
        /** Custom data that was passed to the constructor */
        this.data = {};
        this._isLoading = false;
        this._requestId = 0;
        this._errorInfo = null;
        this._partsel = false;
        this._partload = false;
        this.subMatchCount = 0;
        this._rowIdx = 0;
        this._rowElem = undefined;
        assert(!parent || parent.tree === tree);
        assert(!data.children);
        this.tree = tree;
        this.parent = parent;
        this.key = "" + ((_a = data.key) !== null && _a !== void 0 ? _a : ++WunderbaumNode.sequence);
        this.title = "" + ((_b = data.title) !== null && _b !== void 0 ? _b : "<" + this.key + ">");
        data.refKey != null ? (this.refKey = "" + data.refKey) : 0;
        data.statusNodeType != null
            ? (this.statusNodeType = "" + data.statusNodeType)
            : 0;
        data.type != null ? (this.type = "" + data.type) : 0;
        data.checkbox != null ? (this.checkbox = !!data.checkbox) : 0;
        data.colspan != null ? (this.colspan = !!data.colspan) : 0;
        this.expanded = data.expanded === true;
        data.icon != null ? (this.icon = data.icon) : 0;
        this.lazy = data.lazy === true;
        this.selected = data.selected === true;
        if (data.classes) {
            for (const c of data.classes.split(" ")) {
                this.extraClasses.add(c.trim());
            }
        }
        // Store custom fields as `node.data`
        for (const [key, value] of Object.entries(data)) {
            if (!NODE_PROPS.has(key)) {
                this.data[key] = value;
            }
        }
        if (parent && !this.statusNodeType) {
            // Don't register root node or status nodes
            tree._registerNode(this);
        }
    }
    /**
     * Return readable string representation for this instance.
     * @internal
     */
    toString() {
        return "WunderbaumNode@" + this.key + "<'" + this.title + "'>";
    }
    // /** Return an option value. */
    // protected _getOpt(
    //   name: string,
    //   nodeObject: any = null,
    //   treeOptions: any = null,
    //   defaultValue: any = null
    // ): any {
    //   return evalOption(
    //     name,
    //     this,
    //     nodeObject || this,
    //     treeOptions || this.tree.options,
    //     defaultValue
    //   );
    // }
    /** Call event handler if defined in tree.options.
     * Example:
     * ```js
     * node._callEvent("edit.beforeEdit", {foo: 42})
     * ```
     */
    _callEvent(name, extra) {
        return this.tree._callEvent(name, extend({
            node: this,
            typeInfo: this.type ? this.tree.types[this.type] : {},
        }, extra));
    }
    /**
     * Append (or insert) a list of child nodes.
     *
     * Tip: pass `{ before: 0 }` to prepend children
     * @param {NodeData[]} nodeData array of child node definitions (also single child accepted)
     * @param  child node (or key or index of such).
     *     If omitted, the new children are appended.
     * @returns first child added
     */
    addChildren(nodeData, options) {
        let insertBefore = options
            ? options.before
            : null, 
        // redraw = options ? options.redraw !== false : true,
        nodeList = [];
        try {
            this.tree.enableUpdate(false);
            if (isPlainObject(nodeData)) {
                nodeData = [nodeData];
            }
            for (let child of nodeData) {
                let subChildren = child.children;
                delete child.children;
                let n = new WunderbaumNode(this.tree, this, child);
                nodeList.push(n);
                if (subChildren) {
                    n.addChildren(subChildren, { redraw: false });
                }
            }
            if (!this.children) {
                this.children = nodeList;
            }
            else if (insertBefore == null || this.children.length === 0) {
                this.children = this.children.concat(nodeList);
            }
            else {
                // Returns null if insertBefore is not a direct child:
                insertBefore = this.findDirectChild(insertBefore);
                let pos = this.children.indexOf(insertBefore);
                assert(pos >= 0, "insertBefore must be an existing child");
                // insert nodeList after children[pos]
                this.children.splice(pos, 0, ...nodeList);
            }
            // TODO:
            // if (this.tree.options.selectMode === 3) {
            //   this.fixSelection3FromEndNodes();
            // }
            // this.triggerModifyChild("add", nodeList.length === 1 ? nodeList[0] : null);
            this.tree.setModified(ChangeType.structure, this);
            return nodeList[0];
        }
        finally {
            this.tree.enableUpdate(true);
        }
    }
    /**
     * Append or prepend a node, or append a child node.
     *
     * This a convenience function that calls addChildren()
     *
     * @param {NodeData} node node definition
     * @param [mode=child] 'before', 'after', 'firstChild', or 'child' ('over' is a synonym for 'child')
     * @returns new node
     */
    addNode(nodeData, mode = "child") {
        if (mode === "over") {
            mode = "child"; // compatible with drop region
        }
        switch (mode) {
            case "after":
                return this.parent.addChildren(nodeData, {
                    before: this.getNextSibling(),
                });
            case "before":
                return this.parent.addChildren(nodeData, { before: this });
            case "firstChild":
                // Insert before the first child if any
                // let insertBefore = this.children ? this.children[0] : undefined;
                return this.addChildren(nodeData, { before: 0 });
            case "child":
                return this.addChildren(nodeData);
        }
        assert(false, "Invalid mode: " + mode);
        return undefined;
    }
    /**
     * Apply a modification (or navigation) operation.
     * @see Wunderbaum#applyCommand
     */
    applyCommand(cmd, opts) {
        return this.tree.applyCommand(cmd, this, opts);
    }
    addClass(className) {
        const cnSet = toSet(className);
        cnSet.forEach((cn) => {
            var _a;
            this.extraClasses.add(cn);
            (_a = this._rowElem) === null || _a === void 0 ? void 0 : _a.classList.add(cn);
        });
    }
    removeClass(className) {
        const cnSet = toSet(className);
        cnSet.forEach((cn) => {
            var _a;
            this.extraClasses.delete(cn);
            (_a = this._rowElem) === null || _a === void 0 ? void 0 : _a.classList.remove(cn);
        });
    }
    toggleClass(className, flag) {
        const cnSet = toSet(className);
        cnSet.forEach((cn) => {
            var _a;
            flag ? this.extraClasses.add(cn) : this.extraClasses.delete(cn);
            (_a = this._rowElem) === null || _a === void 0 ? void 0 : _a.classList.toggle(cn, flag);
        });
    }
    /** */
    async expandAll(flag = true) {
        this.visit((node) => {
            node.setExpanded(flag);
        });
    }
    /**Find all nodes that match condition (excluding self).
     *
     * @param {string | function(node)} match title string to search for, or a
     *     callback function that returns `true` if a node is matched.
     */
    findAll(match) {
        const matcher = isFunction(match)
            ? match
            : makeNodeTitleMatcher(match);
        const res = [];
        this.visit((n) => {
            if (matcher(n)) {
                res.push(n);
            }
        });
        return res;
    }
    /** Return the direct child with a given key, index or null. */
    findDirectChild(ptr) {
        let cl = this.children;
        if (!cl)
            return null;
        if (typeof ptr === "string") {
            for (let i = 0, l = cl.length; i < l; i++) {
                if (cl[i].key === ptr) {
                    return cl[i];
                }
            }
        }
        else if (typeof ptr === "number") {
            return cl[ptr];
        }
        else if (ptr.parent === this) {
            // Return null if `ptr` is not a direct child
            return ptr;
        }
        return null;
    }
    /**Find first node that matches condition (excluding self).
     *
     * @param match title string to search for, or a
     *     callback function that returns `true` if a node is matched.
     */
    findFirst(match) {
        const matcher = isFunction(match)
            ? match
            : makeNodeTitleMatcher(match);
        let res = null;
        this.visit((n) => {
            if (matcher(n)) {
                res = n;
                return false;
            }
        });
        return res;
    }
    /** Find a node relative to self.
     *
     * @param where The keyCode that would normally trigger this move,
     *		or a keyword ('down', 'first', 'last', 'left', 'parent', 'right', 'up').
     */
    findRelatedNode(where, includeHidden = false) {
        return this.tree.findRelatedNode(this, where, includeHidden);
    }
    /** Return the `<span class='wb-col'>` element with a given index or id.
     * @returns {WunderbaumNode | null}
     */
    getColElem(colIdx) {
        var _a;
        if (typeof colIdx === "string") {
            colIdx = this.tree.columns.findIndex((value) => value.id === colIdx);
        }
        const colElems = (_a = this._rowElem) === null || _a === void 0 ? void 0 : _a.querySelectorAll("span.wb-col");
        return colElems ? colElems[colIdx] : null;
    }
    /** Return the first child node or null.
     * @returns {WunderbaumNode | null}
     */
    getFirstChild() {
        return this.children ? this.children[0] : null;
    }
    /** Return the last child node or null.
     * @returns {WunderbaumNode | null}
     */
    getLastChild() {
        return this.children ? this.children[this.children.length - 1] : null;
    }
    /** Return node depth (starting with 1 for top level nodes). */
    getLevel() {
        let i = 0, p = this.parent;
        while (p) {
            i++;
            p = p.parent;
        }
        return i;
    }
    /** Return the successive node (under the same parent) or null. */
    getNextSibling() {
        let ac = this.parent.children;
        let idx = ac.indexOf(this);
        return ac[idx + 1] || null;
    }
    /** Return the parent node (null for the system root node). */
    getParent() {
        // TODO: return null for top-level nodes?
        return this.parent;
    }
    /** Return an array of all parent nodes (top-down).
     * @param includeRoot Include the invisible system root node.
     * @param includeSelf Include the node itself.
     */
    getParentList(includeRoot = false, includeSelf = false) {
        let l = [], dtn = includeSelf ? this : this.parent;
        while (dtn) {
            if (includeRoot || dtn.parent) {
                l.unshift(dtn);
            }
            dtn = dtn.parent;
        }
        return l;
    }
    /** Return a string representing the hierachical node path, e.g. "a/b/c".
     * @param includeSelf
     * @param node property name or callback
     * @param separator
     */
    getPath(includeSelf = true, part = "title", separator = "/") {
        // includeSelf = includeSelf !== false;
        // part = part || "title";
        // separator = separator || "/";
        let val, path = [], isFunc = typeof part === "function";
        this.visitParents((n) => {
            if (n.parent) {
                val = isFunc
                    ? part(n)
                    : n[part];
                path.unshift(val);
            }
            return undefined; // TODO remove this line
        }, includeSelf);
        return path.join(separator);
    }
    /** Return the preceeding node (under the same parent) or null. */
    getPrevSibling() {
        let ac = this.parent.children;
        let idx = ac.indexOf(this);
        return ac[idx - 1] || null;
    }
    /** Return true if node has children.
     * Return undefined if not sure, i.e. the node is lazy and not yet loaded.
     */
    hasChildren() {
        if (this.lazy) {
            if (this.children == null) {
                return undefined; // null or undefined: Not yet loaded
            }
            else if (this.children.length === 0) {
                return false; // Loaded, but response was empty
            }
            else if (this.children.length === 1 &&
                this.children[0].isStatusNode()) {
                return undefined; // Currently loading or load error
            }
            return true; // One or more child nodes
        }
        return !!(this.children && this.children.length);
    }
    /** Return true if this node is the currently active tree node. */
    isActive() {
        return this.tree.activeNode === this;
    }
    /** Return true if this node is a *direct* child of `other`.
     * (See also [[isDescendantOf]].)
     */
    isChildOf(other) {
        return this.parent && this.parent === other;
    }
    /** Return true if this node is a direct or indirect sub node of `other`.
     * (See also [[isChildOf]].)
     */
    isDescendantOf(other) {
        if (!other || other.tree !== this.tree) {
            return false;
        }
        var p = this.parent;
        while (p) {
            if (p === other) {
                return true;
            }
            if (p === p.parent) {
                error("Recursive parent link: " + p);
            }
            p = p.parent;
        }
        return false;
    }
    /** Return true if this node has children, i.e. the node is generally expandable.
     * If `andCollapsed` is set, we also check if this node is collapsed, i.e.
     * an expand operation is currently possible.
     */
    isExpandable(andCollapsed = false) {
        return !!this.children && (!this.expanded || !andCollapsed);
    }
    /** Return true if this node is currently in edit-title mode. */
    isEditing() {
        return this.tree._callMethod("edit.isEditingTitle", this);
    }
    /** Return true if this node is currently expanded. */
    isExpanded() {
        return !!this.expanded;
    }
    /** Return true if this node is the first node of its parent's children. */
    isFirstSibling() {
        var p = this.parent;
        return !p || p.children[0] === this;
    }
    /** Return true if this node is the last node of its parent's children. */
    isLastSibling() {
        var p = this.parent;
        return !p || p.children[p.children.length - 1] === this;
    }
    /** Return true if this node is lazy (even if data was already loaded) */
    isLazy() {
        return !!this.lazy;
    }
    /** Return true if node is lazy and loaded. For non-lazy nodes always return true. */
    isLoaded() {
        return !this.lazy || this.hasChildren() !== undefined; // Also checks if the only child is a status node
    }
    /** Return true if node is currently loading, i.e. a GET request is pending. */
    isLoading() {
        return this._isLoading;
    }
    /** Return true if this node is a temporarily generated status node of type 'paging'. */
    isPagingNode() {
        return this.statusNodeType === "paging";
    }
    /** (experimental) Return true if this node is partially loaded. */
    isPartload() {
        return !!this._partload;
    }
    /** Return true if this node is partially selected (tri-state). */
    isPartsel() {
        return !this.selected && !!this._partsel;
    }
    /** Return true if this node has DOM representaion, i.e. is displayed in the viewport. */
    isRendered() {
        return !!this._rowElem;
    }
    /** Return true if this node is the (invisible) system root node.
     * (See also [[isTopLevel()]].)
     */
    isRootNode() {
        return this.tree.root === this;
    }
    /** Return true if this node is selected, i.e. the checkbox is set. */
    isSelected() {
        return !!this.selected;
    }
    /** Return true if this node is a temporarily generated system node like
     * 'loading', 'paging', or 'error' (node.statusNodeType contains the type).
     */
    isStatusNode() {
        return !!this.statusNodeType;
    }
    /** Return true if this a top level node, i.e. a direct child of the (invisible) system root node. */
    isTopLevel() {
        return this.tree.root === this.parent;
    }
    /** Return true if node is marked lazy but not yet loaded.
     * For non-lazy nodes always return false.
     */
    isUnloaded() {
        // Also checks if the only child is a status node:
        return this.hasChildren() === undefined;
    }
    /** Return true if all parent nodes are expanded. Note: this does not check
     * whether the node is scrolled into the visible part of the screen or viewport.
     */
    isVisible() {
        let i, l, n, hasFilter = this.tree.filterMode === "hide", parents = this.getParentList(false, false);
        // TODO: check $(n.span).is(":visible")
        // i.e. return false for nodes (but not parents) that are hidden
        // by a filter
        if (hasFilter && !this.match && !this.subMatchCount) {
            // this.debug( "isVisible: HIDDEN (" + hasFilter + ", " + this.match + ", " + this.match + ")" );
            return false;
        }
        for (i = 0, l = parents.length; i < l; i++) {
            n = parents[i];
            if (!n.expanded) {
                // this.debug("isVisible: HIDDEN (parent collapsed)");
                return false;
            }
            // if (hasFilter && !n.match && !n.subMatchCount) {
            // 	this.debug("isVisible: HIDDEN (" + hasFilter + ", " + this.match + ", " + this.match + ")");
            // 	return false;
            // }
        }
        // this.debug("isVisible: VISIBLE");
        return true;
    }
    _loadSourceObject(source) {
        const tree = this.tree;
        // Let caller modify the parsed JSON response:
        this._callEvent("receive", { response: source });
        if (isArray(source)) {
            source = { children: source };
        }
        assert(isPlainObject(source));
        assert(source.children, "If `source` is an object, it must have a `children` property");
        if (source.types) {
            // TODO: convert types.classes to Set()
            extend(tree.types, source.types);
        }
        this.addChildren(source.children);
        this._callEvent("load");
    }
    /** Download  data from the cloud, then call `.update()`. */
    async load(source) {
        const tree = this.tree;
        // const opts = tree.options;
        const requestId = Date.now();
        const prevParent = this.parent;
        const url = typeof source === "string" ? source : source.url;
        // Check for overlapping requests
        if (this._requestId) {
            this.logWarn(`Recursive load request #${requestId} while #${this._requestId} is pending.`);
            // 	node.debug("Send load request #" + requestId);
        }
        this._requestId = requestId;
        const timerLabel = tree.logTime(this + ".load()");
        try {
            if (!url) {
                this._loadSourceObject(source);
            }
            else {
                this.setStatus(NodeStatusType.loading);
                const response = await fetch(url, { method: "GET" });
                if (!response.ok) {
                    error(`GET ${url} returned ${response.status}, ${response}`);
                }
                const data = await response.json();
                if (this._requestId && this._requestId > requestId) {
                    this.logWarn(`Ignored load response #${requestId} because #${this._requestId} is pending.`);
                    return;
                }
                else {
                    this.logDebug(`Received response for load request #${requestId}`);
                }
                if (this.parent === null && prevParent !== null) {
                    this.logWarn("Lazy parent node was removed while loading: discarding response.");
                    return;
                }
                this.setStatus(NodeStatusType.ok);
                if (data.columns) {
                    tree.logInfo("Re-define columns", data.columns);
                    assert(!this.parent);
                    tree.columns = data.columns;
                    delete data.columns;
                    tree.renderHeader();
                }
                this._loadSourceObject(data);
            }
        }
        catch (error) {
            this.logError("Error during load()", source, error);
            this._callEvent("error", { error: error });
            this.setStatus(NodeStatusType.error, "" + error);
            throw error;
        }
        finally {
            this._requestId = 0;
            tree.logTimeEnd(timerLabel);
        }
    }
    /**Load content of a lazy node. */
    async loadLazy(forceReload = false) {
        const wasExpanded = this.expanded;
        assert(this.lazy, "load() requires a lazy node");
        // _assert( forceReload || this.isUndefined(), "Pass forceReload=true to re-load a lazy node" );
        if (!forceReload && !this.isUnloaded()) {
            return;
        }
        if (this.isLoaded()) {
            this.resetLazy(); // Also collapses if currently expanded
        }
        // `lazyLoad` may be long-running, so mark node as loading now. `this.load()`
        // will reset the status later.
        this.setStatus(NodeStatusType.loading);
        try {
            const source = await this._callEvent("lazyLoad");
            if (source === false) {
                this.setStatus(NodeStatusType.ok);
                return;
            }
            assert(isArray(source) || (source && source.url), "The lazyLoad event must return a node list, `{url: ...}` or false.");
            await this.load(source); // also calls setStatus('ok')
            if (wasExpanded) {
                this.expanded = true;
                this.tree.updateViewport();
            }
            else {
                this.render(); // Fix expander icon to 'loaded'
            }
        }
        catch (e) {
            this.setStatus(NodeStatusType.error, "" + e);
            // } finally {
        }
        return;
    }
    /** Alias for `logDebug` */
    log(...args) {
        this.logDebug.apply(this, args);
    }
    /* Log to console if opts.debugLevel >= 4 */
    logDebug(...args) {
        if (this.tree.options.debugLevel >= 4) {
            Array.prototype.unshift.call(args, this.toString());
            console.log.apply(console, args);
        }
    }
    /* Log error to console. */
    logError(...args) {
        if (this.tree.options.debugLevel >= 1) {
            Array.prototype.unshift.call(args, this.toString());
            console.error.apply(console, args);
        }
    }
    /* Log to console if opts.debugLevel >= 3 */
    logInfo(...args) {
        if (this.tree.options.debugLevel >= 3) {
            Array.prototype.unshift.call(args, this.toString());
            console.info.apply(console, args);
        }
    }
    /* Log warning to console if opts.debugLevel >= 2 */
    logWarn(...args) {
        if (this.tree.options.debugLevel >= 2) {
            Array.prototype.unshift.call(args, this.toString());
            console.warn.apply(console, args);
        }
    }
    /** Expand all parents and optionally scroll into visible area as neccessary.
     * Promise is resolved, when lazy loading and animations are done.
     * @param {object} [opts] passed to `setExpanded()`.
     *     Defaults to {noAnimation: false, noEvents: false, scrollIntoView: true}
     */
    async makeVisible(opts) {
        let i, dfd = new Deferred(), deferreds = [], parents = this.getParentList(false, false), len = parents.length, effects = !(opts && opts.noAnimation === true), scroll = !(opts && opts.scrollIntoView === false);
        // Expand bottom-up, so only the top node is animated
        for (i = len - 1; i >= 0; i--) {
            // self.debug("pushexpand" + parents[i]);
            deferreds.push(parents[i].setExpanded(true, opts));
        }
        Promise.all(deferreds).then(() => {
            // All expands have finished
            // self.debug("expand DONE", scroll);
            if (scroll) {
                this.scrollIntoView(effects).then(() => {
                    // self.debug("scroll DONE");
                    dfd.resolve();
                });
            }
            else {
                dfd.resolve();
            }
        });
        return dfd.promise();
    }
    /** Move this node to targetNode. */
    moveTo(targetNode, mode = "appendChild", map) {
        if (mode === "prependChild") {
            if (targetNode.children && targetNode.children.length) {
                mode = "before";
                targetNode = targetNode.children[0];
            }
            else {
                mode = "appendChild";
            }
        }
        let pos, tree = this.tree, prevParent = this.parent, targetParent = mode === "appendChild" ? targetNode : targetNode.parent;
        if (this === targetNode) {
            return;
        }
        else if (!this.parent) {
            error("Cannot move system root");
        }
        else if (targetParent.isDescendantOf(this)) {
            error("Cannot move a node to its own descendant");
        }
        if (targetParent !== prevParent) {
            prevParent.triggerModifyChild("remove", this);
        }
        // Unlink this node from current parent
        if (this.parent.children.length === 1) {
            if (this.parent === targetParent) {
                return; // #258
            }
            this.parent.children = this.parent.lazy ? [] : null;
            this.parent.expanded = false;
        }
        else {
            pos = this.parent.children.indexOf(this);
            assert(pos >= 0, "invalid source parent");
            this.parent.children.splice(pos, 1);
        }
        // Insert this node to target parent's child list
        this.parent = targetParent;
        if (targetParent.hasChildren()) {
            switch (mode) {
                case "appendChild":
                    // Append to existing target children
                    targetParent.children.push(this);
                    break;
                case "before":
                    // Insert this node before target node
                    pos = targetParent.children.indexOf(targetNode);
                    assert(pos >= 0, "invalid target parent");
                    targetParent.children.splice(pos, 0, this);
                    break;
                case "after":
                    // Insert this node after target node
                    pos = targetParent.children.indexOf(targetNode);
                    assert(pos >= 0, "invalid target parent");
                    targetParent.children.splice(pos + 1, 0, this);
                    break;
                default:
                    error("Invalid mode " + mode);
            }
        }
        else {
            targetParent.children = [this];
        }
        // Let caller modify the nodes
        if (map) {
            targetNode.visit(map, true);
        }
        if (targetParent === prevParent) {
            targetParent.triggerModifyChild("move", this);
        }
        else {
            // prevParent.triggerModifyChild("remove", this);
            targetParent.triggerModifyChild("add", this);
        }
        // Handle cross-tree moves
        if (tree !== targetNode.tree) {
            // Fix node.tree for all source nodes
            // 	util.assert(false, "Cross-tree move is not yet implemented.");
            this.logWarn("Cross-tree moveTo is experimental!");
            this.visit(function (n) {
                // TODO: fix selection state and activation, ...
                n.tree = targetNode.tree;
            }, true);
        }
        tree.updateViewport();
        // TODO: fix selection state
        // TODO: fix active state
    }
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
    async navigate(where, options) {
        // Allow to pass 'ArrowLeft' instead of 'left'
        where = KEY_TO_ACTION_DICT[where] || where;
        // Otherwise activate or focus the related node
        let node = this.findRelatedNode(where);
        if (node) {
            // setFocus/setActive will scroll later (if autoScroll is specified)
            try {
                node.makeVisible({ scrollIntoView: false });
            }
            catch (e) { } // #272
            node.setFocus();
            if ((options === null || options === void 0 ? void 0 : options.activate) === false) {
                return Promise.resolve(this);
            }
            return node.setActive(true, { event: options === null || options === void 0 ? void 0 : options.event });
        }
        this.logWarn("Could not find related node '" + where + "'.");
        return Promise.resolve(this);
    }
    /** Delete this node and all descendants. */
    remove() {
        const tree = this.tree;
        const pos = this.parent.children.indexOf(this);
        this.parent.children.splice(pos, 1);
        this.visit((n) => {
            n.removeMarkup();
            tree._unregisterNode(n);
        }, true);
    }
    /** Remove all descendants of this node. */
    removeChildren() {
        const tree = this.tree;
        if (!this.children) {
            return;
        }
        if (tree.activeNode && tree.activeNode.isDescendantOf(this)) {
            tree.activeNode.setActive(false); // TODO: don't fire events
        }
        if (tree.focusNode && tree.focusNode.isDescendantOf(this)) {
            tree.focusNode = null;
        }
        // TODO: persist must take care to clear select and expand cookies
        // Unlink children to support GC
        // TODO: also delete this.children (not possible using visit())
        this.triggerModifyChild("remove", null);
        this.visit((n) => {
            tree._unregisterNode(n);
        });
        if (this.lazy) {
            // 'undefined' would be interpreted as 'not yet loaded' for lazy nodes
            this.children = [];
        }
        else {
            this.children = null;
        }
        // util.assert(this.parent); // don't call this for root node
        if (!this.isRootNode()) {
            this.expanded = false;
        }
        this.tree.updateViewport();
    }
    /** Remove all HTML markup from the DOM. */
    removeMarkup() {
        if (this._rowElem) {
            delete this._rowElem._wb_node;
            this._rowElem.remove();
            this._rowElem = undefined;
        }
    }
    _getRenderInfo() {
        let colInfosById = {};
        let idx = 0;
        let colElems = this._rowElem
            ? (this._rowElem.querySelectorAll("span.wb-col"))
            : null;
        for (let col of this.tree.columns) {
            colInfosById[col.id] = {
                id: col.id,
                idx: idx,
                elem: colElems ? colElems[idx] : null,
                info: col,
            };
            idx++;
        }
        return colInfosById;
    }
    _createIcon(parentElem, replaceChild) {
        let iconSpan;
        let icon = this.getOption("icon");
        if (this._errorInfo) {
            icon = iconMap.error;
        }
        else if (this._isLoading) {
            icon = iconMap.loading;
        }
        if (icon === false) {
            return null;
        }
        if (typeof icon === "string") ;
        else if (this.statusNodeType) {
            icon = iconMap[this.statusNodeType];
        }
        else if (this.expanded) {
            icon = iconMap.folderOpen;
        }
        else if (this.children) {
            icon = iconMap.folder;
        }
        else {
            icon = iconMap.doc;
        }
        // this.log("_createIcon: " + icon);
        if (icon.indexOf("<") >= 0) {
            // HTML
            iconSpan = elemFromHtml(icon);
        }
        else if (TEST_IMG.test(icon)) {
            // Image URL
            iconSpan = elemFromHtml(`<img src="${icon}" class="wb-icon">`);
        }
        else {
            // Class name
            iconSpan = document.createElement("i");
            iconSpan.className = "wb-icon " + icon;
        }
        if (replaceChild) {
            parentElem.replaceChild(iconSpan, replaceChild);
        }
        else {
            parentElem.appendChild(iconSpan);
        }
        // this.log("_createIcon: ", iconSpan);
        return iconSpan;
    }
    /** Create HTML markup for this node, i.e. the whole row. */
    render(opts) {
        const tree = this.tree;
        const treeOptions = tree.options;
        const checkbox = this.getOption("checkbox") !== false;
        const columns = tree.columns;
        const typeInfo = this.type ? tree.types[this.type] : null;
        const level = this.getLevel();
        let elem;
        let nodeElem;
        let rowDiv = this._rowElem;
        let titleSpan;
        let checkboxSpan = null;
        let iconSpan;
        let expanderSpan = null;
        const activeColIdx = tree.navMode === NavigationMode.row ? null : tree.activeColIdx;
        // let colElems: HTMLElement[];
        const isNew = !rowDiv;
        assert(!this.isRootNode());
        //
        let rowClasses = ["wb-row"];
        this.expanded ? rowClasses.push("wb-expanded") : 0;
        this.lazy ? rowClasses.push("wb-lazy") : 0;
        this.selected ? rowClasses.push("wb-selected") : 0;
        this === tree.activeNode ? rowClasses.push("wb-active") : 0;
        this === tree.focusNode ? rowClasses.push("wb-focus") : 0;
        this._errorInfo ? rowClasses.push("wb-error") : 0;
        this._isLoading ? rowClasses.push("wb-loading") : 0;
        this.statusNodeType
            ? rowClasses.push("wb-status-" + this.statusNodeType)
            : 0;
        this.match ? rowClasses.push("wb-match") : 0;
        this.subMatchCount ? rowClasses.push("wb-submatch") : 0;
        treeOptions.skeleton ? rowClasses.push("wb-skeleton") : 0;
        // TODO: no need to hide!
        // !(this.match || this.subMatchCount) ? rowClasses.push("wb-hide") : 0;
        if (rowDiv) {
            // Row markup already exists
            nodeElem = rowDiv.querySelector("span.wb-node");
            titleSpan = nodeElem.querySelector("span.wb-title");
            expanderSpan = nodeElem.querySelector("i.wb-expander");
            checkboxSpan = nodeElem.querySelector("i.wb-checkbox");
            iconSpan = nodeElem.querySelector("i.wb-icon");
            // TODO: we need this, when icons should be replacable
            // iconSpan = this._createIcon(nodeElem, iconSpan);
            // colElems = (<unknown>(
            //   rowDiv.querySelectorAll("span.wb-col")
            // )) as HTMLElement[];
        }
        else {
            rowDiv = document.createElement("div");
            // rowDiv.classList.add("wb-row");
            // Attach a node reference to the DOM Element:
            rowDiv._wb_node = this;
            nodeElem = document.createElement("span");
            nodeElem.classList.add("wb-node", "wb-col");
            rowDiv.appendChild(nodeElem);
            let ofsTitlePx = 0;
            if (checkbox) {
                checkboxSpan = document.createElement("i");
                nodeElem.appendChild(checkboxSpan);
                ofsTitlePx += ICON_WIDTH;
            }
            for (let i = level - 1; i > 0; i--) {
                elem = document.createElement("i");
                elem.classList.add("wb-indent");
                nodeElem.appendChild(elem);
                ofsTitlePx += ICON_WIDTH;
            }
            if (level > treeOptions.minExpandLevel) {
                expanderSpan = document.createElement("i");
                nodeElem.appendChild(expanderSpan);
                ofsTitlePx += ICON_WIDTH;
            }
            iconSpan = this._createIcon(nodeElem);
            if (iconSpan) {
                ofsTitlePx += ICON_WIDTH;
            }
            titleSpan = document.createElement("span");
            titleSpan.classList.add("wb-title");
            nodeElem.appendChild(titleSpan);
            this._callEvent("enhanceTitle", { titleSpan: titleSpan });
            // Store the width of leading icons with the node, so we can calculate
            // the width of the embedded title span later
            nodeElem._ofsTitlePx = ofsTitlePx;
            if (tree.options.dnd.dragStart) {
                nodeElem.draggable = true;
            }
            // Render columns
            // colElems = [];
            if (!this.colspan && columns.length > 1) {
                let colIdx = 0;
                for (let col of columns) {
                    colIdx++;
                    let colElem;
                    if (col.id === "*") {
                        colElem = nodeElem;
                    }
                    else {
                        colElem = document.createElement("span");
                        colElem.classList.add("wb-col");
                        // colElem.textContent = "" + col.id;
                        rowDiv.appendChild(colElem);
                    }
                    if (colIdx === activeColIdx) {
                        colElem.classList.add("wb-active");
                    }
                    // Add classes from `columns` definition to `<div.wb-col>` cells
                    col.classes ? colElem.classList.add(...col.classes.split(" ")) : 0;
                    colElem.style.left = col._ofsPx + "px";
                    colElem.style.width = col._widthPx + "px";
                    // colElems.push(colElem);
                    if (isNew && col.html) {
                        if (typeof col.html === "string") {
                            colElem.innerHTML = col.html;
                        }
                    }
                }
            }
        }
        // --- From here common code starts (either new or existing markup):
        rowDiv.className = rowClasses.join(" "); // Reset prev. classes
        // Add classes from `node.extraClasses`
        rowDiv.classList.add(...this.extraClasses);
        // Add classes from `tree.types[node.type]`
        if (typeInfo && typeInfo.classes) {
            rowDiv.classList.add(...typeInfo.classes);
        }
        // rowDiv.style.top = (this._rowIdx! * 1.1) + "em";
        rowDiv.style.top = this._rowIdx * ROW_HEIGHT + "px";
        if (expanderSpan) {
            if (this.isExpandable(false)) {
                if (this.expanded) {
                    expanderSpan.className = "wb-expander " + iconMap.expanderExpanded;
                }
                else {
                    expanderSpan.className = "wb-expander " + iconMap.expanderCollapsed;
                }
            }
            else if (this._isLoading) {
                expanderSpan.className = "wb-expander " + iconMap.loading;
            }
            else if (this.lazy && this.children == null) {
                expanderSpan.className = "wb-expander " + iconMap.expanderLazy;
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
        if (this.titleWithHighlight) {
            titleSpan.innerHTML = this.titleWithHighlight;
        }
        else if (tree.options.escapeTitles) {
            titleSpan.textContent = this.title;
        }
        else {
            titleSpan.innerHTML = this.title;
        }
        // Set the width of the title span, so overflow ellipsis work
        if (!treeOptions.skeleton) {
            if (this.colspan) {
                let vpWidth = tree.element.clientWidth;
                titleSpan.style.width =
                    vpWidth - nodeElem._ofsTitlePx - ROW_EXTRA_PAD + "px";
            }
            else {
                titleSpan.style.width =
                    columns[0]._widthPx -
                        nodeElem._ofsTitlePx -
                        ROW_EXTRA_PAD +
                        "px";
            }
        }
        this._rowElem = rowDiv;
        if (this.statusNodeType) {
            this._callEvent("renderStatusNode", {
                isNew: isNew,
                nodeElem: nodeElem,
            });
        }
        else if (this.parent) {
            // Skip root node
            this._callEvent("render", {
                isNew: isNew,
                nodeElem: nodeElem,
                typeInfo: typeInfo,
                colInfosById: this._getRenderInfo(),
            });
        }
        // Attach to DOM as late as possible
        // if (!this._rowElem) {
        tree.nodeListElement.appendChild(rowDiv);
        // }
    }
    /**
     * Remove all children, collapse, and set the lazy-flag, so that the lazyLoad
     * event is triggered on next expand.
     */
    resetLazy() {
        this.removeChildren();
        this.expanded = false;
        this.lazy = true;
        this.children = null;
        this.tree.updateViewport();
    }
    /** Convert node (or whole branch) into a plain object.
     *
     * The result is compatible with node.addChildren().
     *
     * @param include child nodes
     * @param callback(dict, node) is called for every node, in order to allow
     *     modifications.
     *     Return `false` to ignore this node or `"skip"` to include this node
     *     without its children.
     * @returns {NodeData}
     */
    toDict(recursive = false, callback) {
        const dict = {};
        NODE_ATTRS.forEach((propName) => {
            const val = this[propName];
            if (val instanceof Set) {
                // Convert Set to string (or skip if set is empty)
                val.size
                    ? (dict[propName] = Array.prototype.join.call(val.keys(), " "))
                    : 0;
            }
            else if (val || val === false || val === 0) {
                dict[propName] = val;
            }
        });
        if (!isEmptyObject(this.data)) {
            dict.data = extend({}, this.data);
            if (isEmptyObject(dict.data)) {
                delete dict.data;
            }
        }
        if (callback) {
            const res = callback(dict, this);
            if (res === false) {
                return false; // Don't include this node nor its children
            }
            if (res === "skip") {
                recursive = false; // Include this node, but not the children
            }
        }
        if (recursive) {
            if (isArray(this.children)) {
                dict.children = [];
                for (let i = 0, l = this.children.length; i < l; i++) {
                    const node = this.children[i];
                    if (!node.isStatusNode()) {
                        const res = node.toDict(true, callback);
                        if (res !== false) {
                            dict.children.push(res);
                        }
                    }
                }
            }
        }
        return dict;
    }
    /** Return an option value that has a default, but may be overridden by a
     * callback or a node instance attribute.
     *
     * Evaluation sequence:
     *
     * If `tree.options.<name>` is a callback that returns something, use that.
     * Else if `node.<name>` is defined, use that.
     * Else if `tree.types[<node.type>]` is a value, use that.
     * Else if `tree.options.<name>` is a value, use that.
     * Else use `defaultValue`.
     *
     * @param name name of the option property (on node and tree)
     * @param defaultValue return this if nothing else matched
     */
    getOption(name, defaultValue) {
        let tree = this.tree;
        let opts = tree.options;
        // Lookup `name` in options dict
        if (name.indexOf(".") >= 0) {
            [opts, name] = name.split(".");
        }
        let value = opts[name]; // ?? defaultValue;
        // A callback resolver always takes precedence
        if (typeof value === "function") {
            let res = value.call(tree, {
                type: "resolve",
                tree: tree,
                node: this,
                // typeInfo: this.type ? tree.types[this.type] : {},
            });
            if (res !== undefined) {
                return res;
            }
        }
        // If this node has an explicit local setting, use it:
        if (this[name] !== undefined) {
            return this[name];
        }
        // Use value from type definition if defined
        let typeInfo = this.type ? tree.types[this.type] : undefined;
        let res = typeInfo ? typeInfo[name] : undefined;
        if (res !== undefined) {
            return res;
        }
        // Use value from value options dict, fallback do default
        return value !== null && value !== void 0 ? value : defaultValue;
    }
    async scrollIntoView(options) {
        return this.tree.scrollTo(this);
    }
    async setActive(flag = true, options) {
        const tree = this.tree;
        const prev = tree.activeNode;
        const retrigger = options === null || options === void 0 ? void 0 : options.retrigger;
        const noEvent = options === null || options === void 0 ? void 0 : options.noEvent;
        if (!noEvent) {
            let orgEvent = options === null || options === void 0 ? void 0 : options.event;
            if (flag) {
                if (prev !== this || retrigger) {
                    if ((prev === null || prev === void 0 ? void 0 : prev._callEvent("deactivate", {
                        nextNode: this,
                        orgEvent: orgEvent,
                    })) === false) {
                        return;
                    }
                    if (this._callEvent("activate", {
                        prevNode: prev,
                        orgEvent: orgEvent,
                    }) === false) {
                        tree.activeNode = null;
                        prev === null || prev === void 0 ? void 0 : prev.setDirty(ChangeType.status);
                        return;
                    }
                }
            }
            else if (prev === this || retrigger) {
                this._callEvent("deactivate", { nextNode: null, orgEvent: orgEvent });
            }
        }
        if (prev !== this) {
            tree.activeNode = this;
            prev === null || prev === void 0 ? void 0 : prev.setDirty(ChangeType.status);
            this.setDirty(ChangeType.status);
        }
        if (options &&
            options.colIdx != null &&
            options.colIdx !== tree.activeColIdx &&
            tree.navMode !== NavigationMode.row) {
            tree.setColumn(options.colIdx);
        }
        // requestAnimationFrame(() => {
        //   this.scrollIntoView();
        // })
        this.scrollIntoView();
    }
    setDirty(type) {
        if (this.tree._disableUpdate) {
            return;
        }
        if (type === ChangeType.structure) {
            this.tree.updateViewport();
        }
        else if (this._rowElem) {
            // otherwise not in viewport, so no need to render
            this.render();
        }
    }
    async setExpanded(flag = true, options) {
        // alert("" + this.getLevel() + ", "+ this.getOption("minExpandLevel");
        if (!flag &&
            this.isExpanded() &&
            this.getLevel() < this.getOption("minExpandLevel") &&
            !getOption(options, "force")) {
            this.logDebug("Ignored collapse request.");
            return;
        }
        if (flag && this.lazy && this.children == null) {
            await this.loadLazy();
        }
        this.expanded = flag;
        this.setDirty(ChangeType.structure);
    }
    setIcon() {
        throw new Error("Not yet implemented");
        // this.setDirty(ChangeType.status);
    }
    setFocus(flag = true, options) {
        const prev = this.tree.focusNode;
        this.tree.focusNode = this;
        prev === null || prev === void 0 ? void 0 : prev.setDirty(ChangeType.status);
        this.setDirty(ChangeType.status);
    }
    setSelected(flag = true, options) {
        const prev = this.selected;
        if (!!flag !== prev) {
            this._callEvent("select", { flag: flag });
        }
        this.selected = !!flag;
        this.setDirty(ChangeType.status);
    }
    /** Show node status (ok, loading, error, noData) using styles and a dummy child node.
     */
    setStatus(status, message, details) {
        let tree = this.tree;
        let statusNode = null;
        const _clearStatusNode = () => {
            // Remove dedicated dummy node, if any
            let children = this.children;
            if (children && children.length && children[0].isStatusNode()) {
                children[0].remove();
            }
        };
        const _setStatusNode = (data) => {
            // Create/modify the dedicated dummy node for 'loading...' or
            // 'error!' status. (only called for direct child of the invisible
            // system root)
            let children = this.children;
            let firstChild = children ? children[0] : null;
            assert(data.statusNodeType);
            assert(!firstChild || !firstChild.isStatusNode());
            statusNode = this.addNode(data, "firstChild");
            statusNode.match = true;
            tree.setModified(ChangeType.structure);
            return statusNode;
        };
        _clearStatusNode();
        switch (status) {
            case "ok":
                this._isLoading = false;
                this._errorInfo = null;
                break;
            case "loading":
                // If this is the invisible root, add a visible top-level node
                if (!this.parent) {
                    _setStatusNode({
                        statusNodeType: status,
                        title: tree.options.strings.loading +
                            (message ? " (" + message + ")" : ""),
                        checkbox: false,
                        colspan: true,
                        tooltip: details,
                    });
                }
                this._isLoading = true;
                this._errorInfo = null;
                // this.render();
                break;
            case "error":
                _setStatusNode({
                    statusNodeType: status,
                    title: tree.options.strings.loadError +
                        (message ? " (" + message + ")" : ""),
                    checkbox: false,
                    colspan: true,
                    // classes: "wb-center",
                    tooltip: details,
                });
                this._isLoading = false;
                this._errorInfo = { message: message, details: details };
                break;
            case "noData":
                _setStatusNode({
                    statusNodeType: status,
                    title: message || tree.options.strings.noData,
                    checkbox: false,
                    colspan: true,
                    tooltip: details,
                });
                this._isLoading = false;
                this._errorInfo = null;
                break;
            default:
                error("invalid node status " + status);
        }
        tree.updateViewport();
        return statusNode;
    }
    setTitle(title) {
        this.title = title;
        this.setDirty(ChangeType.status);
        // this.triggerModify("rename"); // TODO
    }
    /**
     * Trigger `modifyChild` event on a parent to signal that a child was modified.
     * @param {string} operation Type of change: 'add', 'remove', 'rename', 'move', 'data', ...
     */
    triggerModifyChild(operation, child, extra) {
        if (!this.tree.options.modifyChild)
            return;
        if (child && child.parent !== this) {
            error("child " + child + " is not a child of " + this);
        }
        this._callEvent("modifyChild", extend({ operation: operation, child: child }, extra));
    }
    /**
     * Trigger `modifyChild` event on node.parent(!).
     * @param {string} operation Type of change: 'add', 'remove', 'rename', 'move', 'data', ...
     * @param {object} [extra]
     */
    triggerModify(operation, extra) {
        this.parent.triggerModifyChild(operation, this, extra);
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
     * @param callback the callback function. Return false to stop iteration
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
    /**
     * [ext-filter] Return true if this node is matched by current filter (or no filter is active).
     */
    isMatched() {
        return !(this.tree.filterMode && !this.match);
    }
}
WunderbaumNode.sequence = 0;

/*!
 * Wunderbaum - ext-edit
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * v0.0.1-0, Thu, 31 Mar 2022 15:13:20 GMT (https://github.com/mar10/wunderbaum)
 */
// const START_MARKER = "\uFFF7";
class EditExtension extends WunderbaumExtension {
    constructor(tree) {
        super(tree, "edit", {
            debounce: 100,
            minlength: 1,
            maxlength: null,
            trigger: [],
            trim: true,
            select: true,
            slowClickDelay: 1000,
            validity: true,
            // --- Events ---
            // (note: there is also the `tree.change` event.)
            beforeEdit: null,
            edit: null,
            apply: null,
        });
        this.curEditNode = null;
        this.relatedNode = null;
        this.debouncedOnChange = debounce(this._onChange.bind(this), this.getPluginOption("debounce"));
    }
    /*
     * Call an event handler, while marking the current node cell 'dirty'.
     */
    _applyChange(eventName, node, colElem, extra) {
        let res;
        node.log(`_applyChange(${eventName})`, extra);
        colElem.classList.add("wb-dirty");
        colElem.classList.remove("wb-error");
        try {
            res = node._callEvent(eventName, extra);
        }
        catch (err) {
            node.logError(`Error in ${eventName} event handler`, err);
            colElem.classList.add("wb-error");
            colElem.classList.remove("wb-dirty");
        }
        // Convert scalar return value to a resolved promise
        if (!(res instanceof Promise)) {
            res = Promise.resolve(res);
        }
        res
            .catch((err) => {
            node.logError(`Error in ${eventName} event promise`, err);
            colElem.classList.add("wb-error");
        })
            .finally(() => {
            colElem.classList.remove("wb-dirty");
        });
        return res;
    }
    /*
     * Called for when a control that is embedded in a cell fires a `change` event.
     */
    _onChange(e) {
        // let res;
        const info = Wunderbaum.getEventInfo(e);
        const node = info.node;
        const colElem = info.colElem;
        if (!node || info.colIdx === 0) {
            this.tree.log("Ignored change event for removed element or node title");
            return;
        }
        this._applyChange("change", node, colElem, {
            info: info,
            event: e,
            inputElem: e.target,
            inputValue: Wunderbaum.util.getValueFromElem(e.target),
        });
    }
    // handleKey(e:KeyboardEvent):boolean {
    //   if(this.tree.cellNavMode )
    // }
    init() {
        super.init();
        onEvent(this.tree.element, "change", //"change input",
        ".contenteditable,input,textarea,select", (e) => {
            this.debouncedOnChange(e);
        });
    }
    /* Called by ext_keynav to pre-process input. */
    _preprocessKeyEvent(data) {
        const event = data.event;
        const eventName = eventToString(event);
        const tree = this.tree;
        const trigger = this.getPluginOption("trigger");
        const inputElem = event.target && event.target.closest("input,[contenteditable]");
        // let handled = true;
        tree.logDebug(`_preprocessKeyEvent: ${eventName}`);
        // --- Title editing: apply/discard ---
        if (inputElem) {
            //this.isEditingTitle()) {
            switch (eventName) {
                case "Enter":
                    this._stopEditTitle(true, { event: event });
                    return false;
                case "Escape":
                    this._stopEditTitle(false, { event: event });
                    return false;
            }
            // If the event target is an input element or `contenteditable="true"`,
            // we ignore it as navigation command
            return false;
        }
        // --- Trigger title editing
        if (tree.navMode === NavigationMode.row || tree.activeColIdx === 0) {
            switch (eventName) {
                case "Enter":
                    if (trigger.indexOf("macEnter") >= 0 && isMac) {
                        this.startEditTitle();
                        return false;
                    }
                    break;
                case "F2":
                    if (trigger.indexOf("F2") >= 0) {
                        // tree.setCellMode(NavigationMode.cellEdit);
                        this.startEditTitle();
                        return false;
                    }
                    break;
            }
            return true;
        }
        return true;
    }
    /** Return true if a title is currently being edited. */
    isEditingTitle(node) {
        return node ? this.curEditNode === node : !!this.curEditNode;
    }
    /** Start renaming, i.e. replace the title with an embedded `<input>`. */
    startEditTitle(node) {
        node = node !== null && node !== void 0 ? node : this.tree.getActiveNode();
        const validity = this.getPluginOption("validity");
        const select = this.getPluginOption("select");
        if (!node) {
            return;
        }
        this.tree.logDebug(`startEditTitle(node=${node})`);
        let inputHtml = node._callEvent("edit.beforeEdit");
        if (inputHtml === false) {
            node.logInfo("beforeEdit canceled operation.");
            return;
        }
        // `beforeEdit(e)` may return an input HTML string. Otherwise use a default:
        if (!inputHtml) {
            const title = escapeHtml(node.title);
            inputHtml = `<input type=text class="wb-input-edit" value="${title}" required autocorrect=off>`;
        }
        const titleSpan = node
            .getColElem(0)
            .querySelector(".wb-title");
        titleSpan.innerHTML = inputHtml;
        const inputElem = titleSpan.firstElementChild;
        if (validity) {
            // Permanently apply  input validations (CSS and tooltip)
            inputElem.addEventListener("keydown", (e) => {
                if (!inputElem.reportValidity()) ;
            });
        }
        inputElem.focus();
        if (select) {
            inputElem.select();
        }
        this.curEditNode = node;
        node._callEvent("edit.edit", {
            inputElem: inputElem,
        });
    }
    /**
     *
     * @param apply
     * @returns
     */
    stopEditTitle(apply) {
        return this._stopEditTitle(apply, {});
    }
    /*
     *
     * @param apply
     * @param opts.canKeepOpen
     */
    _stopEditTitle(apply, opts) {
        const focusElem = document.activeElement;
        let newValue = focusElem ? getValueFromElem(focusElem) : null;
        const node = this.curEditNode;
        const forceClose = !!opts.forceClose;
        const validity = this.getPluginOption("validity");
        if (newValue && this.getPluginOption("trim")) {
            newValue = newValue.trim();
        }
        if (!node) {
            this.tree.logDebug("stopEditTitle: not in edit mode.");
            return;
        }
        node.logDebug(`stopEditTitle(${apply})`, opts, focusElem, newValue);
        if (apply && newValue !== null && newValue !== node.title) {
            const colElem = node.getColElem(0);
            this._applyChange("edit.apply", node, colElem, {
                oldValue: node.title,
                newValue: newValue,
                inputElem: focusElem,
            })
                .then((value) => {
                const errMsg = focusElem.validationMessage;
                if (validity && errMsg && value !== false) {
                    // Handler called 'inputElem.setCustomValidity()' to signal error
                    throw new Error(`Edit apply validation failed for "${newValue}": ${errMsg}.`);
                }
                // Discard the embedded `<input>`
                // node.logDebug("applyChange:", value, forceClose)
                if (!forceClose && value === false) {
                    // Keep open
                    return;
                }
                node === null || node === void 0 ? void 0 : node.setTitle(newValue);
                this.curEditNode.render();
                this.curEditNode = null;
                this.relatedNode = null;
                this.tree.setFocus(); // restore focus that was in the input element
            })
                .catch((err) => {
                // this.curEditNode!.render();
                // this.curEditNode = null;
                // this.relatedNode = null;
            });
            // Trigger 'change' event for embedded `<input>`
            // focusElem.blur();
        }
        else {
            // Discard the embedded `<input>`
            this.curEditNode.render();
            this.curEditNode = null;
            this.relatedNode = null;
            // We discarded the <input>, so we have to acquire keyboard focus again
            this.tree.setFocus();
        }
    }
    /**
     * Create a new child or sibling node and start edit mode.
     */
    createNode(mode = "after", node, init) {
        const tree = this.tree;
        node = node !== null && node !== void 0 ? node : tree.getActiveNode();
        assert(node, "No node was passed, or no node is currently active.");
        // const validity = this.getPluginOption("validity");
        mode = mode || "prependChild";
        if (init == null) {
            init = { title: "" };
        }
        else if (typeof init === "string") {
            init = { title: init };
        }
        else {
            assert(isPlainObject(init));
        }
        // Make sure node is expanded (and loaded) in 'child' mode
        if ((mode === "prependChild" || mode === "appendChild") &&
            (node === null || node === void 0 ? void 0 : node.isExpandable(true))) {
            node.setExpanded().then(() => {
                this.createNode(mode, node, init);
            });
            return;
        }
        const newNode = node.addNode(init, mode);
        newNode.addClass("wb-edit-new");
        this.relatedNode = node;
        // Don't filter new nodes:
        newNode.match = true;
        newNode.makeVisible({ noAnimation: true }).then(() => {
            this.startEditTitle(newNode);
        });
    }
}

/*!
 * wunderbaum.ts
 *
 * A tree control.
 *
 * Copyright (c) 2021-2022, Martin Wendt (https://wwWendt.de).
 * Released under the MIT license.
 *
 * @version v0.0.1-0
 * @date Thu, 31 Mar 2022 15:13:20 GMT
 */
// const class_prefix = "wb-";
// const node_props: string[] = ["title", "key", "refKey"];
const MAX_CHANGED_NODES = 10;
/**
 * A persistent plain object or array.
 *
 * See also [[WunderbaumOptions]].
 */
class Wunderbaum {
    constructor(options) {
        this.extensionList = [];
        this.extensions = {};
        this.keyMap = new Map();
        this.refKeyMap = new Map();
        this.viewNodes = new Set();
        // protected rows: WunderbaumNode[] = [];
        // protected _rowCount = 0;
        // protected eventHandlers : Array<function> = [];
        this.activeNode = null;
        this.focusNode = null;
        this._disableUpdate = 0;
        this._disableUpdateCount = 0;
        /** Shared properties, referenced by `node.type`. */
        this.types = {};
        /** List of column definitions. */
        this.columns = [];
        this._columnsById = {};
        // Modification Status
        this.changedSince = 0;
        this.changes = new Set();
        this.changedNodes = new Set();
        // --- FILTER ---
        this.filterMode = null;
        // --- KEYNAV ---
        this.activeColIdx = 0;
        this.navMode = NavigationMode.row;
        this.lastQuicksearchTime = 0;
        this.lastQuicksearchTerm = "";
        // --- EDIT ---
        this.lastClickTime = 0;
        // TODO: make accessible in compiled JS like this?
        this._util = util;
        /** Alias for `logDebug` */
        this.log = this.logDebug; // Alias
        let opts = (this.options = extend({
            id: null,
            source: null,
            element: null,
            debugLevel: DEFAULT_DEBUGLEVEL,
            header: null,
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
            navigationMode: NavigationModeOption.startRow,
            quicksearch: true,
            // --- Events ---
            change: noop,
            enhanceTitle: noop,
            error: noop,
            receive: noop,
            // --- Strings ---
            strings: {
                loadError: "Error",
                loading: "Loading...",
                // loading: "Loading&hellip;",
                noData: "No data",
            },
        }, options));
        const readyDeferred = new Deferred();
        this.ready = readyDeferred.promise();
        let readyOk = false;
        this.ready
            .then(() => {
            readyOk = true;
            try {
                this._callEvent("init");
            }
            catch (error) {
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
            }
            else {
                // Error in load process
                this._callEvent("init", { error: err });
            }
        });
        this.id = opts.id || "wb_" + ++Wunderbaum.sequence;
        this.root = new WunderbaumNode(this, null, {
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
        for (let t of Object.values(this.types)) {
            if (t.classes) {
                t.classes = toSet(t.classes);
            }
        }
        if (this.columns.length === 1) {
            opts.navigationMode = NavigationModeOption.row;
        }
        if (opts.navigationMode === NavigationModeOption.cell ||
            opts.navigationMode === NavigationModeOption.startCell) {
            this.navMode = NavigationMode.cellNav;
        }
        this._updateViewportThrottled = throttle(() => {
            this._updateViewport();
        }, opts.updateThrottleWait, { leading: true, trailing: true });
        // --- Create Markup
        this.element = elemFromSelector(opts.element);
        assert(!!this.element, `Invalid 'element' option: ${opts.element}`);
        this.element.classList.add("wunderbaum");
        if (!this.element.getAttribute("tabindex")) {
            this.element.tabIndex = 0;
        }
        // Attach tree instance to <div>
        this.element._wb_tree = this;
        // Create header markup, or take it from the existing html
        this.headerElement = this.element.querySelector("div.wb-header");
        const wantHeader = opts.header == null ? this.columns.length > 1 : !!opts.header;
        if (this.headerElement) {
            // User existing header markup to define `this.columns`
            assert(!this.columns, "`opts.columns` must not be set if markup already contains a header");
            this.columns = [];
            const rowElement = this.headerElement.querySelector("div.wb-row");
            for (const colDiv of rowElement.querySelectorAll("div")) {
                this.columns.push({
                    id: colDiv.dataset.id || null,
                    text: "" + colDiv.textContent,
                });
            }
        }
        else if (wantHeader) {
            // We need a row div, the rest will be computed from `this.columns`
            const coldivs = "<span class='wb-col'></span>".repeat(this.columns.length);
            this.element.innerHTML = `
        <div class='wb-header'>
          <div class='wb-row'>
            ${coldivs}
          </div>
        </div>`;
            // this.updateColumns({ render: false });
        }
        else {
            this.element.innerHTML = "";
        }
        //
        this.element.innerHTML += `
      <div class="wb-scroll-container">
        <div class="wb-node-list"></div>
      </div>`;
        this.scrollContainer = this.element.querySelector("div.wb-scroll-container");
        this.nodeListElement = this.scrollContainer.querySelector("div.wb-node-list");
        this.headerElement = this.element.querySelector("div.wb-header");
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
                var _a;
                (_a = this.element.querySelector("progress.spinner")) === null || _a === void 0 ? void 0 : _a.remove();
                this.element.classList.remove("wb-initializing");
                // this.updateViewport();
            });
        }
        else {
            // this.updateViewport();
            readyDeferred.resolve();
        }
        // TODO: This is sometimes required, because this.element.clientWidth
        //       has a wrong value at start???
        setTimeout(() => {
            this.updateViewport();
        }, 50);
        // --- Bind listeners
        this.scrollContainer.addEventListener("scroll", (e) => {
            this.updateViewport();
        });
        // window.addEventListener("resize", (e: Event) => {
        //   this.updateViewport();
        // });
        this.resizeObserver = new ResizeObserver((entries) => {
            this.updateViewport();
            console.log("ResizeObserver: Size changed", entries);
        });
        this.resizeObserver.observe(this.element);
        onEvent(this.nodeListElement, "click", "div.wb-row", (e) => {
            const info = Wunderbaum.getEventInfo(e);
            const node = info.node;
            if (this._callEvent("click", { event: e, node: node, info: info }) === false) {
                this.lastClickTime = Date.now();
                return false;
            }
            if (node) {
                // Edit title if 'clickActive' is triggered:
                const trigger = this.getOption("edit.trigger");
                const slowClickDelay = this.getOption("edit.slowClickDelay");
                if (trigger.indexOf("clickActive") >= 0 &&
                    info.region === "title" &&
                    node.isActive() &&
                    (!slowClickDelay || Date.now() - this.lastClickTime < slowClickDelay)) {
                    this._callMethod("edit.startEditTitle", node);
                }
                if (info.colIdx >= 0) {
                    node.setActive(true, { colIdx: info.colIdx, event: e });
                }
                else {
                    node.setActive(true, { event: e });
                }
                if (info.region === TargetType.expander) {
                    node.setExpanded(!node.isExpanded());
                }
                else if (info.region === TargetType.checkbox) {
                    node.setSelected(!node.isSelected());
                }
            }
            // if(e.target.classList.)
            // this.log("click", info);
            this.lastClickTime = Date.now();
        });
        onEvent(this.element, "keydown", (e) => {
            const info = Wunderbaum.getEventInfo(e);
            const eventName = eventToString(e);
            this._callHook("onKeyEvent", {
                event: e,
                node: info.node,
                info: info,
                eventName: eventName,
            });
        });
        onEvent(this.element, "focusin focusout", (e) => {
            const flag = e.type === "focusin";
            this._callEvent("focus", { flag: flag, event: e });
            if (!flag) {
                this._callMethod("edit._stopEditTitle", true, {
                    event: e,
                    forceClose: true,
                });
            }
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
    /** */
    // _renderHeader(){
    //   const coldivs = "<span class='wb-col'></span>".repeat(this.columns.length);
    //   this.element.innerHTML = `
    //     <div class='wb-header'>
    //       <div class='wb-row'>
    //         ${coldivs}
    //       </div>
    //     </div>`;
    // }
    /** Return a Wunderbaum instance, from element, index, or event.
     *
     * @example
     * getTree();  // Get first Wunderbaum instance on page
     * getTree(1);  // Get second Wunderbaum instance on page
     * getTree(event);  // Get tree for this mouse- or keyboard event
     * getTree("foo");  // Get tree for this `tree.options.id`
     * getTree("#tree");  // Get tree for this matching element
     */
    static getTree(el) {
        if (el instanceof Wunderbaum) {
            return el;
        }
        else if (el instanceof WunderbaumNode) {
            return el.tree;
        }
        if (el === undefined) {
            el = 0; // get first tree
        }
        if (typeof el === "number") {
            el = document.querySelectorAll(".wunderbaum")[el]; // el was an integer: return nth element
        }
        else if (typeof el === "string") {
            // Search all trees for matching ID
            for (let treeElem of document.querySelectorAll(".wunderbaum")) {
                const tree = treeElem._wb_tree;
                if (tree && tree.id === el) {
                    return tree;
                }
            }
            // Search by selector
            el = document.querySelector(el);
            if (!el) {
                return null;
            }
        }
        else if (el.target) {
            el = el.target;
        }
        assert(el instanceof Element);
        if (!el.matches(".wunderbaum")) {
            el = el.closest(".wunderbaum");
        }
        if (el && el._wb_tree) {
            return el._wb_tree;
        }
        return null;
    }
    /** Return a WunderbaumNode instance from element, event.
     *
     * @param  el
     */
    static getNode(el) {
        if (!el) {
            return null;
        }
        else if (el instanceof WunderbaumNode) {
            return el;
        }
        else if (el.target !== undefined) {
            el = el.target; // el was an Event
        }
        // `el` is a DOM element
        // let nodeElem = obj.closest("div.wb-row");
        while (el) {
            if (el._wb_node) {
                return el._wb_node;
            }
            el = el.parentElement; //.parentNode;
        }
        return null;
    }
    /** */
    _registerExtension(extension) {
        this.extensionList.push(extension);
        this.extensions[extension.id] = extension;
        // this.extensionMap.set(extension.id, extension);
    }
    /** Called on tree (re)init after markup is created, before loading. */
    _initExtensions() {
        for (let ext of this.extensionList) {
            ext.init();
        }
    }
    /** Add node to tree's bookkeeping data structures. */
    _registerNode(node) {
        let key = node.key;
        assert(key != null && !this.keyMap.has(key));
        this.keyMap.set(key, node);
        let rk = node.refKey;
        if (rk) {
            let rks = this.refKeyMap.get(rk); // Set of nodes with this refKey
            if (rks) {
                rks.add(node);
            }
            else {
                this.refKeyMap.set(rk, new Set());
            }
        }
    }
    /** Remove node from tree's bookkeeping data structures. */
    _unregisterNode(node) {
        const rk = node.refKey;
        if (rk) {
            const rks = this.refKeyMap.get(rk);
            if (rks && rks.delete(node) && !rks.size) {
                // We just removed the last element
                this.refKeyMap.delete(rk);
            }
        }
        // mark as disposed
        node.tree = null;
        node.parent = null;
        // node.title = "DISPOSED: " + node.title
        this.viewNodes.delete(node);
        node.removeMarkup();
    }
    /** Call all hook methods of all registered extensions.*/
    _callHook(hook, data = {}) {
        let res;
        let d = extend({}, { tree: this, options: this.options, result: undefined }, data);
        for (let ext of this.extensionList) {
            res = ext[hook].call(ext, d);
            if (res === false) {
                break;
            }
            if (d.result !== undefined) {
                res = d.result;
            }
        }
        return res;
    }
    /** Call tree method or extension method if defined.
     * Example:
     * ```js
     * tree._callMethod("edit.startEdit", "arg1", "arg2")
     * ```
     */
    _callMethod(name, ...args) {
        const [p, n] = name.split(".");
        const obj = n ? this.extensions[p] : this;
        const func = obj[n];
        if (func) {
            return func.apply(obj, args);
        }
        else {
            this.logError(`Calling undefined method '${name}()'.`);
        }
    }
    /** Call event handler if defined in tree.options.
     * Example:
     * ```js
     * tree._callEvent("edit.beforeEdit", {foo: 42})
     * ```
     */
    _callEvent(name, extra) {
        const [p, n] = name.split(".");
        const opts = this.options;
        const func = n ? opts[p][n] : opts[p];
        if (func) {
            return func.call(this, extend({ name: name, tree: this, util: this._util }, extra));
            // } else {
            //   this.logError(`Triggering undefined event '${name}'.`)
        }
    }
    /** Return the topmost visible node in the viewport */
    _firstNodeInView(complete = true) {
        let topIdx, node;
        if (complete) {
            topIdx = Math.ceil(this.scrollContainer.scrollTop / ROW_HEIGHT);
        }
        else {
            topIdx = Math.floor(this.scrollContainer.scrollTop / ROW_HEIGHT);
        }
        // TODO: start searching from active node (reverse)
        this.visitRows((n) => {
            if (n._rowIdx === topIdx) {
                node = n;
                return false;
            }
        });
        return node;
    }
    /** Return the lowest visible node in the viewport */
    _lastNodeInView(complete = true) {
        let bottomIdx, node;
        if (complete) {
            bottomIdx =
                Math.floor((this.scrollContainer.scrollTop + this.scrollContainer.clientHeight) /
                    ROW_HEIGHT) - 1;
        }
        else {
            bottomIdx =
                Math.ceil((this.scrollContainer.scrollTop + this.scrollContainer.clientHeight) /
                    ROW_HEIGHT) - 1;
        }
        // TODO: start searching from active node
        this.visitRows((n) => {
            if (n._rowIdx === bottomIdx) {
                node = n;
                return false;
            }
        });
        return node;
    }
    /** Return preceeding visible node in the viewport */
    _getPrevNodeInView(node, ofs = 1) {
        this.visitRows((n) => {
            node = n;
            if (ofs-- <= 0) {
                return false;
            }
        }, { reverse: true, start: node || this.getActiveNode() });
        return node;
    }
    /** Return following visible node in the viewport */
    _getNextNodeInView(node, ofs = 1) {
        this.visitRows((n) => {
            node = n;
            if (ofs-- <= 0) {
                return false;
            }
        }, { reverse: false, start: node || this.getActiveNode() });
        return node;
    }
    addChildren(nodeData, options) {
        return this.root.addChildren(nodeData, options);
    }
    /*
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
    applyCommand(cmd, nodeOrOpts, opts) {
        let // clipboard,
        node, refNode;
        // opts = $.extend(
        // 	{ setActive: true, clipboard: CLIPBOARD },
        // 	opts_
        // );
        if (nodeOrOpts instanceof WunderbaumNode) {
            node = nodeOrOpts;
        }
        else {
            node = this.getActiveNode();
            assert(opts === undefined);
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
                    node.moveTo(node.getParent(), "after");
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
                error(`Unhandled command: '${cmd}'`);
        }
    }
    /** Delete all nodes. */
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
     * Clear nodes and markup and detach events and observers.
     *
     * This method may be useful to free up resources before re-creating a tree
     * on an existing div, for example in unittest suites.
     * Note that this Wunderbaum instance becomes unusable afterwards.
     */
    destroy() {
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
     * See also [[WunderbaumNode.getOption()]] to consider `node.NAME` setting and
     * `tree.types[node.type].NAME`.
     *
     * @param name option name (use dot notation to access extension option, e.g. `filter.mode`)
     */
    getOption(name, defaultValue) {
        let ext;
        let opts = this.options;
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
        return value !== null && value !== void 0 ? value : defaultValue;
    }
    /**
     *
     * @param name
     * @param value
     */
    setOption(name, value) {
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
        const ext = this.extensions[parts[0]];
        ext.setPluginOption(parts[1], value);
    }
    /**Return true if the tree (or one of its nodes) has the input focus. */
    hasFocus() {
        return this.element.contains(document.activeElement);
    }
    /** Run code, but defer `updateViewport()` until done. */
    runWithoutUpdate(func, hint = null) {
        // const prev = this._disableUpdate;
        // const start = Date.now();
        // this._disableUpdate = Date.now();
        try {
            this.enableUpdate(false);
            return func();
        }
        finally {
            this.enableUpdate(true);
            // if (!prev && this._disableUpdate === start) {
            //   this._disableUpdate = 0;
            // }
        }
    }
    /** Recursively expand all expandable nodes (triggers lazy load id needed). */
    async expandAll(flag = true) {
        const tag = this.logTime("expandAll(" + flag + ")");
        try {
            this.enableUpdate(false);
            await this.root.expandAll(flag);
        }
        finally {
            this.enableUpdate(true);
            this.logTimeEnd(tag);
        }
    }
    /** Return the number of nodes in the data model.*/
    count(visible = false) {
        if (visible) {
            return this.viewNodes.size;
        }
        return this.keyMap.size;
    }
    /* Internal sanity check. */
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
    findAll(match) {
        return this.root.findAll(match);
    }
    /**Find first node that matches condition.
     *
     * @param match title string to search for, or a
     *     callback function that returns `true` if a node is matched.
     * @see [[WunderbaumNode.findFirst]]
     */
    findFirst(match) {
        return this.root.findFirst(match);
    }
    /** Find the next visible node that starts with `match`, starting at `startNode`
     * and wrap-around at the end.
     */
    findNextNode(match, startNode) {
        //, visibleOnly) {
        let res = null, firstNode = this.getFirstChild();
        let matcher = typeof match === "string" ? makeNodeTitleStartMatcher(match) : match;
        startNode = startNode || firstNode;
        function _checkNode(n) {
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
    findRelatedNode(node, where, includeHidden = false) {
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
                }
                else {
                    res = this._getNextNodeInView(node, pageSize);
                }
                break;
            case "pageUp":
                if (this.focusNode && this.focusNode._rowIdx === 0) {
                    res = this.focusNode;
                }
                else {
                    let topNode = this._firstNodeInView();
                    if (this.focusNode !== topNode) {
                        res = topNode;
                    }
                    else {
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
     * Return the active cell of the currently active node or null.
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
    static getEventInfo(event) {
        let target = event.target, cl = target.classList, parentCol = target.closest(".wb-col"), node = Wunderbaum.getNode(target), res = {
            node: node,
            region: TargetType.unknown,
            colDef: undefined,
            colIdx: -1,
            colId: undefined,
            colElem: parentCol,
        };
        if (cl.contains("wb-title")) {
            res.region = TargetType.title;
        }
        else if (cl.contains("wb-expander")) {
            res.region =
                node.hasChildren() === false ? TargetType.prefix : TargetType.expander;
        }
        else if (cl.contains("wb-checkbox")) {
            res.region = TargetType.checkbox;
        }
        else if (cl.contains("wb-icon")) {
            //|| cl.contains("wb-custom-icon")) {
            res.region = TargetType.icon;
        }
        else if (cl.contains("wb-node")) {
            res.region = TargetType.title;
        }
        else if (parentCol) {
            res.region = TargetType.column;
            const idx = Array.prototype.indexOf.call(parentCol.parentNode.children, parentCol);
            res.colIdx = idx;
        }
        else {
            // Somewhere near the title
            console.warn("getEventInfo(): not found", event, res);
            return res;
        }
        if (res.colIdx === -1) {
            res.colIdx = 0;
        }
        res.colDef = node.tree.columns[res.colIdx];
        res.colDef != null ? (res.colId = res.colDef.id) : 0;
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
    /** Return true if any node is currently in edit-title mode. */
    isEditing() {
        return this._callMethod("edit.isEditingTitle");
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
    /** Log to console if opts.debugLevel >= 4 */
    logDebug(...args) {
        if (this.options.debugLevel >= 4) {
            Array.prototype.unshift.call(args, this.toString());
            console.log.apply(console, args);
        }
    }
    /** Log error to console. */
    logError(...args) {
        if (this.options.debugLevel >= 1) {
            Array.prototype.unshift.call(args, this.toString());
            console.error.apply(console, args);
        }
    }
    /* Log to console if opts.debugLevel >= 3 */
    logInfo(...args) {
        if (this.options.debugLevel >= 3) {
            Array.prototype.unshift.call(args, this.toString());
            console.info.apply(console, args);
        }
    }
    /** @internal */
    logTime(label) {
        if (this.options.debugLevel >= 4) {
            console.time(this + ": " + label);
        }
        return label;
    }
    /** @internal */
    logTimeEnd(label) {
        if (this.options.debugLevel >= 4) {
            console.timeEnd(this + ": " + label);
        }
    }
    /** Log to console if opts.debugLevel >= 2 */
    logWarn(...args) {
        if (this.options.debugLevel >= 2) {
            Array.prototype.unshift.call(args, this.toString());
            console.warn.apply(console, args);
        }
    }
    /** */
    render(opts) {
        const label = this.logTime("render");
        let idx = 0;
        let top = 0;
        const height = ROW_HEIGHT;
        let modified = false;
        let start = opts === null || opts === void 0 ? void 0 : opts.startIdx;
        let end = opts === null || opts === void 0 ? void 0 : opts.endIdx;
        const obsoleteViewNodes = this.viewNodes;
        this.viewNodes = new Set();
        let viewNodes = this.viewNodes;
        // this.debug("render", opts);
        assert(start != null && end != null);
        // Make sure start is always even, so the alternating row colors don't
        // change when scrolling:
        if (start % 2) {
            start--;
        }
        this.visitRows(function (node) {
            const prevIdx = node._rowIdx;
            viewNodes.add(node);
            obsoleteViewNodes.delete(node);
            if (prevIdx !== idx) {
                node._rowIdx = idx;
                modified = true;
            }
            if (idx < start || idx > end) {
                node._callEvent("discard");
                node.removeMarkup();
            }
            else {
                // if (!node._rowElem || prevIdx != idx) {
                node.render({ top: top });
            }
            idx++;
            top += height;
        });
        for (const prevNode of obsoleteViewNodes) {
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
        const headerRow = this.headerElement.querySelector(".wb-row");
        assert(headerRow);
        headerRow.innerHTML = "<span class='wb-col'></span>".repeat(this.columns.length);
        for (let i = 0; i < this.columns.length; i++) {
            let col = this.columns[i];
            let colElem = headerRow.children[i];
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
    scrollTo(opts) {
        const MARGIN = 1;
        const node = opts.node || this.getActiveNode();
        assert(node._rowIdx != null);
        const curTop = this.scrollContainer.scrollTop;
        const height = this.scrollContainer.clientHeight;
        const nodeOfs = node._rowIdx * ROW_HEIGHT;
        let newTop;
        if (nodeOfs > curTop) {
            if (nodeOfs + ROW_HEIGHT < curTop + height) ;
            else {
                // Node is below viewport
                newTop = nodeOfs - height + ROW_HEIGHT - MARGIN;
            }
        }
        else if (nodeOfs < curTop) {
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
    setCellMode(mode) {
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
        this.element.classList.toggle("wb-cell-edit-mode", mode === NavigationMode.cellEdit);
        this.setModified(ChangeType.row, this.activeNode);
    }
    /** */
    setColumn(colIdx) {
        assert(this.navMode !== NavigationMode.row);
        assert(0 <= colIdx && colIdx < this.columns.length);
        this.activeColIdx = colIdx;
        // node.setActive(true, { column: tree.activeColIdx + 1 });
        this.setModified(ChangeType.row, this.activeNode);
        // Update `wb-active` class for all headers
        if (this.headerElement) {
            for (let rowDiv of this.headerElement.children) {
                // for (let rowDiv of document.querySelector("div.wb-header").children) {
                let i = 0;
                for (let colDiv of rowDiv.children) {
                    colDiv.classList.toggle("wb-active", i++ === colIdx);
                }
            }
        }
        // Update `wb-active` class for all cell divs
        for (let rowDiv of this.nodeListElement.children) {
            let i = 0;
            for (let colDiv of rowDiv.children) {
                colDiv.classList.toggle("wb-active", i++ === colIdx);
            }
        }
    }
    /** */
    setFocus(flag = true) {
        if (flag) {
            this.element.focus();
        }
        else {
            this.element.blur();
        }
    }
    /** */
    setModified(change, node, options) {
        if (!this.changedSince) {
            this.changedSince = Date.now();
        }
        this.changes.add(change);
        if (change === ChangeType.structure) {
            this.changedNodes.clear();
        }
        else if (node && !this.changes.has(ChangeType.structure)) {
            if (this.changedNodes.size < MAX_CHANGED_NODES) {
                this.changedNodes.add(node);
            }
            else {
                this.changes.add(ChangeType.structure);
                this.changedNodes.clear();
            }
        }
        // this.log("setModified(" + change + ")", node);
    }
    setStatus(status, message, details) {
        return this.root.setStatus(status, message, details);
    }
    /** Update column headers and width. */
    updateColumns(opts) {
        let modified = false;
        let minWidth = 4;
        let vpWidth = this.element.clientWidth;
        let totalWeight = 0;
        let fixedWidth = 0;
        // Gather width requests
        this._columnsById = {};
        for (let col of this.columns) {
            this._columnsById[col.id] = col;
            let cw = col.width;
            if (!cw || cw === "*") {
                col._weight = 1.0;
                totalWeight += 1.0;
            }
            else if (typeof cw === "number") {
                col._weight = cw;
                totalWeight += cw;
            }
            else if (typeof cw === "string" && cw.endsWith("px")) {
                col._weight = 0;
                let px = parseFloat(cw.slice(0, -2));
                if (col._widthPx != px) {
                    modified = true;
                    col._widthPx = px;
                }
                fixedWidth += px;
            }
            else {
                error("Invalid column width: " + cw);
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
    _updateViewport() {
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
    visit(callback) {
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
     * @returns {boolean} false if iteration was canceled
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
        let i, nextIdx, parent, res, siblings, stopNode, siblingOfs = 0, skipFirstNode = opts.includeSelf === false, includeHidden = !!opts.includeHidden, checkFilter = !includeHidden && this.filterMode === "hide", node = opts.start || this.root.children[0];
        parent = node.parent;
        while (parent) {
            // visit siblings
            siblings = parent.children;
            nextIdx = siblings.indexOf(node) + siblingOfs;
            assert(nextIdx >= 0, "Could not find " + node + " in parent's children: " + parent);
            for (i = nextIdx; i < siblings.length; i++) {
                node = siblings[i];
                if (node === stopNode) {
                    return false;
                }
                if (checkFilter &&
                    !node.statusNodeType &&
                    !node.match &&
                    !node.subMatchCount) {
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
                assert(opts.start, "`wrap` option requires `start`");
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
    _visitRowsUp(callback, opts) {
        let children, idx, parent, includeHidden = !!opts.includeHidden, node = opts.start || this.root.children[0];
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
        }
        return true;
    }
    /** . */
    load(source, options = {}) {
        this.clear();
        const columns = options.columns || source.columns;
        if (columns) {
            this.columns = options.columns;
            this.renderHeader();
            // this.updateColumns({ render: false });
        }
        return this.root.load(source);
    }
    /**
     *
     */
    enableUpdate(flag) {
        /*
            5  7  9                20       25   30
        1   >-------------------------------------<
        2      >--------------------<
        3         >--------------------------<
    
          5
    
        */
        // this.logDebug( `enableUpdate(${flag}): count=${this._disableUpdateCount}...` );
        if (flag) {
            assert(this._disableUpdateCount > 0);
            this._disableUpdateCount--;
            if (this._disableUpdateCount === 0) {
                this.updateViewport();
            }
        }
        else {
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
        return this.extensions.filter.clearFilter();
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
        return this.extensions.filter.updateFilter();
    }
}
Wunderbaum.version = "v0.0.1-0"; // Set to semver by 'grunt release'
Wunderbaum.sequence = 0;
Wunderbaum.util = util;

export { Wunderbaum };
