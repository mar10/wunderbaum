/*!
 * Wunderbaum - ext-dnd
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */
import * as util from "./util";
import { EventCallbackType, onEvent } from "./util";
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumExtension } from "./wb_extension_base";

const nodeMimeType = "application/x-fancytree-node";

export class DndExtension extends WunderbaumExtension {
  public dropMarkerElem?: HTMLElement;

  constructor(tree: Wunderbaum) {
    super(tree, "dnd", {
      autoExpandMS: 1500, // Expand nodes after n milliseconds of hovering
      dropMarkerInsertOffsetX: -16, // Additional offset for drop-marker with hitMode = "before"/"after"
      dropMarkerOffsetX: -24, // Absolute position offset for .fancytree-drop-marker relatively to ..fancytree-title (icon/img near a node accepting drop)
      // #1021 `document.body` is not available yet
      dropMarkerParent: "body", // Root Container used for drop marker (could be a shadow root)
      multiSource: false, // true: Drag multiple (i.e. selected) nodes. Also a callback() is allowed
      effectAllowed: "all", // Restrict the possible cursor shapes and modifier operations (can also be set in the dragStart event)
      // dropEffect: "auto", // 'copy'|'link'|'move'|'auto'(calculate from `effectAllowed`+modifier keys) or callback(node, data) that returns such string.
      dropEffectDefault: "move", // Default dropEffect ('copy', 'link', or 'move') when no modifier is pressed (overide in dragDrag, dragOver).
      preventForeignNodes: false, // Prevent dropping nodes from different Fancytrees
      preventLazyParents: true, // Prevent dropping items on unloaded lazy Fancytree nodes
      preventNonNodes: false, // Prevent dropping items other than Fancytree nodes
      preventRecursion: true, // Prevent dropping nodes on own descendants
      preventSameParent: false, // Prevent dropping nodes under same direct parent
      preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
      scroll: true, // Enable auto-scrolling while dragging
      scrollSensitivity: 20, // Active top/bottom margin in pixel
      scrollSpeed: 5, // Pixel per event
      setTextTypeJson: false, // Allow dragging of nodes to different IE windows
      sourceCopyHook: null, // Optional callback passed to `toDict` on dragStart @since 2.38
      // Events (drag support)
      dragStart: null, // Callback(sourceNode, data), return true, to enable dnd drag
      dragDrag: util.noop, // Callback(sourceNode, data)
      dragEnd: util.noop, // Callback(sourceNode, data)
      // Events (drop support)
      dragEnter: null, // Callback(targetNode, data), return true, to enable dnd drop
      dragOver: util.noop, // Callback(targetNode, data)
      dragExpand: util.noop, // Callback(targetNode, data), return false to prevent autoExpand
      dragDrop: util.noop, // Callback(targetNode, data)
      dragLeave: util.noop, // Callback(targetNode, data)
    });
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
      onEvent(
        tree.element,
        "dragstart drag dragend",
        (<EventCallbackType>this.onDragEvent).bind(this)
      );
    }
    // Enable drop support if dragEnter() is specified:
    if (dndOpts.dragEnter) {
      onEvent(
        tree.element,
        "dragenter dragover dragleave drop",
        (<EventCallbackType>this.onDropEvent).bind(this)
      );
    }
  }

  protected onDragEvent(e: DragEvent) {
    const tree = this.tree;
    const node = Wunderbaum.getNode(e)!;
    const dndOpts = tree.options.dnd;

    this.tree.logDebug("onDragEvent." + e.type + " " + node, e);
    if (e.type === "dragenter") {
      var nodeData = node.toDict(true, dndOpts.sourceCopyHook);
      nodeData.treeId = node.tree.id;
      const json = JSON.stringify(nodeData);
      e.dataTransfer!.setData(nodeMimeType, json);
      // e.dataTransfer!.setData("text/html", $(node.span).html());
      e.dataTransfer!.setData("text/plain", node.title);
    }
    return true;
  }

  protected onDropEvent(e: DragEvent) {
    // const isLink = event.dataTransfer.types.includes("text/uri-list");
    if (e.type === "dragenter" || e.type === "dragover") {
      e.preventDefault(); // Drop operation is denied by default
    }
    const node = Wunderbaum.getNode(e);
    this.tree.logDebug("onDropEvent." + e.type + " " + node, e);
  }
}
