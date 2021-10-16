/*!
 * Wunderbaum - ext-edit
 * Copyright (c) 2021, Martin Wendt. Released under the MIT license.
 * @VERSION, @DATE (https://github.com/mar10/wunderbaum)
 */

import { Wunderbaum } from "./wunderbaum";
// import { WunderbaumNode } from "./wb_node";
import { WunderbaumExtension } from "./wb_extension_base";
import { onEvent } from "./util";
import { debounce } from "./debounce";

// const START_MARKER = "\uFFF7";

export class EditExtension extends WunderbaumExtension {
  public queryInput?: HTMLInputElement;
  public lastFilterArgs: IArguments | null = null;
  protected debouncedOnChange: (e: Event) => void;

  constructor(tree: Wunderbaum) {
    super(tree, "edit", {
      // noData: true, // Display a 'no data' status node if result is empty
      debounce: 700,
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
        node: node,
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
}
