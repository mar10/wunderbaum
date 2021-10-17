/*!
 * Wunderbaum - ext-keynav
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import {
  NavigationMode,
  NavigationModeOption,
  TAG_NAME_ALLOWED_KEYS,
} from "./common";
import { eventToString } from "./util";
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumNode } from "./wb_node";
import { WunderbaumExtension } from "./wb_extension_base";

export class KeynavExtension extends WunderbaumExtension {
  constructor(tree: Wunderbaum) {
    super(tree, "keynav", {});
  }

  onKeyEvent(data: any): boolean | undefined {
    let event = data.event,
      eventName = eventToString(event),
      focusNode,
      node = data.node as WunderbaumNode,
      tree = this.tree,
      opts = data.options,
      handled = true,
      activate = !event.ctrlKey || opts.autoActivate;

    // Set focus to active (or first node) if no other node has the focus yet
    if (!node) {
      const activeNode = tree.getActiveNode();
      const firstNode = tree.getFirstChild();

      if (!activeNode && firstNode && eventName === "ArrowDown") {
        firstNode.logInfo("Keydown: activate first node.");
        firstNode.setActive();
        return;
      }

      focusNode = activeNode || firstNode;
      if (focusNode) {
        focusNode.setFocus();
        node = tree.getFocusNode()!;
        node.logInfo("Keydown: force focus on active node.");
      }
    }

    const navModeOption = opts.navigationMode;

    // If the event target is an input element or `contenteditable="true"`,
    // we ignore it as navigation command
    // const input =
    //   event.target && event.target.closest("input,[contenteditable]");
    // let tagName = input?.tagName;
    // tagName === "INPUT" ? (tagName += "." + input.type) : 0;
    // if (tagName && TAG_NAME_ALLOWED_KEYS[tagName].indexOf(eventName) === -1) {
    //   // E.g. inside a checkbox, still handle cursor keys, ...
    //   node.logDebug("onKeyEvent: ignored keystroke inside " + tagName);
    //   return;
    // }

    if (tree.navMode === NavigationMode.row) {
      // --- Quick-Search
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
          matchNode.setActive(true, { event: event });
        }
        event.preventDefault();
        return;
      }

      // Pre-Evaluate expand/collapse action for LEFT/RIGHT
      switch (eventName) {
        case "ArrowLeft":
          if (node.expanded) {
            eventName = "Subtract"; // collapse
          }
          break;
        case "ArrowRight":
          if (!node.expanded && (node.children || node.lazy)) {
            eventName = "Add"; // expand
          } else if (navModeOption === NavigationModeOption.startRow) {
            tree.setCellMode(NavigationMode.cellNav);
            return;
          }
          break;
      }

      // Standard navigation (row mode)
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
          if (node.getOption("checkbox")) {
            node.setSelected(!node.isSelected());
          } else {
            node.setActive(true, { event: event });
          }
          break;
        case "Enter":
          node.setActive(true, { event: event });
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
          node.navigate(eventName, { activate: activate, event: event });
          break;
        default:
          handled = false;
      }
    } else {
      // Standard navigation (cell mode)
      switch (eventName) {
        case " ":
          if (tree.activeColIdx === 0 && node.getOption("checkbox")) {
            node.setSelected(!node.isSelected());
            handled = true;
          } else {
            // [Space] key should trigger embedded checkbox
            const elem = tree.getActiveColElem();
            const cb = elem?.querySelector("input[type=checkbox]") as HTMLInputElement;
            cb?.click();
          }
          break;
        case "Enter":
          if (tree.activeColIdx === 0 && node.isExpandable()) {
            node.setExpanded(!node.isExpanded());
            handled = true;
          }
          break;
        case "Escape":
          if (tree.navMode === NavigationMode.cellEdit) {
            tree.setCellMode(NavigationMode.cellNav);
            handled = true;
          } else if (tree.navMode === NavigationMode.cellNav) {
            tree.setCellMode(NavigationMode.row);
            handled = true;
          }
          break;
        case "ArrowLeft":
          if (tree.activeColIdx > 0) {
            tree.setColumn(tree.activeColIdx - 1);
            handled = true;
          } else if (navModeOption !== NavigationModeOption.cell) {
            tree.setCellMode(NavigationMode.row);
            handled = true;
          }
          break;
        case "ArrowRight":
          if (tree.activeColIdx < tree.columns.length - 1) {
            tree.setColumn(tree.activeColIdx + 1);
            handled = true;
          }
          break;
        case "ArrowDown":
        case "ArrowUp":
        case "Backspace":
        case "End":
        case "Home":
        case "Control+End":
        case "Control+Home":
        case "PageDown":
        case "PageUp":
          node.navigate(eventName, { activate: activate, event: event });
          break;
        default:
          handled = false;
      }
    }



    if (handled) {
      event.preventDefault();
    }
    return;
  }
}
