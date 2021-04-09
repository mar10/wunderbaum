/*!
 * Wunderbaum - keynav
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { evalOption, WunderbaumExtension } from "./common";
import { eventToString } from "./util";
import { Wunderbaum } from "./wunderbaum";
import { WunderbaumNode } from "./wb_node";

export class KeynavExtension extends WunderbaumExtension {
  name = "keynav";

  constructor(tree: Wunderbaum) {
    super(tree);
  }

  onKeyEvent(data: any): boolean | undefined {
    let event = data.event;
    let eventName = eventToString(event);
    // let et = this.tree.getEventTarget(event);

    // TODO: return promise?
    let focusNode,
      node = <WunderbaumNode>data.node,
      tree = this.tree,
      opts = data.options,
      // which = event.which,
      // #909: Use event.key, to get unicode characters.
      // We can't use `/\w/.test(key)`, because that would
      // only detect plain ascii alpha-numerics. But we still need
      // to ignore modifier-only, whitespace, cursor-keys, etc.
      // key = event.key, // || String.fromCharCode(which),
      // specialModifiers = !!(
      //   event.altKey || event.ctrlKey || event.metaKey
      // ),
      // isAlnum =
      //   !MODIFIERS[which] &&
      //   !SPECIAL_KEYCODES[which] &&
      //   !specialModifiers,
      // $target = $(event.target),
      handled = true,
      activate = !(event.ctrlKey || !opts.autoActivate);

    // (node || FT).debug("ftnode.nodeKeydown(" + event.type + "): ftnode:" + this + ", charCode:" + event.charCode + ", keyCode: " + event.keyCode + ", which: " + event.which);
    // FT.debug( "eventToString(): " + FT.eventToString(event) + ", key='" + key + "', isAlnum: " + isAlnum );

    // Set focus to active (or first node) if no other node has the focus yet
    if (!node) {
      focusNode = tree.getActiveNode() || tree.getFirstChild();
      if (focusNode) {
        focusNode.setFocus();
        node = tree.getFocusNode()!;
        node.logDebug("Keydown force focus on active node");
      }
    }

    // if (
    //   opts.quicksearch &&
    //   isAlnum &&
    //   !$target.is(":input:enabled")
    // ) {
    //   // Allow to search for longer streaks if typed in quickly
    //   stamp = Date.now();
    //   if (stamp - tree.lastQuicksearchTime > 500) {
    //     tree.lastQuicksearchTerm = "";
    //   }
    //   tree.lastQuicksearchTime = stamp;
    //   tree.lastQuicksearchTerm += key;
    //   // tree.debug("quicksearch find", tree.lastQuicksearchTerm);
    //   matchNode = tree.findNextNode(
    //     tree.lastQuicksearchTerm,
    //     tree.getActiveNode()
    //   );
    //   if (matchNode) {
    //     matchNode.setActive();
    //   }
    //   event.preventDefault();
    //   return;
    // }
    switch (eventName) {
      // switch (eventToString(event)) {
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
