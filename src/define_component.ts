import { Wunderbaum } from "./wunderbaum";

function appendCssLink(url: string, shadowRoot?: ShadowRoot) {
  let link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", url);
  if (shadowRoot) {
    shadowRoot.appendChild(link);
  } else {
    document.head.appendChild(link);
  }
}

class WunderbaumComponent extends HTMLElement {
  // class WunderbaumTree extends HTMLDivElement {
  protected _tree?: Wunderbaum;
  protected _treeElement: HTMLDivElement;

  // fires when an instance of the element is created
  constructor() {
    // NOTE: We would rather derrive from HTMLDivElement instead of HTMLElement, like here:
    //   https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-customized-builtin-example
    // but that does not seem to work in Safari (`super()` fails).
    // So we use HTMLElement and add a div as child element.

    // establish prototype chain
    super();

    // attaches shadow tree and returns shadow root reference
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
    const shadowRoot = this.attachShadow({ mode: "open" });

    const url = new URL(import.meta.url);
    let parts = url.pathname.split("/");
    parts[parts.length - 1] = "wunderbaum.css";
    const path = parts.join("/");
    console.log(`Wunderbaum component using CSS path: ${path}`);

    if (this.hasAttribute("icon-css")) {
      appendCssLink(this.getAttribute("icon-css")!, shadowRoot);
    }
    appendCssLink(path, shadowRoot);

    // @import url("${path}");
    shadowRoot.appendChild(document.createElement("style")).textContent = ` 
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }`;

    this._treeElement = document.createElement("div");
    shadowRoot.appendChild(this._treeElement);
  }

  // fires after the element has been attached to the DOM
  connectedCallback() {
    this._tree = new Wunderbaum({
      id: this.getAttribute("id")!,
      element: this._treeElement,
      // element: this.shadowRoot,
      header: this.getAttribute("header"),
      selectMode: <any>this.getAttribute("selectMode") ?? "multi",
      source: this.getAttribute("source") ?? [],
      debugLevel: Number.parseInt(this.getAttribute("debugLevel") ?? "3"),
    });
  }
  // fires after the element has been removed from the DOM
  disconnectCallback() {
    this._tree?.destroy();
  }

  // return a Wunderbaum instance
  get tree(): Wunderbaum {
    if (!this._tree) {
      throw new Error("Wunderbaum instance not yet initialized.");
    }
    return this._tree;
  }

  // get header() {
  //   return this.tree!.he.title
  // }

  // get source() {
  //   return this.getAttribute("source") || "";
  // }

  get items() {
    return this.tree.toDictArray();
  }
}

export function defineWunderbaumComponent() {
  console.info("Registered Wunderbaum Web Component `<wunderbaum-tree>`.");
  // let the browser know about the custom element
  customElements.define("wunderbaum-tree", WunderbaumComponent);
  // customElements.define("wunderbaum-tree", WunderbaumComponent, { extends: "div"});
}
