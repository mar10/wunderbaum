/*!
 * Wunderbaum - ext-grid
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */
// import * as util from "./util";
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumExtension } from "./wb_extension_base";
import { DragCallbackArgType, DragObserver } from "./drag_observer";
// import * as mouse_observer from "./mouse_observer";

export type DropRegionType = "over" | "before" | "after";

export class GridExtension extends WunderbaumExtension {
  // protected resizerTree?: Wunderbaum | null = null;
  // protected resizerElem?: HTMLSpanElement | null = null;
  // protected colElem?: HTMLSpanElement | null = null;
  // protected colDef?: any | null = null;
  // protected startX = 0;
  // protected deltaX = 0;
  protected observer: DragObserver;

  constructor(tree: Wunderbaum) {
    super(tree, "grid", {
      resizerWidth: 5,
    });

    this.observer = new DragObserver({
      root: window.document,
      selector: "span.wb-col-resizer",
      thresh: 4,
      // throttle: 400,
      dragstart: (e) => {
        return this.tree.element.contains(e.dragElem);
      },
      drag: (e) => {
        return this.handleDrag(e);
      },
      dragstop: (e) => {
        return this.handleDrag(e);
      },
    });
  }

  init() {
    super.init();

    // const tree = this.tree;
    // const gridOpts = tree.options.grid;
  }

  protected handleDrag(e: DragCallbackArgType): void {
    const info = Wunderbaum.getEventInfo(e.event);
    this.tree.log(`${e.type}(${e.dx})`, e, info);
  }
}
