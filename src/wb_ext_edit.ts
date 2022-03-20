/*!
 * Wunderbaum - ext-edit
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { Wunderbaum } from "./wunderbaum";
import { WunderbaumExtension } from "./wb_extension_base";
import {
  escapeHtml,
  eventToString,
  getValueFromElem,
  isMac,
  onEvent,
} from "./util";
import { debounce } from "./debounce";
import { WunderbaumNode } from "./wb_node";
import { NavigationMode } from "./common";

// const START_MARKER = "\uFFF7";

export class EditExtension extends WunderbaumExtension {
  protected debouncedOnChange: (e: Event) => void;
  protected curEditNode: WunderbaumNode | null = null;

  constructor(tree: Wunderbaum) {
    super(tree, "edit", {
      debounce: 100,
      minlength: 1,
      maxlength: null,
      trigger: ["F2", "macEnter", "clickActive"],
      trim: true,
      select: true,
      validity: true, //"Please enter a title",
      // --- Events ---
      // (note: there is also the `tree.change` event.)
      beforeEdit: null,
      edit: null,
      apply: null,
    });

    this.debouncedOnChange = debounce(
      this._onChange.bind(this),
      this.getPluginOption("debounce")
    );
  }

  /*
   * Call an event handler, while marking the current node cell 'dirty'.
   */
  protected _applyChange(
    eventName: string,
    node: WunderbaumNode,
    colElem: HTMLElement,
    extra: any
  ): Promise<any> {
    let res;

    node.log(`_applyChange(${eventName})`, extra);

    colElem.classList.add("wb-dirty");
    colElem.classList.remove("wb-error");
    try {
      res = node._callEvent(eventName, extra);
    } catch (err) {
      node.logError(`Error in ${eventName} event handler`, err);
      colElem.classList.add("wb-error");
      colElem.classList.remove("wb-dirty");
    }
    // Convert scalar return value to a resolved promise
    if (!(res instanceof Promise)) {
      res = Promise.resolve(res);
    }
    res
      .catch((err) => {
        node.logError(`Error in ${eventName} event promise`, err);
        colElem.classList.add("wb-error");
      })
      .finally(() => {
        colElem.classList.remove("wb-dirty");
      });
    return res;
  }

  /*
   * Called for when a control that is embedded in a cell fires a `change` event.
   */
  protected _onChange(e: Event) {
    // let res;
    const info = Wunderbaum.getEventInfo(e);
    const node = info.node!;
    const colElem = <HTMLElement>info.colElem!;
    if (!node || info.colIdx === 0) {
      this.tree.log("Ignored change event for removed element or node title");
      return;
    }
    this._applyChange("change", node, colElem, {
      info: info,
      event: e,
      inputElem: e.target,
      inputValue: Wunderbaum.util.getValueFromElem(e.target as HTMLElement),
    });
  }

  // handleKey(e:KeyboardEvent):boolean {
  //   if(this.tree.cellNavMode )
  // }

  init() {
    super.init();

    onEvent(
      this.tree.element,
      "change", //"change input",
      ".contenteditable,input,textarea,select",
      (e) => {
        this.debouncedOnChange(e);
      }
    );
  }

  /* Called by ext_keynav to pre-process input. */
  _preprocessKeyEvent(data: any): boolean | undefined {
    const event = data.event;
    const eventName = eventToString(event);
    const tree = this.tree;
    const trigger = this.getPluginOption("trigger");
    const inputElem =
      event.target && event.target.closest("input,[contenteditable]");
    // let handled = true;

    tree.logDebug(`_preprocessKeyEvent: ${eventName}`);

    // --- Title editing: apply/discard ---
    if (inputElem) {
      //this.isEditingTitle()) {
      switch (eventName) {
        case "Enter":
          this.stopEditTitle(true);
          return false;
        case "Escape":
          this.stopEditTitle(false);
          return false;
      }
      // If the event target is an input element or `contenteditable="true"`,
      // we ignore it as navigation command
      return false;
    }
    // ---
    // if (inputElem) {
    //   // If the event target is an input element or `contenteditable="true"`,
    //   // we ignore it as navigation command
    //   return false;
    // }
    // --- Trigger title editing
    if (tree.navMode === NavigationMode.row || tree.activeColIdx === 0) {
      switch (eventName) {
        case "Enter":
          if (trigger.indexOf("macEnter") >= 0 && isMac) {
            this.startEditTitle();
            return false;
          }
          break;
        case "F2":
          if (trigger.indexOf("F2") >= 0) {
            // tree.setCellMode(NavigationMode.cellEdit);
            this.startEditTitle();
            return false;
          }
          break;
      }
      return true;
    }

    // switch (eventName) {
    //   case "ArrowDown":
    //   case "ArrowUp":
    //     return true;
    //   case "Enter":
    //     if (trigger.indexOf("macEnter") >= 0 && isMac) {
    //       this.startEditTitle();
    //     } else {
    //       this.stopEditTitle(true);
    //     }
    //     break;
    //   case "F2":
    //     if (trigger.indexOf("F2") >= 0) {
    //       tree.setCellMode(NavigationMode.cellEdit);
    //       this.startEditTitle();
    //     }
    //     break;
    //   case "Escape":
    //     this.stopEditTitle(false);
    //     break;
    //   default:
    //     handled = false;
    //     break;
    // }
    // if (handled) {
    //   event.preventDefault();
    // }
    return true; //
  }

  /** Return true if a title is currently being edited. */
  isEditingTitle() {
    return !!this.curEditNode;
  }

  /** Start renaming, i.e. replace the title with an embedded `<input>`. */
  startEditTitle(node?: WunderbaumNode | null) {
    node = node ?? this.tree.getActiveNode();
    const validity = this.getPluginOption("validity");
    const select = this.getPluginOption("select");

    if (!node) {
      return;
    }
    this.tree.logDebug(`startEditTitle(node=${node})`);
    let inputHtml = node._callEvent("edit.beforeEdit");
    if (inputHtml === false) {
      node.logInfo("beforeEdit canceled operation.");
      return;
    }
    // `beforeEdit(e)` may return an input HTML string. Otherwise use a default:
    if (!inputHtml) {
      const title = escapeHtml(node.title);
      inputHtml = `<input type=text class="wb-input-edit" value="${title}" required autocorrect=off>`;
    }
    const titleSpan = node
      .getColElem(0)!
      .querySelector(".wb-title") as HTMLSpanElement;

    titleSpan.innerHTML = inputHtml;
    const inputElem = titleSpan.firstElementChild as HTMLInputElement;
    if (validity) {
      // Permanently apply  input validations (CSS and tooltip)
      inputElem.addEventListener("keydown", (e) => {
        if (!inputElem.reportValidity()) {
          // node?.logInfo(`Invalid: '${}'")
        }
      });
    }
    inputElem.focus();
    if (select) {
      inputElem.select();
    }

    this.curEditNode = node;
    node._callEvent("edit.edit", {
      inputElem: inputElem,
    });
  }
  /**
   *
   * @param apply
   * @param canKeepOpen
   * @returns
   */
  stopEditTitle(apply: boolean, canKeepOpen: boolean = true) {
    const focusElem = document.activeElement as HTMLInputElement;
    let newValue = focusElem ? getValueFromElem(focusElem) : null;
    const node = this.curEditNode;

    if (newValue && this.getPluginOption("trim")) {
      newValue = newValue.trim();
    }
    if (!node) {
      this.tree.logDebug("stopEditTitle: not in edit mode.");
      return;
    }
    node.logDebug(
      `stopEditTitle(${apply}, ${canKeepOpen})`,
      focusElem,
      newValue,
      node
    );

    // const node = Wunderbaum.getNode(focusElem)!;
    // assert(node === this.curEditNode);
    // const inputElem = this.curEditNode
    //   .getColElem(0)!
    //   .querySelector(".wb-title input") as HTMLInputElement;

    if (apply && newValue !== null && newValue !== node.title) {
      const colElem = node.getColElem(0)!;

      this._applyChange("edit.apply", node, colElem, {
        oldValue: node.title,
        newValue: newValue,
        inputElem: focusElem,
      })
        .then((value) => {
          node?.setTitle(newValue);
          // Discard the embedded `<input>`
          if (canKeepOpen && value === false) {
            return;
          }
          this.curEditNode!.render();
          this.tree.setFocus();
        })
        .finally(() => {
          // this.curEditNode!.render();
          this.curEditNode = null;
        });
      // Trigger 'change' event for embedded `<input>`
      // focusElem.blur();
    } else {
      // Discard the embedded `<input>`
      this.curEditNode!.render();
      this.curEditNode = null;
      // We discarded the <input>, so we have to acquire keyboard focus again
      this.tree.setFocus();
    }
  }
}
