# Data Formats

Some examples of how the data should be formatted in JSON.

## Nested List Format

All node are transferred as a list of top-level nodes, with optional nested
lists of child nodes.

```js
[
  {
    title: "Books",
    expanded: true,
    children: [
      {
        title: "Art of War",
        author: "Sun Tzu",
      },
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
      },
    ],
  },
  {
    title: "Music",
    children: [
      {
        title: "Nevermind",
        author: "Nirvana",
      },
    ],
  },
];
```

## Object Format

This is the most commonly used format. Here we pass an object that contains
one `children` element, but also additional information.

```js
{
  "types": {...},
  "columns": [...],
  "_keyMap": {...},
  "children": [
    {
      "title": "Books",
      "expanded": true,
      "children": [
        {
          "title": "Art of War",
          "author": "Sun Tzu"
        },
      ]
    },
    ...
  ]
}
```

## Type Information

A tree often contains multiple nodes that share attributes.
We can extract type information to a separate block, in order to make the
data model more concise:

```js
{
  "types": {
    "folder": { "icon": "bi bi-folder", "classes": "bold-style" },
    "book": { "icon": "bi bi-book" },
    "music": { "icon": "bi bi-disk" }
  },
  "children": [
    {
      "title": "Books",
      "type": "folder",
      "expanded": true,
      "children": [
        {
          "title": "Art of War",
          "type": "book",
          "author": "Sun Tzu"
        },
        ...
      ]
    },
    {
      "title": "Music",
      "type": "folder",
      "children": [
        {
          "title": "Nevermind",
          "type": "music",
          "author": "Nirvana"
        }
      ]
    }
  ]
}
```

Type definitions can also be passed directly to the tree constructor:

```js
const tree = new mar10.Wunderbaum({
  id: "demo",
  element: document.getElementById("demo-tree"),
  source: "get/root/nodes",
  types: {
    folder: { icon: "bi bi-folder", classes: "bold-style" },
    book: { icon: "bi bi-book" },
    music: { icon: "bi bi-disk" }
  },
  ...
```

## Compact Formats

Load time of data is an important aspect of the user experience. <br>
We can reduce the size of the JSON data by eliminating redundancy:

- Remove whitespace from the JSON (the listings in this chapter are formatted
  for readability).
- Don't pass default values, e.g. `expanded: false` is not required.
- Use `node.type` declarations, to extract shared properties (see above).

```js
{
  "_format": "nested",
  "types": {"person": {...}, ...},
  "children": [
    {"title": "Node 1", "key": "id123", "type": "folder", "expanded": true, "children": [
      {"title": "Node 1.1", "key": "id234", "type": "person"},
      {"title": "Node 1.2", "key": "id345", "type": "person", "age": 32}
    ]}
  ]
}
```

The example above can still be optimized:

- Pass `1` instead of `true` and `0` instead of `false`
  (or don't pass it at all if it is the default).
- Use `_keyMap` and shorten the key names, e.g. send `{"t": "foo"}` instead of
  `{"title": "foo"}` (see below).
- Use a `_valueMap` to define a global list of potential string values for a distinct property type. Nodes can then pass a numeric index instead of the string, which will save space.

!!! note

    The syntax of `_keyMap` and `_valueMap` has changed with v0.7.0.

```js
{
  "_format": "nested",  // Optional
  "types": {"person": {...}, ...},
  "columns": [...],
  // Map from short key to final key (if a key is not found here it will
  // be used literally):
  "_keyMap": {"title": "t", "key": "k", "type": "y", "children": "c", "expanded": "e"},
  // Optional: if a 'type' entry has a numeric value, use it as index into this
  // list (string values are still used literally):
  "_valueMap": {
    "type": ["folder", "person"]
  },
  "children": [
    {"t": "Node 1", "k": "id123", "y": 0, "e": 1, "c": [
      {"t": "Node 1.1", "k": "id234", "y": 1},
      {"t": "Node 1.2", "k": "id345", "y": 1, "age": 32}
    ]}
  ]
}
```

## Flat, Parent-Referencing List

The flat format is even a few percent smaller than the nested format.
It may also be more apropropriate for sending patches for existing trees, since
parent keys can be passed.

Here all nodes are passed as a flat list, without nesting. <br>
A node entry has the following structure:

`[PARENT_ID, [POSITIONAL_ARGS]]`<br>
or <br>
`[PARENT_ID, [POSITIONAL_ARGS], {KEY_VALUE_ARGS}]`

`PARENT_ID` is either a string that references an existing `node.key`
or the numeric 0-based index of a node that appeared before in the list.

`POSITIONAL_ARGS` define property values in the order defined by `_positional`.

`KEY_VALUE_ARGS` define other properties as key/value pairs (optional).

```js
{
  "_format": "flat",
  "types": {...},       // Optional, but likely if `_valueMap` is used
  "columns": [...],     // Optional
  // Map from short key to final key (if a key is not found here it will
  // be used literally):
  "_keyMap": {"expanded": "e"},
  // Values for these keys are appended as list items.
  // Other items - if any - are collected into one dict that is also appended:
  "_positional": ["title", "key", "type"],
  // Optional: if a 'type' entry has a numeric value, use it as index into this
  // list (string values are still used literally):
  "_valueMap": {
    "type": ["folder", "person"]
  },
  // List index is 0-based, parent index null means 'top-node'.
  // If parent index is a string, parent is searched by `node.key` (slower)
  "children": [
    [null, "Node 1", "id123", 0, {"e": true}],  // index=0
    [0, "Node 1.1", "id234", 1],                // index=1
    [0, "Node 1.2", "id345", 1, {"age": 32}]    // index=2
  ]
}
```
