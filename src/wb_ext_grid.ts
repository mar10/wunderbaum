/*!
 * Wunderbaum - ext-grid
 * Copyright (c) 2021-2024, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumExtension } from "./wb_extension_base";
import { DragCallbackArgType, DragObserver } from "./drag_observer";
import { ChangeType, GridOptionsType } from "./types";
import { DEFAULT_MIN_COL_WIDTH } from "./common";
import { toPixel } from "./util";

export class GridExtension extends WunderbaumExtension<GridOptionsType> {
  protected observer: DragObserver;

  constructor(tree: Wunderbaum) {
    super(tree, "grid", {
      // throttle: 200,
    });

    this.observer = new DragObserver({
      root: window.document,
      selector: "span.wb-col-resizer-active",
      thresh: 4,
      // throttle: 400,
      dragstart: (e) => {
        const info = Wunderbaum.getEventInfo(e.startEvent);
        this.tree.log("dragstart", e, info);
        const allow =
          info.colDef &&
          info.colDef.resizable !== false &&
          this.tree.element.contains(e.dragElem);

        if (allow) {
          // this.tree.element.classList.add("wb-col-resizing");
          info.colDef!.customWidthPx = Number.parseInt(
            info.colElem!.style.width,
            10
          );
        }
        return allow;
      },
      drag: (e) => {
        // TODO: throttle
        return this.handleDrag(e);
      },
      dragstop: (e) => {
        return this.handleDrag(e);
      },
    });
  }

  init() {
    super.init();
  }

  protected handleDrag(e: DragCallbackArgType): void {
    const info = Wunderbaum.getEventInfo(e.startEvent);
    const colDef = info.colDef!;
    // this.tree.log(`${e.type} (dx=${e.dx})`, e, info);

    if (e.type === "dragstop") {
      if (e.apply) {
        const minWidth = toPixel(colDef.minWidth, DEFAULT_MIN_COL_WIDTH);
        const newWidth = Math.max(minWidth, toPixel(colDef.width) + e.dx);
        colDef.customWidthPx = newWidth;
        this.tree.log("dragstop", e, info);
      } else {
        this.tree.log("dragstop (cancelled)", e, info);
        delete colDef.customWidthPx;
      }
      this.tree.update(ChangeType.colStructure);
    }
  }
}
