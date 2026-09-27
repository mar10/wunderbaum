# Styling

!!! abstract "TL;DR"

    Common CSS classes allow custom styling and effects.

## Feature Classes

We can add special classes to the tree's `<div>` container in order to enable
custom behavior:

- `wb-alternate` <br>
  Render even and odd rows in alternating background shades.
- `wb-checkbox-auto-hide` <br>
  Apply CSS rules that hide unselected checkbox icons unless the mouse hovers
  over a row.
- `wb-fade-expander` <br>
  Apply CSS rules that show expander icons only while the mouse hovers over
  the tree.
- `wb-initializing` <br>
  This class is automatically _removed_ when the tree is fully initialized.
  Combining this class with other selectors allows to define CSS rules that only
  apply during initial loading. See also `wb-skeleton`.
- `wb-no-select` <br>
  Prevent text selection with the mouse (applies `user-select` CSS rule).
- `wb-rainbow` <br>
  Colorize distinct indentation levels.
- `wb-rtl` <br>
  Render the tree in right-to-left mode by flipping the behavior of `wb-helper-end`
  and `wb-helper-start` classes.

For example

```html
<div id="demo-tree" class="... wb-no-select wb-checkbox-auto-hide">...</div>
```

## Automatic Styles

These classes are automatically set on the tree's `<div>` container, depending
on the current mode, allowing for custom CSS rules:

- `wb-grid`
- `wb-fixed-col`
- `wb-cell-mode`

These classes are automatically set for distinct rows, allowing custom CSS rules:

- `wb-active`
- `wb-busy`
- `wb-error`
- `wb-invalid`
- `wb-loading`
- `wb-match`
- `wb-selected`
- `wb-skeleton` <br>
  Added to rows, when the _skeleton_ tree option is true.
  Applies CSS styles that render titles as glowing placeholders.
  (Typically combined with `wb-initializing`.)
- `wb-status-STATUS`, e.g. `wb-status-error`
- `wb-submatch`

These classes are automatically set for distinct column spans,
allowing custom CSS rules:

- `wb-active`
- `wb-busy`
- `wb-error`
- `wb-invalid`

```css
todo: example;
```

## Helper Classes

This classes can be added to column definitions in order to enable custom
formatting:

- `wb-helper-center` <br>
  Align cell content to the center.
- `wb-helper-disabled` <br>
  Apply disabled style to cell content, i.e. render in a dimmed color.
- `wb-helper-end` <br>
  Align cell content to the right (unless `wb-rtl` is set on the container).
- `wb-helper-hidden` <br>
  Hide element content.
- `wb-helper-invalid` <br>
  Apply _invalid_ style to cell content, i.e. render in red.
- `wb-helper-lazy-expander` <br>
  Can be used in iconMaps to make a font icon appear colored.
- `wb-helper-link` <br>
  Apply link style to cell content.
- `wb-helper-start` <br>
  Align cell content to the left (unless `wb-rtl` is set on the container).

## CSS Variables

Many CSS styles can be accessed and modified using JavaScript like so:

```js
document.body.style.setProperty("--wb-node-text-color", "#ff00ff");
document
  .querySelector("#tree")
  .style.setProperty("--wb-font-stack", "monospace");
```

See [`wunderbaum.scss`](https://github.com/mar10/wunderbaum/blob/main/src/wunderbaum.scss)
for a complete list of all availabe CSS variables.

A theme only needs to set the base colors. Derived colors (hover, active,
active cell, drop target, dimmed and grayscale variants, ...) are computed by
the browser from these base colors, where they are used (`color-mix()`).
This works on `:root` as well as on a single tree element, for example a dark
theme:

```css
div.wunderbaum.dark {
  --wb-node-text-color: #d4d4d4;
  --wb-border-color: #d4d4d4;
  --wb-background-color: #1e1e1e;
  --wb-alternate-row-color: #252526;
  --wb-header-color: #333333;
  --wb-bg-highlight-color: #3794ff;
  --wb-focus-border-color: #3794ff;
  --wb-error-color: #f48771;
  --wb-grid-color: #3c3c3c;
}
```

A derived color can still be set explicitly (e.g. `--wb-hover-color` or
`--wb-active-color`), which overrides the computed value.
Browsers without `color-mix()` support (before 2023) use static default colors
instead.

## CSS Hacks

!!! info "See also"

    See also the [Render Tutorial](tutorial_render.md?id=custom-markup)
    for details on the markup structure and used class names.

```css
div.wunderbaum {
  scroll-behavior: smooth;
}
```

```css
/* Show tree skeleton while initializing. */
div.wunderbaum.wb-skeleton.wb-initializing {
  background-position-y: 20px;
  background-image: url("skeleton-transp.png");
  background-repeat: no-repeat;
}
```

```css
* {
  padding: 0;
  margin: 0;
  /* prevent scrollbars, which would break `100vh` */
  overflow: hidden;
}
```

```css
div.wunderbaum:focus-visible {
  /* Suppress system focus outline. */
  outline-style: none;
}
```
