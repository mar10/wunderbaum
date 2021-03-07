/*!
 * wunderbaum.js - utils
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

export const MAX_INT = 9007199254740991;
type promiseCallbackType = (val: any) => void;

/**
 * Deferred is a ES6 Promise, that exposes the resolve() method
 */
export class Deferred {
  private thens: promiseCallbackType[] = [];
  private catches: promiseCallbackType[] = [];

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
export function onEvent(
  rootElem: HTMLElement | string,
  eventName: string,
  selector: string,
  handler: (e: Event) => boolean | void
): void {
  if (typeof rootElem === "string") {
    rootElem = <HTMLElement>document.querySelector(rootElem);
  }
  rootElem.addEventListener(eventName, function (e) {
    if (e.target) {
      let elem = <HTMLElement>e.target;
      if (elem.matches(selector)) {
        return handler(e);
      }
      elem = <HTMLElement>elem.closest(selector);
      if (elem) {
        return handler(e);
      }
    }
  });
}

export function toggleClass(
  element: HTMLElement | string,
  classname: string,
  force?: boolean
): void {
  if (typeof element === "string") {
    element = <HTMLElement>document.querySelector(element);
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
/**
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

export function assert(cond: boolean, msg?: string) {
  if (!cond) {
    msg = msg || "Assertion failed.";
    throw new Error(msg);
  }
}

export function extend(...args: any[]) {
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

export function isArray(obj: any) {
  return Array.isArray(obj);
}

export function noop(): any {}

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
