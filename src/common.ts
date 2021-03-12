/*!
 * wunderbaum.js - common
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */
export enum ChangeType {
  any = "any",
  structure = "structure",
  status = "status",
}

export enum TargetType {
  unknown = "",
  title = "title",
  icon = "icon",
  expander = "expander",
  checkbox = "checkbox",
  prefix = "prefix",
}

export type WunderbaumOptions = any;

export const default_debuglevel = 2; // Replaced by rollup script
export const ROW_HEIGHT = 25;
export const RENDER_PREFETCH = 5;
