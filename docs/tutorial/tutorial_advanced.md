# Advanced Topics

?> See also the [General Overview](/tutorial/overview.md).

## User Input

## Markup and Classes

### Feature Classes

- `wb-alternate`
- `wb-error`
- `wb-grid`
- `wb-initializing`
- `wb-loading`
- `wb-rainbow`
- `wb-skeleton`
- `wb-status-STATUS`, e.g. `wb-status-error`
- `wb-checkbox-auto-hide`
- `wb-fade-expander`

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
div.wb-scroll-container {
    scroll-behavior: smooth;
}
```
