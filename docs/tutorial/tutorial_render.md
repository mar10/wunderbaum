# Custom Rendering

!!! abstract "TL;DR"

    Wunderbaum is rendered as nested `<div>`/`<span>` element structure.
    It can be customized by applying CSS styles. <br>
    Node icons are created from customizable icon fonts.

This chapter describes different ways to customize the appearance of the tree.

!!! info "See also"

    See also the [Grid Tutorial](tutorial_grid.md) for rendering of
    grid cell content and [Edit Tutorial](tutorial_grid.md) for rendering
    embedded input controls in grid cells.

## Custom Style Sheets

It is possible to customize the appearance of the tree by adding specific CSS rules.

For example, to change the background color of the active grid cell:

```css
div.wunderbaum.wb-grid.wb-cell-mode div.wb-row.wb-active span.wb-col.wb-active {
  /* Highlighted cell in cell-nav mode */
}
```

!!! info "See also"

    See the [Styling Tutorial](tutorial_styling.md) for details.

## Custom Icons

This example uses [Font Awesome Icons](https://fontawesome.com/icons) instead
of the default [Bootstrap Icons](https://icons.getbootstrap.com/) icon font:

```html
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
    />
    ...
  </head>
</html>
```

```js
const tree = new mar10.Wunderbaum({
  element: document.getElementById("demo-tree"),
  source: "get/root/nodes",
  iconMap: "fontawesome6",  // <-- use Font Awesome Icons
  ...
});
```

`iconMap` can also be a custom map of icon names, for example:

```js
const tree = new mar10.Wunderbaum({
  ...
  iconMap: {
    error: "bi bi-exclamation-triangle",
    loading: "bi bi-chevron-right wb-busy",
    noData: "bi bi-question-circle",
    expanderExpanded: "bi bi-chevron-down",
    expanderCollapsed: "bi bi-chevron-right",
    expanderLazy: "bi bi-chevron-right wb-helper-lazy-expander",
    checkChecked: "bi bi-check-square",
    checkUnchecked: "bi bi-square",
    checkUnknown: "bi bi-dash-square-dotted",
    radioChecked: "bi bi-circle-fill",
    radioUnchecked: "bi bi-circle",
    radioUnknown: "bi bi-record-circle",
    folder: "bi bi-folder2",
    folderOpen: "bi bi-folder2-open",
    folderLazy: "bi bi-folder-symlink",
    doc: "bi bi-file-earmark",
    colSortable: "bi bi-arrow-down-up",
    colSortAsc: "bi bi-arrow-down",
    colSortDesc: "bi bi-arrow-up",
    colFilter: "bi bi-filter",
    colFilterActive: "bi bi-filter-square-fill",
    colMenu: "bi bi-three-dots-vertical",
   },
  ...
});
```

If we want to only override some default icons, this pattern can be used:

```js
const tree = new mar10.Wunderbaum({
  ...
  iconMap: Object.assign(
    Wunderbaum.iconMaps["bootstrap"],
    {
      folder: "bi bi-file-earmark",
    },
  ),
});
```

If the icon definition contains html markup (i.e. contains a `<` character),
the icon is rendered as HTML, otherwise it is rendered as a CSS class.

```js
const tree = new mar10.Wunderbaum({
  ...
  iconMap: {
    folder: "<span>😍</span>",
  },
});
```

## Custom Markup

### Using the `render` Event

The `render(e)` event is called for each node that needs to be rendered, i.e. that
is materialized in the viewport.
It is called after the node's row markup has been created, for example:

```html
<div class="wb-row" style="top: 22px;">
  <span class="wb-node wb-col wb-active" style="left: 0px; width: 1368px;">
    <i class="wb-indent"></i>
    <i class="wb-expander wb-indent"></i>
    <i class="wb-icon bi bi-file-earmark"></i>
    <span class="wb-title" style="width: 1301px;">Node 1.1</span>
  </span>
</div>
```

For treegrids with multiple columns, the row markup looks like this:

```html
<div class="wb-row wb-active wb-focus" style="top: 66px;">
  <span
    class="wb-node wb-col wb-active"
    draggable="true"
    style="left: 0px; width: 250px;"
  >
    <i class="wb-checkbox bi bi-square"></i>
    <i class="wb-indent"></i>
    <i class="wb-expander wb-indent"></i>
    <i class="wb-icon bi bi-file-earmark"></i>
    <span class="wb-title" style="width: 163px;">The Little Prince</span>
  </span>
  <span class="wb-col" style="left: 250px; width: 234.75px;">
    Antoine de Saint-Exupery
  </span>
  <span class="wb-col" style="left: 484.75px; width: 50px;">1943</span>
  <span class="wb-col" style="left: 534.75px; width: 50px;">2946</span>
  <span class="wb-col" style="left: 584.75px; width: 80px;">6.82</span>
  <span class="wb-col" style="left: 664.75px; width: 703.25px;"></span>
</div>
```

The `e.nodeElem` property contains the HTML span element that represents the
node title, and prefix icons:
`<span class="wb-node wb-col"> ... </span>`

!!! info

    See [WbRenderEventType](https://mar10.github.io/wunderbaum/api/interfaces/types.WbRenderEventType.html)
    for an overview of all event properties.

```js
const tree = new Wunderbaum({
  ...
  render: function (e) {
    const node = e.node;
    const nodeElement = e.nodeElement; // HTMLSpanElement

    console.log(e.type, e.isNew, e);
    nodeElement.innerText = `${node.title}!`;
  },
});
```

!!! info

    The render event is especially useful to render the content of grid cells
    in treegrids. See also the [Grid Tutorial](tutorial_grid.md)
    and the [Edit Tutorial](tutorial_edit.md) for rendering of embedded
    input controls in grids.

### Badges

Badges are small icons that can be displayed near the node title. <br>
Example: Display the number of selected subnodes in the badge of collapsed parent:

```js
const tree = new Wunderbaum({
  ...
  iconBadge: (e) => {
    const node = e.node;
    if (node.expanded || !node.children) {
      return;
    }
    const count = node.children && node.getSelectedNodes().length;
    return {
      badge: count,
      badgeTooltip: `${count} selected`,
      badgeClass: "selection-count",
    };
  },
  ...
});
```

```css
div.wunderbaum span.wb-badge.selection-count {
  color: white;
  background-color: green;
}
```

You can also use e.g. "data" to control the badge and display an image instead of text.

```js
const tree = new Wunderbaum({
  ...
  iconBadge: (e) => {
    if (e.node.data.badgeIcon) {
      return {
        badge: "",
        badgeClass: "wb-my-special-icon-" + e.node.data.badgeIcon
      };
    }
  },
  ...
});
```

```css
span.wb-my-special-icon-alert {
  background-color: white !important;
  background-image: url("img/alert.svg");
  width: 12px;
  height: 12px;
}
```

!!! info "See also"

    See also [WbIconBadgeEventType](https://mar10.github.io/wunderbaum/api/interfaces/types.WbIconBadgeEventType.html)
    and [WbIconBadgeEventResultType](https://mar10.github.io/wunderbaum/api/interfaces/types.WbIconBadgeEventResultType.html).

<!-- ### Related Tree Options

### Related Methods

- `util.toggleCheckbox()`

### Related CSS Rules

### Code Hacks

#### Custom badge content

If needed, you can use completely custom elements like this:

```js
const tree = new Wunderbaum({
  ...
  iconBadge: (e) => {
    if (e.node.data.badgeIconPath) {
      const badgeSpan = document.createElement("span");
      badgeSpan.className = "tree-badge-icon";
      const badgeImg = document.createElement("img");
      badgeImg.src = e.node.data.badgeIconPath;
      badgeSpan.appendChild(badgeImg);
      return badgeSpan;
    }
  },
  ...
});
```

```css
div.wunderbaum span.tree-badge-icon {
  position: absolute;
  display: inline-block;
  top: 0;
  left: -0.6rem;
  padding: 0.2em 0.3rem 0.1em 0.3rem;
  font-size: 60%;
  font-weight: 200;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  border-radius: 0.5rem;
  pointer-events: none;
}

div.wunderbaum span.tree-badge-icon img {
  width: 12px;
  height: 12px;
}
```
