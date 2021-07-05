/*!
 * Wunderbaum - ext-dnd
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */
import * as util from "./util";
import { EventCallbackType, onEvent } from "./util";
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumExtension } from "./wb_extension_base";
import { WunderbaumNode } from "./wb_node";

const nodeMimeType = "application/x-fancytree-node";

export class DndExtension extends WunderbaumExtension {
  // public dropMarkerElem?: HTMLElement;
  protected srcNode: WunderbaumNode | null = null;
  protected lastTargetNode: WunderbaumNode | null = null;

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
    // const tree = this.tree;
    const srcNode = Wunderbaum.getNode(e);

    if (!srcNode) {
      return;
    }
    if (e.type !== "drag") {
      this.tree.logDebug(
        "onDragEvent." + e.type + " sourceNode: " + srcNode,
        e
      );
    }
    if (e.type === "dragstart") {
      let res = srcNode.callEvent("dnd.dragStart");
      if (!res) {
        return;
      }
      let nodeData = srcNode.toDict(true, (n: any) => {
        // We don't want to re-use the key on drop:
        n._org_key = n.key;
        delete n.key;
      });
      nodeData.treeId = srcNode.tree.id;

      const json = JSON.stringify(nodeData);
      e.dataTransfer!.setData(nodeMimeType, json);
      // e.dataTransfer!.setData("text/html", $(node.span).html());
      e.dataTransfer!.setData("text/plain", srcNode.title);

      e.dataTransfer!.effectAllowed = "copyMove"; // "all";

      srcNode.addClass("wb-drag-source");
      this.srcNode = srcNode;
    } else if (e.type === "drag") {
      // This event occurs very often...
    } else if (e.type === "dragend") {
      srcNode.removeClass("wb-drag-source");
      this.srcNode = null;
      if (this.lastTargetNode) {
        // `dragleave` is not reliable with event delegation.
        // We remove the marker on dragenter from the previous target:
        this.lastTargetNode.removeClass("wb-drop-target");
        this.lastTargetNode.removeClass("wb-drop-over");
      }
      this.lastTargetNode = null;
    }
    return true;
  }

  protected onDropEvent(e: DragEvent) {
    // const isLink = event.dataTransfer.types.includes("text/uri-list");
    const targetNode = Wunderbaum.getNode(e)!;
    const dndOpts = this.treeOpts.dnd;

    if (!targetNode) {
      return;
    }
    if (e.type !== "dragover") {
      this.tree.logDebug(
        "onDropEvent." + e.type + " targetNode: " + targetNode,
        e
      );
    }
    if (e.type === "dragenter") {
      if (this.lastTargetNode) {
        // `dragleave` is not reliable with event delegation.
        // We remove the marker on dragenter from the previous target:
        this.lastTargetNode.removeClass("wb-drop-target");
        this.lastTargetNode.removeClass("wb-drop-over");
      }
      this.lastTargetNode = targetNode;
      if (targetNode === this.srcNode) {
        e.dataTransfer!.dropEffect = "none";
        return true;
      }
      let res = targetNode.callEvent("dnd.dragEnter");
      if (!res) {
        return true; // do not cancel the event, so drop is not allowed
      }
      e.preventDefault(); // Allow drop (Drop operation is denied by default)
      targetNode.addClass("wb-drop-target");
      targetNode.addClass("wb-drop-over");
      // e.dataTransfer!.dropEffect = "copy";
      return false;
    } else if (e.type === "dragover") {
      return false;
      // e.preventDefault(); // Allow drop (Drop operation is denied by default)
      // e.dataTransfer!.dropEffect = "copy";
    } else if (e.type === "dragleave") {
      // NOTE: we cannot trust this event, since it is always fired?
      // Instead we remove the marker on dragenter
      // targetNode.removeClass("wb-drop-target");
      // targetNode.removeClass("wb-drop-over");
    } else if (e.type === "drop") {
      e.stopPropagation(); // prevent browser from opening links?
      targetNode.removeClass("wb-drop-target");
      targetNode.removeClass("wb-drop-over");
    }
  }
}
