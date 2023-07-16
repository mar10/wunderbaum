# Advanced Topics

?> See also the [General Overview](/tutorial/overview.md).

## Iteration

There are two ways to traverse the tree _depth-first, pre-order_

```js
for(const node of tree) {
  ...
}
```

```js
tree.visit((node) => {
  ...
});
```

(Also available as {@link WunderbaumNode} methods.)

Both are 'fast enough' for most use cases, but the latter is slightly faster.
{@link Wunderbaum.visit} also allows to break or skip nodes by returning a
special value.

## User Input

## Markup and CSS Styles

### Feature Classes

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

For example

```html
<div id="demo-tree" class="... wb-no-select wb-checkbox-auto-hide">
  ...
</div>
```

### Custom Styles

These classes are automatically set the tree's `<div>` container, depending on 
the current mode, allowing for custom CSS rules:

- `wb-grid`
- `wb-fixed-col`
- `wb-cell-mode`

These classes are automatically set for distinct rows, allowing custom CSS rules:

- `wb-active`
- `wb-selected`
- `wb-busy`
- `wb-error`
- `wb-loading`
- `wb-skeleton` <br>
  Added to rows, when the _skeleton_ tree option is true.
  Applies CSS styles that render titles as glowing placeholders.
  (Typically combined with `wb-initializing`.)
- `wb-status-STATUS`, e.g. `wb-status-error`

```css
TODO: example
```

### CSS Variables

Many CSS styles can be accessed and modified using JavaScript like so:

```js
document.body.style.setProperty("--wb-node-text-color", "#ff00ff");
document.querySelector("#tree").style.setProperty("--wb-font-stack", "monospace");
```

See [`wunderbaum.scss`](https://github.com/mar10/wunderbaum/blob/main/src/wunderbaum.scss) 
for a complete list of all availabe CSS variables.

### CSS Hacks

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
