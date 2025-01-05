# Migrate from Fancytree to Wunderbaum

## What has Changed?

**Main Changes to [Fancytree](https://github.com/mar10/fancytree/):**

- Written in TypeScript, transpiled to JavaScript ES6 with type hints (.esm & .umd).
- Removed dependecy on jQuery and jQuery UI.
- Dropped support for Internet Explorer.
- Markup is now `<div>` based, instead of `<ul>/<li>` and `<table>`.
- Grid layout is now built-in standard. A plain tree is only a special case thereof.
- New viewport concept (implies a fixed header and a scrollable body).
- 'Clone' suppport is now built-in standard (i.e. support for duplicate
  `refKey`s in addition to unique `key`s).
- Built-in html5 drag'n'drop.
- Titles are always XSS-safe now (former explicit `escapeTitles: true`).
- 'folder' is no longer a special built-in node type. Instead, the application
  can define any number of node types.

**Missing Features (as of today)**

- Persistence
<!-- - Built-in ARIA -->

## Migration Guide

Many general concepts from Fancytree are still the same, see the [Concepts](concepts.md)
for a general overview.

Especially the rendering model and grid support has changed significantly, however.

| Feature         | Fancytree                                                                             | Wunderbaum                                                 |
| --------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Dependency      | Requires jQuery and jQuery UI                                                         | No dependency on jQuery                                    |
| Browser Support | Supports Internet Explorer                                                            | Dropped support for Internet Explorer                      |
| Markup          | `<ul>/<li>` and `<table>` based                                                       | `<div>` based                                              |
| Layout          | Grid layout as an extension                                                           | Grid layout built-in                                       |
| Viewport        | No built-in viewport concept                                                          | New viewport concept with fixed header and scrollable body |
| Drag and Drop   | Requires additional plugins                                                           | Built-in HTML5 drag and drop                               |
| XSS Safety      | Requires `escapeTitles: true`                                                         | Titles are always XSS-safe                                 |
| Node Types      | 'folder' as a special node type                                                       | Application-defined node types                             |
| Performance     | Lazy rendering of HTML elements, but may be slow with large number of expanded nodes. | Handles large number of nodes (100k+)                      |

### Replace the Script and CSS dependencies

| Init     | Fancytree                                                                         | Wunderbaum                                                           |
| -------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tutorial | [Tutorial](https://github.com/mar10/fancytree/wiki#embed-fancytree-on-a-web-page) | [Tutorial](https://mar10.github.io/wunderbaum/tutorial/quick_start/) |

### Tree Options

Options are mostly the same, but some property names have changed. <br>
Major changes were made to the `grid` and `dnd` configuration.

| Options   | Fancytree                                                                       | Wunderbaum                                                                                 |
| --------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Reference | [API](https://wwwendt.de/tech/fancytree/doc/jsdoc/global.html#FancytreeOptions) | [API](https://mar10.github.io/wunderbaum/api/interfaces/wb_options.WunderbaumOptions.html) |
| Tutorial  | [Docs](https://github.com/mar10/fancytree/wiki)                                 | [Docs](https://mar10.github.io/wunderbaum/tutorial/tutorial_initialize/)                   |

### Tree and Node Properties

- `refKey` and `refType` are now direct properties of the node object.
- `node.folder` was dropped in favor af a more general `node.type` property.

| Properties     | Fancytree                                                                    | Wunderbaum                                                                               |
| -------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Tree Reference | [Tree model](https://wwwendt.de/tech/fancytree/doc/jsdoc/Fancytree.html)     | [Tree model](https://mar10.github.io/wunderbaum/api/classes/wunderbaum.Wunderbaum.html)  |
| Node Reference | [Node model](https://wwwendt.de/tech/fancytree/doc/jsdoc/FancytreeNode.html) | [Node model](https://mar10.github.io/wunderbaum/api/classes/wb_node.WunderbaumNode.html) |
| Tutorial       | &mdash;                                                                      | [Tutorial](https://mar10.github.io/wunderbaum/tutorial/tutorial_initialize/)             |

### Data Format

The data format is mostly the same, but some property names have changed.
For example, `folder` is now `type: "folder"`.

| Data      | Fancytree                                                            | Wunderbaum                                                                            |
| --------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Reference | &mdash;                                                              | [Initialize](https://mar10.github.io/wunderbaum/api/interfaces/types.WbNodeData.html) |
|           | &mdash;                                                              | [Formats](https://mar10.github.io/wunderbaum/api/interfaces/types.WbNodeData.html)    |
| Tutorial  | [Tutorial](https://github.com/mar10/fancytree/wiki/TutorialLoadData) | [Tutorial](https://mar10.github.io/wunderbaum/tutorial/tutorial_initialize/)          |

### API Calls

The API is similar, but some method names and signatures have changed.

| API       | Fancytree                                                                  | Wunderbaum                                                                            |
| --------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Reference | [Tree API](https://wwwendt.de/tech/fancytree/doc/jsdoc/Fancytree.html)     | [Tree API](https://mar10.github.io/wunderbaum/api/classes/wunderbaum.Wunderbaum.html) |
|           | [Node API](https://wwwendt.de/tech/fancytree/doc/jsdoc/FancytreeNode.html) | [NodeAPI](https://mar10.github.io/wunderbaum/api/classes/wb_node.WunderbaumNode.html) |
| Tutorial  | [Tutorial](https://github.com/mar10/fancytree/wiki)                        | [Tutorial](https://mar10.github.io/wunderbaum/)                                       |

### Event Handlers

The signature of event handlers has changed from `function(event, data)` to `function(event)`.

| Events    | Fancytree                                                                              | Wunderbaum                                                                                         |
| --------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Reference | [Handler API](https://wwwendt.de/tech/fancytree/doc/jsdoc/global.html#FancytreeEvents) | [Handler API](https://mar10.github.io/wunderbaum/api/interfaces/wb_options.WunderbaumOptions.html) |
|           | [Event model](https://wwwendt.de/tech/fancytree/doc/jsdoc/global.html#EventData)       | [Event model](https://mar10.github.io/wunderbaum/api/interfaces/types.WbTreeEventType.html)        |
| Tutorial  | [Tutorial](https://github.com/mar10/fancytree/wiki/TutorialEvents)                     | [Tutorial](https://mar10.github.io/wunderbaum/tutorial/tutorial_events/)                           |
