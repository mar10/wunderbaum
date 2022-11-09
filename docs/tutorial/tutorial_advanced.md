# Advanced Topics

?> See also the [General Overview](/tutorial/overview.md).

## Iteration

There are two ways to traverse the tree *depth-first, pre-order*

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

These classes can be set on the tree's `<div>` container to enable custom 
behavior:

- `wb-alternate` <br>
  Render even and odd rows in alternating background shades. 
- `wb-checkbox-auto-hide` <br>
  Apply CSS rules that hide unselected checkbox icons unless the mouse hovers 
  over a row.
- `wb-fade-expander` <br>
  Apply CSS rules that show expander icons only while the mouse hovers over 
  the tree.
- `wb-initializing` <br>
  This class is automatically *removed* when the tree is fully initialized.
  Combining this class with other selectors allows to define CSS rules that only 
  apply during initial loading. See also `wb-skeleton`.
- `wb-no-select` <br>
  Prevent text selection with the mouse (applies `user-select` CSS rule).
- `wb-rainbow` <br>
  Colorize distinct indentation levels.

These classes are automatically set the tree's `<div>` container, allowing 
custom CSS rules:

- `wb-grid`
- `wb-fixed-col`
- `wb-cell-mode`

These classes are automatically set for rows, allowing custom CSS rules:

- `wb-active`
- `wb-selected`
- `wb-busy`
- `wb-error`
- `wb-loading`
- `wb-skeleton` <br>
  Added to rows, when the *skeleton* tree option is true.
  Applies CSS styles that render titles as glowing placeholders.
  (Typically combined with `wb-initializing`.)
- `wb-status-STATUS`, e.g. `wb-status-error`

### CSS Hacks
```css
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  /* prevent scrollbars, which would break `100vh` */
  overflow: hidden;
}
```

```css
div.wunderbaum {
    scroll-behavior: smooth;
}
```

```css
div.wunderbaum:focus-visible {
  /* Suppress system focus outline. */
  outline-style: none;
}
```
