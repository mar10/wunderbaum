# AGENTS.md

Guidance for AI coding agents working in this repository.
Human-oriented contributor docs: [docs/tutorial/contribute.md](docs/tutorial/contribute.md).

## Project

Wunderbaum is a framework-agnostic tree / grid / treegrid control written in
TypeScript with zero runtime dependencies (successor of Fancytree).
Rollup bundles `src/` into UMD and ESM builds; Sass compiles
`src/wunderbaum.scss` to CSS; `tsc` emits a single `wunderbaum.d.ts`.
The project is in beta (0.x): breaking changes are allowed but must be
documented in `CHANGELOG.md`.

## Commands

Package manager is Yarn 4 via corepack (`corepack enable`); CI uses Node 20.

| Command           | What it does                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `yarn`            | Install dependencies                                                                          |
| `yarn lint`       | Prettier check + ESLint on `src docs/demo` + `tsc --noEmit`. Run before finishing any change. |
| `yarn format`     | Auto-fix ESLint/Prettier issues, then lint                                                    |
| `yarn build:js`   | Rollup + terser into `build/` (needed before running tests)                                   |
| `yarn test`       | lint + build:js + `grunt ci` (QUnit in headless Chrome via puppeteer)                         |
| `yarn build`      | Full build into `build/`, including types and regenerating `docs/api/` (TypeDoc)              |
| `yarn dev`        | Serve repo on :8080 (opens `/docs/demo`) and rebuild `build/` on change                       |
| `yarn dev_mkdocs` | Serve the MkDocs user guide (needs [uv](https://docs.astral.sh/uv/); run `uv sync` once)      |

Python is only used for tooling (MkDocs, the fixture generator in
`test/generator/`). Dependencies are managed with uv in `pyproject.toml`
(groups `docs`, `fixtures`, `dev`); format/lint Python with
`uv run ruff format` and `uv run ruff check`.

Unit tests live in `test/unit/test-core.js` (QUnit, plain JS) and run against
`build/wunderbaum.umd.js` via `test/unit/test-dev.html`. Tests can also be
viewed in a browser while `yarn dev` is running.

## Layout

- `src/wunderbaum.ts` — `Wunderbaum` class: tree-level API, options handling,
  event dispatch, column handling, viewport/rendering scheduling.
- `src/wb_node.ts` — `WunderbaumNode`: node API, node rendering, load/expand,
  selection, navigation.
- `src/types.ts`, `src/wb_options.ts` — public types and option interfaces.
  They drive the TypeDoc API reference, so keep TSDoc comments accurate.
- `src/wb_ext_*.ts` — extensions (`keynav`, `edit`, `filter`, `dnd`, `grid`,
  `logger`) derived from `src/wb_extension_base.ts` and registered in the
  `Wunderbaum` constructor. Extension options live under their id, e.g.
  `tree.options.filter`.
- `src/util.ts`, `src/common.ts`, `src/debounce.ts`, `src/deferred.ts`,
  `src/drag_observer.ts` — helpers (`util` is exposed as `Wunderbaum.util`).
- `src/wunderbaum.scss` — styles and theming variables (`--wb-*`).
- `docs/tutorial/*.md` — user guide (MkDocs, published to GitHub Pages).
- `docs/demo/` — live demo page (`demo-*.js` per demo); linted like `src/`.
- `test/unit/` — QUnit tests. `test/triage/` is gitignored and holds local
  issue repros; `test/triage/issue_000.html` is the template.

## Generated files — do not edit by hand

- `build/` — local build output (gitignored).
- `dist/` — published package files. Only updated by the maintainer at
  release time (`yarn make_dist`); never modify or commit changes to it.
- `docs/api/` — TypeDoc output (`yarn api_docs`).
- `docs/unittest/` — copied from `test/unit/` by `yarn api_docs`.
- `site/` — MkDocs output.

## Conventions

- Formatting is enforced in CI. Run `yarn format` (or `yarn lint`) before
  finishing; do not hand-format against Prettier.
- Every user-visible change gets a bullet in `CHANGELOG.md` in the beta section,
  following the existing style: `- vX.Y.Z: Description ...`, referencing issues
  as `[#123](https://github.com/mar10/wunderbaum/issues/123)`. Use the upcoming
  version from `package.json` (strip the prerelease suffix).
- Public API changes need TSDoc comments, an update to the matching
  `docs/tutorial/*.md` page, and a unit test where feasible. New features
  should also be reflected in a demo under `docs/demo/`.
- Do not bump versions, create tags, or run release tasks
  (`grunt yabs:release:*`); the maintainer does releases.
- Keep zero runtime dependencies.

## Things to know

- Rendering is virtual: only rows inside the viewport (plus a small buffer)
  exist in the DOM. Don't assume a node has a row element (`node._rowElem` may
  be undefined); trigger redraws via `tree.update(ChangeType.…)` /
  `node.update(...)` rather than touching the DOM directly. Updates are
  throttled, so tests may need `{ immediate: true }` or to await the update.
- Nodes are rendered into flat rows (`div.wb-row`) with `span` cells, not a
  nested `ul/li` structure. WAI-ARIA treegrid roles/attributes are set during
  rendering (since v0.15) — keep them consistent when changing row markup.
- Theming: only base `--wb-*` CSS variables need to be set; derived colors are
  computed with `color-mix()` (since v0.15) and are not declared on `:root`.
- Icons default to Bootstrap Icons (`iconMap` option); the icon font is not
  bundled.
- `tree.options` merges defaults from `src/wb_options.ts`; extension options are
  nested objects keyed by extension id.
