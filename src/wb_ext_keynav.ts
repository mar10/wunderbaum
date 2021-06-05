/*!
 * Wunderbaum - ext-keynav
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { NavigationMode, WunderbaumExtension } from "./common";
import { eventToString } from "./util";
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumNode } from "./wb_node";

export class KeynavExtension extends WunderbaumExtension {
  name = "keynav";

  constructor(tree: Wunderbaum) {
    super(tree);
  }

  onKeyEvent(data: any): boolean | undefined {
    let event = data.event,
      eventName = eventToString(event),
      focusNode,
      node = data.node as WunderbaumNode,
      tree = this.tree,
      opts = data.options,
      handled = true,
      activate = !(event.ctrlKey || !opts.autoActivate);

    // Set focus to active (or first node) if no other node has the focus yet
    if (!node) {
      focusNode = tree.getActiveNode() || tree.getFirstChild();
      if (focusNode) {
        focusNode.setFocus();
        node = tree.getFocusNode()!;
        node.logDebug("Keydown force focus on active node");
      }
    }

    if (
      opts.quicksearch &&
      eventName.length === 1 &&
      /^\w$/.test(eventName)
      // && !$target.is(":input:enabled")
    ) {
      // Allow to search for longer streaks if typed in quickly
      const stamp = Date.now();
      if (stamp - tree.lastQuicksearchTime > 500) {
        tree.lastQuicksearchTerm = "";
      }
      tree.lastQuicksearchTime = stamp;
      tree.lastQuicksearchTerm += eventName;
      let matchNode = tree.findNextNode(
        tree.lastQuicksearchTerm,
        tree.getActiveNode()
      );
      if (matchNode) {
        matchNode.setActive();
      }
      event.preventDefault();
      return;
    }

    // if (tree.cellNavMode) {
    // }

    const navMode = opts.navigationMode;

    // Pre-Evaluate expand/collapse action for LEFT/RIGHT
    switch (eventName) {
      case "ArrowLeft":
        if (tree.cellNavMode) {
          if (tree.activeColIdx > 0) {
            tree.setColumn(tree.activeColIdx - 1);
            return;
          } else if (navMode !== NavigationMode.force) {
            tree.setCellMode(false);
            return;
          }
        } else if (node.expanded) {
          eventName = "Subtract"; // collapse
        }
        break;
      case "ArrowRight":
        if (tree.cellNavMode) {
          if (tree.activeColIdx < tree.columns.length - 1) {
            tree.setColumn(tree.activeColIdx + 1);
          }
          return;
        } else if (!node.expanded && (node.children || node.lazy)) {
          eventName = "Add"; // expand
        } else if (navMode === NavigationMode.allow) {
          tree.setCellMode(true);
          return;
        }
        break;
      case "Enter":
        if (
          tree.cellNavMode &&
          tree.activeColIdx === 0 &&
          node.isExpandable()
        ) {
          node.setExpanded(!node.isExpanded());
          return;
        }
        break;
      case "Escape":
        if (tree.cellNavMode) {
          tree.setCellMode(false);
          return;
        }
        break;
      // case "firstCol":
      // case "lastCol":
      //   node.logWarning("navigate(" + where + ") is not yet implemented");
      //   break;
    }

    // Standard navigation
    switch (eventName) {
      case "+":
      case "Add":
        // case "=": // 187: '+' @ Chrome, Safari
        node.setExpanded(true);
        break;
      case "-":
      case "Subtract":
        node.setExpanded(false);
        break;
      case " ":
        // if (node.isPagingNode()) {
        //   tree._triggerNodeEvent("clickPaging", ctx, event);
        // } else
        if (
          true
          // evalOption("checkbox", node, node, opts, false)
        ) {
          node.setSelected(!node.isSelected());
        } else {
          node.setActive();
        }
        break;
      case "Enter":
        node.setActive(true);
        break;
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "Backspace":
      case "End":
      case "Home":
      case "Control+End":
      case "Control+Home":
      case "PageDown":
      case "PageUp":
        node.navigate(eventName, activate);
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
    }
    return;
  }
}
