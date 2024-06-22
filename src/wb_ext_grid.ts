/*!
 * Wunderbaum - ext-grid
 * Copyright (c) 2021-2024, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumExtension } from "./wb_extension_base";
import { DragCallbackArgType, DragObserver } from "./drag_observer";
import { ChangeType, GridOptionsType } from "./types";

export class GridExtension extends WunderbaumExtension<GridOptionsType> {
  protected observer: DragObserver;

  constructor(tree: Wunderbaum) {
    super(tree, "grid", {
      // throttle: 200,
    });

    this.observer = new DragObserver({
      root: window.document,
      selector: "span.wb-col-resizer",
      thresh: 4,
      // throttle: 400,
      dragstart: (e) => {
        const info = Wunderbaum.getEventInfo(e.startEvent);
        this.tree.log("dragstart", e, info);
        return this.tree.element.contains(e.dragElem);
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
    // this.tree.options.
    // this.tree.log(`${e.type} (dx=${e.dx})`, e, info);
    // We drag the right border of the column header
    // const newWidth = e.dragElem!.offsetWidth + e.dx;
    // e.dragElem!.style.width = `${newWidth}px`;
    if (e.type === "dragstop" && e.apply) {
      const newWidth = parseInt(<string>colDef.width, 10) + e.dx;
      colDef!.width = `${newWidth}px`;
      this.tree.log("dragstop", e, info);
      this.tree.update(ChangeType.colStructure);
    }
  }
}
