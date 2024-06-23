/*!
 * Wunderbaum - ext-grid
 * Copyright (c) 2021-2024, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumExtension } from "./wb_extension_base";
import { DragCallbackArgType, DragObserver } from "./drag_observer";
import { ChangeType, ColumnDefinition, GridOptionsType } from "./types";
import { DEFAULT_MIN_COL_WIDTH } from "./common";
import { toBool, toPixel } from "./util";

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
        const allow =
          info.colDef &&
          this.tree.element.contains(e.dragElem) &&
          toBool(info.colDef.resizable, tree.options.resizableColumns, false);

        this.tree.log("dragstart", e, info);

        this.tree.element.classList.toggle("wb-col-resizing", !!allow);
        info.colElem!.classList.toggle("wb-col-resizing", !!allow);

        // We start dagging, so we remember the actual width in pixels
        // (which may be 'auto' or '100%')
        // Since we we re-create the markup on each update, we also cannot store
        // the original event or DOM element
        if (allow) {
          info.colDef!.customWidthPx = Number.parseInt(
            info.colElem!.style.width,
            10
          );
          e.customData.colDef = info.colDef;
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
    // const info = Wunderbaum.getEventInfo(e.startEvent);
    // const colDef = info.colDef!;
    const colDef = <ColumnDefinition>e.customData.colDef!;
    // this.tree.log(`${e.type} (dx=${e.dx})`, e, info);

    if (e.type === "dragstop" || e.type === "drag") {
      this.tree.element.classList.remove("wb-col-resizing");
      // info.colElem!.classList.remove("wb-col-resizing");
      if (e.apply || e.type === "drag") {
        const minWidth = toPixel(colDef.minWidth, DEFAULT_MIN_COL_WIDTH);
        const newWidth = Math.max(minWidth, toPixel(colDef.width) + e.dx);
        colDef.customWidthPx = newWidth;
        this.tree.log("dragstop", e, colDef);
      } else {
        this.tree.log("dragstop (cancelled)", e, colDef);
        delete colDef.customWidthPx;
      }
      this.tree.update(ChangeType.colStructure);
    }
  }
}
