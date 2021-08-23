/*!
 * Wunderbaum - utils
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

/** Readable names for `MouseEvent.button` */
export const MOUSE_BUTTONS: { [key: number]: string } = {
  0: "",
  1: "left",
  2: "middle",
  3: "right",
  4: "back",
  5: "forward",
};

export const MAX_INT = 9007199254740991;

const REX_HTML = /[&<>"'/]/g; // Escape those characters
const REX_TOOLTIP = /[<>"'/]/g; // Don't escape `&` in tooltips
const ENTITY_MAP: { [key: string]: string } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};

export type FunctionType = (...args: any[]) => any;
export type EventCallbackType = (e: Event) => boolean | void;
type PromiseCallbackType = (val: any) => void;

/**
 * A ES6 Promise, that exposes the resolve() method.
 */
export class Deferred {
  private thens: PromiseCallbackType[] = [];
  private catches: PromiseCallbackType[] = [];

  private status = "";
  private resolvedValue: any;
  private rejectedError: any;

  constructor() {}

  resolve(value?: any) {
    if (this.status) {
      throw new Error("already settled");
    }
    this.status = "resolved";
    this.resolvedValue = value;
    this.thens.forEach((t) => t(value));
    this.thens = []; // Avoid memleaks.
  }
  reject(error?: any) {
    if (this.status) {
      throw new Error("already settled");
    }
    this.status = "rejected";
    this.rejectedError = error;
    this.catches.forEach((c) => c(error));
    this.catches = []; // Avoid memleaks.
  }
  then(cb: any) {
    if (status === "resolved") {
      cb(this.resolvedValue);
    } else {
      this.thens.unshift(cb);
    }
  }
  catch(cb: any) {
    if (this.status === "rejected") {
      cb(this.rejectedError);
    } else {
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

/**
 * Bind one or more event handlers directly to an [[Element]].
 *
 * @param element HTMLElement or selector
 * @param eventNames
 * @param handler
 */
export function onEvent(
  rootElem: HTMLElement | string,
  eventNames: string,
  handler: EventCallbackType
): void;

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
 * @param element HTMLElement or selector
 * @param eventNames
 * @param selector
 * @param handler
 */
export function onEvent(
  rootElem: HTMLElement | string,
  eventNames: string,
  selector: string,
  handler: EventCallbackType
): void;

export function onEvent(
  rootElem: HTMLElement | string,
  eventNames: string,
  selectorOrHandler: string | EventCallbackType,
  handlerOrNone?: EventCallbackType
): void {
  let selector: string | null, handler: EventCallbackType;
  rootElem = elemFromSelector(rootElem)!;

  if (handlerOrNone) {
    selector = selectorOrHandler as string;
    handler = handlerOrNone!;
  } else {
    selector = "";
    handler = selectorOrHandler as EventCallbackType;
  }

  eventNames.split(" ").forEach((evn) => {
    (<HTMLElement>rootElem).addEventListener(evn, function (e) {
      if (!selector) {
        return handler!(e); // no event delegation
      } else if (e.target) {
        let elem = e.target as HTMLElement;
        if (elem.matches(selector as string)) {
          return handler!(e);
        }
        elem = elem.closest(selector) as HTMLElement;
        if (elem) {
          return handler(e);
        }
      }
    });
  });
}

/** Convert `<`, `>`, `&`, `"`, `'`, and `/` to the equivalent entities. */
export function escapeHtml(s: string): string {
  return ("" + s).replace(REX_HTML, function (s) {
    return ENTITY_MAP[s];
  });
}

// export function escapeRegExp(s: string) {
//   return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
// }

export function escapeRegex(s: string) {
  return (s + "").replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
}

/** Convert `<`, `>`, `"`, `'`, and `/` (but not `&`) to the equivalent entities. */
export function escapeTooltip(s: string): string {
  return ("" + s).replace(REX_TOOLTIP, function (s) {
    return ENTITY_MAP[s];
  });
}

export function extractHtmlText(s: string) {
  if (s.indexOf(">") >= 0) {
    error("not implemented");
    // return $("<div/>").html(s).text();
  }
  return s;
}

// export function toggleClass(
//   element: HTMLElement | string,
//   classname: string,
//   force?: boolean
// ): void {
//   element = elemFromSelector(element)!;

//   switch (force) {
//     case true:
//       element.classList.add(classname);
//       break;
//     case false:
//       element.classList.remove(classname);
//       break;
//     default:
//       element.classList.toggle(classname);
//   }
// }

/** Convert an Array or space-separated string to a Set. */
export function toSet(val: any): Set<string> {
  if (val instanceof Set) {
    return val;
  }
  if (typeof val === "string") {
    let set = new Set<string>();
    for (const c of val.split(" ")) {
      set.add(c.trim());
    }
    return set;
  }
  if (Array.isArray(val)) {
    return new Set<string>(val);
  }
  throw new Error("Cannot convert to Set<string>: " + val);
}

/*
 * jQuery Shims
 * http://youmightnotneedjquery.com
 */

export function each(obj: any, callback: any) {
  if (obj == null) {
    // accept `null` or `undefined`
    return obj;
  }
  let length = obj.length,
    i = 0;

  if (typeof length === "number") {
    for (; i < length; i++) {
      if (callback.call(obj[i], i, obj[i]) === false) {
        break;
      }
    }
  } else {
    for (let i in obj) {
      if (callback.call(obj[i], i, obj[i]) === false) {
        break;
      }
    }
  }
  return obj;
}

export function error(msg: string) {
  throw new Error(msg);
}

export function getValueFromElem(elem: HTMLElement, coerce = false) {
  const tag = elem.tagName;
  let value = null;

  if (tag === "INPUT") {
    const input = <HTMLInputElement>elem;
    const type = input.type;

    switch (type) {
      case "checkbox":
        value = input.indeterminate ? undefined : input.checked;
        break;
      case "date":
      case "month":
      case "time":
      case "week":
      case "datetime":
      case "datetime-local":
        value = coerce ? input.valueAsDate : input.value;
        break;
      case "number":
      case "range":
        value = input.valueAsNumber;
        break;
      case "radio":
        const name = input.name;
        const checked = input.parentElement!.querySelector(
          `input[name="${name}"]:checked`
        );
        value = checked ? (<HTMLInputElement>checked).value : undefined;
        break;
      case "button":
      case "reset":
      case "submit":
      case "image":
        break;
      case "text":
      default:
        value = input.value;
    }
  } else if (tag === "SELECT") {
    const select = <HTMLSelectElement>elem;
    value = select.value;
  }
  return value;
}

/** Run function after ms milliseconds and return a promise that resolves when done. */
export function setTimeoutPromise(
  callback: (...args: any[]) => void,
  ms: number
) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(callback.apply(self));
      } catch (err) {
        reject(err);
      }
    }, ms);
  });
}

export function elementFromHtml(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

const IGNORE_KEYS = new Set(["Alt", "Control", "Meta", "Shift"]);

export function eventToString(event: Event) {
  let key = (<KeyboardEvent>event).key,
    // which = (<KeyboardEvent>event).keyCode,
    et = event.type,
    s = [];

  if ((<KeyboardEvent>event).altKey) {
    s.push("Alt");
  }
  if ((<KeyboardEvent>event).ctrlKey) {
    s.push("Control");
  }
  if ((<KeyboardEvent>event).metaKey) {
    s.push("Meta");
  }
  if ((<KeyboardEvent>event).shiftKey) {
    s.push("Shift");
  }

  if (et === "click" || et === "dblclick") {
    s.push(MOUSE_BUTTONS[(<MouseEvent>event).button] + et);
  } else if (et === "wheel") {
    s.push(et);
    // } else if (!IGNORE_KEYCODES[key]) {
    //   s.push(
    //     SPECIAL_KEYCODES[key] ||
    //     String.fromCharCode(key).toLowerCase()
    //   );
  } else if (!IGNORE_KEYS.has(key)) {
    s.push(key);
  }
  return s.join("+");
}

export function assert(cond: any, msg?: string) {
  if (!cond) {
    msg = msg || "Assertion failed.";
    throw new Error(msg);
  }
}

export function extend(...args: any[]) {
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

// export function overrideMethod(class:any, method:string, func:callable) {
//   return ;
// }

export function isEmptyObject(obj: any) {
  // let name;
  // // eslint-disable-next-line guard-for-in
  // for (name in obj) {
  //   return false;
  // }
  // return true;
  // because Object.keys(new Date()).length === 0
  // we have to do some additional check
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function isPlainObject(obj: any) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

export function isFunction(obj: any) {
  return typeof obj === "function";
}

export function isArray(obj: any) {
  return Array.isArray(obj);
}

/** A dummy function that does nothing ('no operation'). */
export function noop(...args: any[]): any {}

export function ready(fn: any) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

export function type(obj: any) {
  return Object.prototype.toString
    .call(obj)
    .replace(/^\[object (.+)\]$/, "$1")
    .toLowerCase();
}

// export const debounce = <T extends (...args: any[]) => any>(
//   callback: T,
//   delay: number
// ) => {
//   let timeout: ReturnType<typeof setTimeout>;

//   return (...args: Parameters<T>): ReturnType<T> => {
//     let result: any;
//     timeout && clearTimeout(timeout);
//     timeout = setTimeout(() => {
//       result = callback(...args);
//     }, delay);
//     return result;
//   };
// };

/**
 * Return HtmlElement from selector or cast existing element.
 */
export function elemFromSelector(obj: string | Element): HTMLElement | null {
  if (!obj) {
    return null; //(null as unknown) as HTMLElement;
  }
  if (typeof obj === "string") {
    return document.querySelector(obj) as HTMLElement;
  }
  return obj as HTMLElement;
}

/** Return a wrapped handler method, that provides `this._super`.
 *
 * @example
  // Implement `opts.createNode` event to add the 'draggable' attribute
  overrideMethod(ctx.options, "createNode", (event, data) => {
    // Default processing if any
    this._super.apply(this, event, data);
    // Add 'draggable' attribute
    data.node.span.draggable = true;
  });
  */
export function overrideMethod(
  instance: any,
  methodName: string,
  handler: FunctionType,
  ctx?: any
) {
  let prevSuper: FunctionType,
    prevSuperApply: FunctionType,
    self = ctx || instance,
    prevFunc = instance[methodName],
    _super = (...args: any[]) => {
      return prevFunc.apply(self, args);
    },
    _superApply = (argsArray: any[]) => {
      return prevFunc.apply(self, argsArray);
    };

  let wrapper = (...args: any[]) => {
    try {
      prevSuper = self._super;
      prevSuperApply = self._superApply;
      self._super = _super;
      self._superApply = _superApply;
      return handler.apply(self, args);
    } finally {
      self._super = prevSuper;
      self._superApply = prevSuperApply;
    }
  };
  instance[methodName] = wrapper;
}
