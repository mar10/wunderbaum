Generate test fixtures (Wunderbaum JSON data files)

NOTE:
Requires Python and pipenv to be installed.


```bash
cd <project_root>/wunderbaum
pipenv install
pipenv shell
cd test/generator
python -m make_fixture TYPE
```
e.g.
```bash
python -m make_fixture department_M
python -m make_fixture fmea_XL
python -m make_fixture store_XL
```
