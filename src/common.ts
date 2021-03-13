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
  checkbox = "checkbox",
  column = "column",
  expander = "expander",
  icon = "icon",
  prefix = "prefix",
  title = "title",
}

export type WunderbaumOptions = any;

export const default_debuglevel = 2; // Replaced by rollup script
export const ROW_HEIGHT = 24;
export const RENDER_PREFETCH = 5;
