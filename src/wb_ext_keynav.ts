/*!
 * Wunderbaum - ext-keynav
 * Copyright (c) 2021-2022, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import {
  // NAVIGATE_IN_INPUT_KEYS,
  NavigationMode,
  NavigationModeOption,
} from "./common";
import { eventToString } from "./util";
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumNode } from "./wb_node";
import { WunderbaumExtension } from "./wb_extension_base";

export class KeynavExtension extends WunderbaumExtension {
  constructor(tree: Wunderbaum) {
    super(tree, "keynav", {});
  }

  protected _getEmbeddedInputElem(
    elem: any,
    setFocus = false
  ): HTMLInputElement | null {
    let input = null;

    if (elem && elem.type != null) {
      input = elem;
    } else {
      // ,[contenteditable]
      const ace = this.tree.getActiveColElem()?.querySelector("input,select");
      if (ace) {
        input = ace as HTMLInputElement;
      }
    }
    if (setFocus && input) {
      this.tree.log("focus", input);
      input.focus();
    }
    return input;
  }

  onKeyEvent(data: any): boolean | undefined {
    const event = data.event,
      tree = this.tree,
      opts = data.options,
      activate = !event.ctrlKey || opts.autoActivate,
      curInput = this._getEmbeddedInputElem(event.target),
      navModeOption = opts.navigationMode as NavigationModeOption,
      isCellEditMode = tree.navMode === NavigationMode.cellEdit;

    let focusNode,
      eventName = eventToString(event),
      node = data.node as WunderbaumNode,
      handled = true;

    tree.log(`onKeyEvent: ${eventName}, curInput`, curInput);
    if (!tree.isEnabled()) {
      // tree.logDebug(`onKeyEvent ignored for disabled tree: ${eventName}`);
      return false;
    }

    // Let callback prevent default processing
    if (tree._callEvent("keydown", data) === false) {
      return false;
    }

    // Let ext-edit trigger editing
    if (tree._callMethod("edit._preprocessKeyEvent", data) === false) {
      return false;
    }

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

    if (tree.navMode === NavigationMode.row) {
      // -----------------------------------------------------------------------
      // --- Row Mode ---
      // -----------------------------------------------------------------------
      // --- Quick-Search
      if (
        opts.quicksearch &&
        eventName.length === 1 &&
        /^\w$/.test(eventName) &&
        !curInput
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
            tree.setNavigationMode(NavigationMode.cellNav);
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
        case "Meta+ArrowDown":
        case "Meta+ArrowUp":
        case "PageDown":
        case "PageUp":
          node.navigate(eventName, { activate: activate, event: event });
          break;
        default:
          handled = false;
      }
    } else {
      // -----------------------------------------------------------------------
      // --- Cell Mode ---
      // -----------------------------------------------------------------------
      // // Standard navigation (cell mode)
      // if (isCellEditMode && NAVIGATE_IN_INPUT_KEYS.has(eventName)) {
      // }
      if (eventName === "Tab") {
        eventName = "ArrowRight";
      } else if (eventName === "Shift+Tab") {
        eventName = tree.activeColIdx > 0 ? "ArrowLeft" : "";
      }
      switch (eventName) {
        case " ":
          if (tree.activeColIdx === 0 && node.getOption("checkbox")) {
            node.setSelected(!node.isSelected());
            handled = true;
          } else {
            // [Space] key should trigger embedded checkbox
            const elem = tree.getActiveColElem();
            const cb = elem?.querySelector(
              "input[type=checkbox]"
            ) as HTMLInputElement;
            cb?.click();
          }
          break;
        case "Enter":
          if (tree.activeColIdx === 0 && node.isExpandable()) {
            node.setExpanded(!node.isExpanded());
            handled = true;
          } else if (
            !isCellEditMode &&
            (navModeOption === NavigationModeOption.startCell ||
              navModeOption === NavigationModeOption.startRow)
          ) {
            tree.setNavigationMode(NavigationMode.cellEdit);
            this._getEmbeddedInputElem(null, true); // set focus to input
            handled = true;
          }
          break;
        case "Escape":
          if (tree.navMode === NavigationMode.cellEdit) {
            tree.setNavigationMode(NavigationMode.cellNav);
            handled = true;
          } else if (
            tree.navMode === NavigationMode.cellNav &&
            navModeOption !== NavigationModeOption.cell
          ) {
            tree.setNavigationMode(NavigationMode.row);
            handled = true;
          }
          break;
        case "ArrowLeft":
          if (tree.activeColIdx > 0) {
            tree.setColumn(tree.activeColIdx - 1);
            if (isCellEditMode) {
              this._getEmbeddedInputElem(null, true); // set focus to input
            }
            handled = true;
          } else if (navModeOption !== NavigationModeOption.cell) {
            tree.setNavigationMode(NavigationMode.row);
            handled = true;
          }
          break;
        case "ArrowRight":
          if (tree.activeColIdx < tree.columns.length - 1) {
            tree.setColumn(tree.activeColIdx + 1);
            if (isCellEditMode) {
              this._getEmbeddedInputElem(null, true); // set focus to input
            }
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
        case "Meta+ArrowDown":
        case "Meta+ArrowUp":
        case "PageDown":
        case "PageUp":
          node.navigate(eventName, { activate: activate, event: event });
          if (isCellEditMode) {
            this._getEmbeddedInputElem(null, true); // set focus to input
          }
          handled = true;
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
