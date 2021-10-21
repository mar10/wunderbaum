/*!
 * Wunderbaum - ext-edit
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { Wunderbaum } from "./wunderbaum";
import { WunderbaumExtension } from "./wb_extension_base";
import { escapeHtml, onEvent } from "./util";
import { debounce } from "./debounce";
import { WunderbaumNode } from "./wb_node";

// const START_MARKER = "\uFFF7";

export class EditExtension extends WunderbaumExtension {
  public queryInput?: HTMLInputElement;
  public lastFilterArgs: IArguments | null = null;
  protected debouncedOnChange: (e: Event) => void;

  constructor(tree: Wunderbaum) {
    super(tree, "edit", {
      debounce: 700,
      // --- Events ---
      //
      startEdit: null,
    });

    this.debouncedOnChange = debounce(
      this._onChange.bind(this),
      this.getOption("edit.debounce")
    );
  }

  protected _onChange(e: Event) {
    let res;
    const info = Wunderbaum.getEventInfo(e);
    const node = info.node!;
    const colElem = <HTMLElement>info.colElem!;

    this.tree.log("_onChange", e, info);

    colElem.classList.add("wb-dirty");
    colElem.classList.remove("wb-error");
    try {
      res = node._callEvent("change", {
        // node: node,
        info: info,
        event: e,
        inputElem: e.target,
        inputValue: Wunderbaum.util.getValueFromElem(e.target as HTMLElement),
      });
    } catch (err) {
      colElem.classList.add("wb-error");
      colElem.classList.remove("wb-dirty");
    }
    // Convert scalar return value to a promise
    if (!(res instanceof Promise)) {
      res = Promise.resolve(res);
    }
    res
      .then((value) => {})
      .catch((err) => {
        colElem.classList.add("wb-error");
      })
      .finally(() => {
        colElem.classList.remove("wb-dirty");
      });
  }

  // handleKey(e:KeyboardEvent):boolean {
  //   if(this.tree.cellNavMode )
  // }

  init() {
    super.init();

    onEvent(
      this.tree.element,
      "change input",
      ".contenteditable,input,textarea,select",
      (e) => {
        // TODO: set cell 'dirty'
        // return false;
        this.debouncedOnChange(e);
      }
    );
  }

  startEdit(node?: WunderbaumNode | null) {
    let res;

    node = node ?? this.tree.getActiveNode();
    if (!node) {
      return;
    }
    let inputHtml = node._callEvent("edit.beforeEdit");
    if (inputHtml === false) {
      return;
    }
    if (!inputHtml) {
      const title = escapeHtml(node.title);
      inputHtml = `<input type=text class="wb-input-edit" value="${title}" required>`;
    }
    const titleElem = node
      .getColElem(0)!
      .querySelector(".wb-title") as HTMLSpanElement;

    titleElem.innerHTML = inputHtml;
    (<HTMLElement>titleElem.firstElementChild!).focus();
    res = node._callEvent("edit.edit", {
      titleElem: titleElem,
    });
  }

  stopEdit() {}
}
