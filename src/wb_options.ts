/*!
 * Wunderbaum - utils
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

/**
 * Available options for [[PersistentObject]].
 *
 * Options are passed to the constructor as plain object:
 *
 * ```js
 * let store = new mar10.PersistentObject("test", {
 *   storage: sessionStorage,  // Default: localStorage
 *   attachForm: "#form1",
 *   defaults: {
 *     title: "foo",
 *     ...
 *   }
 * });
 * ```
 *
 * Events may be handled by passing a handler callback option:
 *
 * ```js
 * let store = new mar10.PersistentObject("mySettings", {
 *   [...]
 *   change: function(hint){
 *     alert("Store " + this + " was changed. Reason: " + hint);
 *   }
 * });
 * ```
 *
 */
export interface WunderbaumOptions {
  /**
   * URL for GET/PUT request to remote server.
   *
   * Pass `null` to disable remote synchronization.<br>
   * Default: `null`.
   */
  remote?: any;
  /**
   * Default values if no data is found in localStorage.
   *
   * Default: `{}`.
   */
  defaults?: any;
  /**
   * Track form input changes and maintain status class names.
   *
   * Automatically call [[readFromForm]] when users enter form data.
   */
  attachForm?: HTMLFormElement|string;
  /**
   * Set status-dependant classes here.
   */
  statusElement?: HTMLFormElement|string;

  /**
   * Commit changes after *X* milliseconds of inactivity.
   *
   * Commit cached changes to localStorage after 0.5 seconds of inactivity.<br>
   * After each change, we wait 0.5 more seconds for additional changes to come
   * in, before the actual commit is executed.
   *
   * The maximum delay (first change until actual commit) is limited by
   * [[maxCommitDelay]].
   *
   * Set to `0` to force synchronous mode.
   * Default: `500` milliseconds.
   */
  commitDelay: number;
  /**
   * Allow [[PersistentObject.set]] to create missing intermediate parent
   * objects.
   */
  createParents?: boolean;
  /**
   * Commit changes max. *X* millseconds after first change.
   *
   * This settings limits the effect of [[commitDelay]], which would otherwise
   * never commit if the user enters keystrokes frequently.
   *
   * Default: `3000` milliseconds
  */
  maxCommitDelay?: number;
  /**
   * Push commits after *X* milliseconds of inactivity.
   *
   * Push commits to remote after 5 seconds of inactivity.<br>
   * After each change, we wait 5 more seconds for additional changes to come
   * in, before the actual push is executed.<br>
   * The maximum delay (first change until actual push) is limited by [[maxPushDelay]].
   *
   * Set to `0` to force synchronous mode.
   * Default: `5000` milliseconds
   */
  pushDelay?: number;
  /**
   * Push commits max. *X* milliseconds after first change.
   *
   * Push every commit to remote max. 30 seconds after it occurred.
   * This setting limits the effect of [[pushDelay]].
   *
   * Default: `30000` milliseconds.
   */
  maxPushDelay?: number;
  /**
   * Instance of [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API).
   *
   * Possible values are `window.localStorage`, `window.sessionStorage`.<br>
   * Pass `null` to disable persistence.
   *
   * Default: `window.localStorage`
  */
  storage?: any;
  /**
   * Verbosity level: 0:quiet, 1:normal, 2:verbose.
   * Default: `1`
   */
  debugLevel?: number;
  /**
   * Called when data was changed (before comitting).
   * @category Callback
   */
  change?: (hint: string) => void;
  /**
   * Called after modified data was written to storage.
   * @category Callback
   */
  commit?: () => void;
  /**
   * Called when new data arrives from storage, while local data is still
   * uncommitted.
   *
   * Return false to prevent updating the local data with the new storage content.
   * @category Callback
   */
  conflict?: (remoteData: any, localData: any) => boolean;
  /**
   * Called on errors, e.g. when Ajax requests fails.
   * @category Callback
   */
  error?: (...args: any[]) => void;
  /**
   * Called after data was received from remote service.
   * @category Callback
   */
  pull?: (response: any) => void;
  /**
   * Called after modified data was POSTed to `remote`.
   * @category Callback
   */
  push?: (response: any) => void;
  /**
   * Modified data was stored.
   *
   * If `remote` was passed, this means `push` has finished,
   * otherwise `commit` has finished.
   * @category Callback
   */
  save?: () => void;
  /**
   * Status changed.
   *
   * Possible values: 'ok', 'error', 'loading', 'status', 'modified'.
   * @category Callback
   */
  status?: (status:string) => void;
  /**
   * Called after data was loaded from local storage.
   * @category Callback
   */
  update?: () => void;
}
