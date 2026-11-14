Generate test fixtures (Wunderbaum JSON data files)

NOTE:
Requires uv (https://docs.astral.sh/uv/) to be installed.


```bash
cd <project_root>/wunderbaum
uv sync
cd test/generator
uv run python -m make_fixture TYPE
```
e.g.
```bash
uv run python -m make_fixture department_M
uv run python -m make_fixture fmea_XL
uv run python -m make_fixture store_XL
```
