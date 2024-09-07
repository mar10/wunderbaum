"""
This script generates fixture data for different tree structures.

The script contains several functions that generate fixture data for different 
tree structures. 
Each function corresponds to a specific fixture and returns a dictionary 
representing the tree data.

The available fixtures are:
- 'store_XL': Generates fixture data for a store tree structure.
- 'department_M': Generates fixture data for a department tree structure.
- 'fmea_S': Generates fixture data for a failure mode and effects analysis (FMEA) tree structure.

The naming conventions for the fixture functions are as follows:
- The name of the fixture function should be prefixed with '_generate_fixture_'.
- follwed by a name that describes the tree structure
- and a suffix that indicates the size of the tree structure (e.g., 'XL', 'M', 'S').

To generate fixture data for a specific tree structure, pass the name of the 
fixture as a command-line argument when running the script.

Example usage:
    python make_fixture.py store_XL

The generated fixture data is written to JSON files in different formats:
- fixture_NAME_p.json: 
  Plain list format:
  Each node is represented as a dictionary in a nested list. 
  No compression is applied.
  
- fixture_NAME_o.json:
  Standard format:
  One top-level dictionary with a 'children' key containing a nested list child nodes.
  No compression is applied.

- fixture_NAME_c.json:
  Standard format with columns: a 'columns' key containing the column definitions.
  No compression is applied.

- fixture_NAME_t.json:
  Standard format with types: a 'types' key containing the node type definitions.
  No compression is applied except for type references.

- fixture_NAME_t_c.json:
  Standard format with types and columns.
  No compression is applied except for type references.

- fixture_NAME_t_c_comp.json:
  Standard format with types, columns, and compression:
  The child nodes are compressed using `_valueMap` and `_keyMap` mappings.

- fixture_NAME_t_c_flat_comp.json:
  Flat parent-referencing list with types, columns, and compression:
  The child nodes are compressed using `_valueMap`, `_keyMap`, and `_positional` 
  mappings.

The generated JSON files are saved in the 'fixtures' directory.
"""

from copy import deepcopy
from datetime import date
import json
import os
from pathlib import Path
import sys
from textwrap import dedent

sys.path.append(os.path.dirname(__file__))

from generator import (
    Automatic,
    FileFormat,
    compress_child_list,
    generate_random_wb_source,
)
from tree_generator import (
    DateRangeRandomizer,
    RangeRandomizer,
    SampleRandomizer,
    SparseBoolRandomizer,
    TextRandomizer as Fab,
)


# ------------------------------------------------------------------------------
# Fixture: 'store'
# ------------------------------------------------------------------------------
def _generate_fixture_store_XL(*, add_html: bool) -> dict:

    # --- Node Types ---

    type_dict = {
        "folder": {"colspan": True},
        "book": {"icon": "bi bi-book"},
        "computer": {"icon": "bi bi-laptop"},
        "music": {"icon": "bi bi-disc"},
        "phone": {"icon": "bi bi-phone"},
    }

    # --- Define Columns ---

    column_list = [
        {"id": "*", "title": "Product", "width": "250px"},
        {"id": "author", "title": "Author", "width": "200px"},
        {"id": "year", "title": "Year", "width": "60px", "classes": "wb-helper-end"},
        {"id": "qty", "title": "Qty", "width": "80px", "classes": "wb-helper-end"},
        {"id": "sale", "title": "Sale", "width": "60px", "classes": "wb-helper-center"},
        {
            "id": "price",
            "title": "Price ($)",
            "width": "90px",
            "classes": "wb-helper-end",
        },
        # In order to test horizontal scrolling, we need a fixed or at least minimal width:
        {"id": "details", "title": "Details", "width": "*", "minWidth": "600px"},
    ]

    # --- Compression Hints ---

    key_map = Automatic
    positional = [
        "title",
        "type",
        "author",
        "year",
        "qty",
        "price",
        "details",
    ]

    # --- Build nested node dictionary ---

    structure_def = {
        #: Relations define the possible parent / child relationships between
        #: node types and optionally override the default properties.
        "relations": {
            "__root__": {
                "product_group": {
                    ":count": 10,
                    "type": "folder",
                    "title": Fab("$(Noun:plural)"),
                },
            },
            "product_group": {
                "product_subgroup": {
                    ":count": RangeRandomizer(70, 130),
                    "type": "folder",
                    "title": Fab("$(Adj) $(Noun:plural)"),
                },
            },
            "product_subgroup": {
                "product": {
                    # ":count": 10,
                    ":count": RangeRandomizer(0, 200),
                    # ":callback": _person_callback,
                    "type": SampleRandomizer(("book", "computer", "music", "phone")),
                    "title": Fab("$(Noun)"),
                    "author": Fab("$(name:middle)"),
                    "year": DateRangeRandomizer(date(2, 1, 1), date(2023, 12, 31)),
                    "qty": RangeRandomizer(1, 1_000_000, probability=0.9, none_value=0),
                    "price": RangeRandomizer(0.01, 10_000.0),
                    "sale": SparseBoolRandomizer(probability=0.1),
                    "details": Fab("$(Verb:s) $(noun:plural) $(adv:#positive)."),
                },
            },
        },
    }

    random_data = generate_random_wb_source(structure_definition=structure_def)

    random_data.update(
        {
            "types": type_dict,
            "columns": column_list,
            "key_map": key_map,
            "positional": positional,
            "children": random_data["child_list"],
        }
    )
    return random_data


# ------------------------------------------------------------------------------
# Fixture: 'department'
# ------------------------------------------------------------------------------


def _generate_fixture_department_M(*, add_html: bool) -> dict:

    CB_COUNT = 0

    # --- Node Types ---

    type_dict = {
        "department": {"icon": "bi bi-diagram-3", "colspan": True},
        "role": {"icon": "bi bi-microsoft-teams", "colspan": True},
        "person": {"icon": "bi bi-person"},
    }

    # --- Define Columns ---

    column_list = [
        {
            "title": "Title",
            "id": "*",
            "width": "250px",
        },
        {
            "title": "Age",
            "id": "age",
            "width": "50px",
            "html": "<input type=number min=0 tabindex='-1'>" if add_html else None,
            "classes": "wb-helper-end",
        },
        {
            "title": "Date",
            "id": "date",
            "width": "100px",
            "html": "<input type=date tabindex='-1'>" if add_html else None,
        },
        {
            "title": "Status",
            "id": "state",
            "width": "70px",
            "html": (
                dedent(
                    """\
                <select tabindex='-1'>
                  <option value=h>Happy</option>
                  <option value=s>Sad</option>
                </select>
                """
                )
                if add_html
                else None
            ),
        },
        {
            "title": "Avail",
            "id": "avail",
            "width": "30px",
            "html": "<input type=checkbox tabindex='-1'>" if add_html else None,
            "sortable": False,
        },
        # {
        #     "title": "Tags",
        #     "id": "tags",
        #     "width": "100px",
        #     "html": '<select tabindex="-1" multiple><option value="a">A</option><option value="b">B</option></select>'
        #     if add_html
        #     else None,
        # },
        {
            "title": "Remarks",
            "id": "remarks",
            "width": "*",
            # "width": "300px",
            "html": "<input type=text tabindex='-1'>" if add_html else None,
            # "menu": True,
            "sortable": False,
        },
    ]

    for i in range(1, CB_COUNT):
        column_list.append(
            {
                "title": f"#{i}",
                "id": f"state_{i}",
                "width": "30px",
                "classes": "wb-helper-center",
                "html": "<input type=checkbox tabindex='-1'>" if add_html else None,
                "sortable": False,
            }
        )

    # --- Compression Hints ---

    key_map = Automatic
    positional = [
        "title",
        "type",
        "state",
        "avail",
        "age",
        "date",
        "remarks",
    ]

    # --- Build nested node dictionary ---
    def _person_callback(data):
        # Initialize checkbox values
        vr = SparseBoolRandomizer(probability=0.2)
        for i in range(1, CB_COUNT + 1):
            key = f"state_{i}"
            val = vr.generate()
            if val is None:
                data.pop(key, None)
            else:
                data[key] = val
        return

    # --- Build nested node dictionary ---

    structure_def = {
        #: Relations define the possible parent / child relationships between
        #: node types and optionally override the default properties.
        "relations": {
            "__root__": {
                "department": {
                    ":count": 10,
                    "type": "department",
                    "title": Fab("Dept. for $(Noun:plural) and $(Noun:plural)"),
                    # "expanded": SparseBoolRandomizer(probability=0.2),
                },
            },
            "department": {
                "role": {
                    ":count": RangeRandomizer(8, 13),
                    "type": "role",
                    "title": Fab("$(Verb) $(noun:plural)"),
                    # "expanded": SparseBoolRandomizer(probability=0.3),7
                },
            },
            "role": {
                "person": {
                    ":count": RangeRandomizer(0, 22),
                    ":callback": _person_callback,
                    "type": "person",
                    "title": Fab("$(name:middle)"),
                    "state": SampleRandomizer(("h", "s"), probability=0.3),
                    "avail": SparseBoolRandomizer(probability=0.9),
                    "age": RangeRandomizer(21, 99),
                    "date": DateRangeRandomizer(
                        date(1970, 1, 1),
                        date.today(),
                        probability=0.6,
                    ),
                    "remarks": Fab(
                        "$(Verb:s) $(noun:plural) $(adv:#positive).", probability=0.3
                    ),
                },
            },
        },
    }

    random_data = generate_random_wb_source(structure_definition=structure_def)

    random_data.update(
        {
            "types": type_dict,
            "columns": column_list,
            "key_map": key_map,
            "positional": positional,
            "children": random_data["child_list"],
        }
    )
    return random_data


# ------------------------------------------------------------------------------
# Fixture: 'fmea'
# ------------------------------------------------------------------------------


def _generate_fixture_fmea_S(*, add_html: bool) -> dict:

    # --- Node Types ---

    type_dict = {
        "function": {"icon": "bi bi-gear"},
        "failure": {"icon": "bi bi-exclamation-triangle"},
        "causes": {"icon": "bi bi-tools", "colspan": True, "expanded": True},
        "cause": {"icon": "bi bi-tools"},
        "effects": {"icon": "bi bi-lightning", "colspan": True, "expanded": True},
        "effect": {"icon": "bi bi-lightning"},
    }

    # --- Define Columns ---

    column_list = [
        {
            "title": "Title",
            "id": "*",
            "width": "250px",
        },
    ]

    # --- Compression Hints ---

    key_map = Automatic
    positional = Automatic  # Uses default (title, type)

    # --- Build nested node dictionary ---

    structure_def = {
        "relations": {
            "__root__": {
                "function": {
                    ":count": 10,
                    "type": "function",
                    "title": Fab(["Deliver $(verb:ing)", "Produce $(noun:plural)"]),
                    # "expanded": SparseBoolRandomizer(probability=0.1),
                    "expanded": True,
                },
            },
            "function": {
                "failure": {
                    ":count": RangeRandomizer(1, 3),
                    "type": "failure",
                    "title": Fab(
                        ["$(Noun) is $(adj:#negative)", "$(Noun) not $(verb:ing)"]
                    ),
                    # "expanded": SparseBoolRandomizer(probability=0.3),7
                },
            },
            "failure": {
                "causes": {
                    ":count": 1,
                    "type": "causes",
                    "title": "Causes",
                },
                "effects": {
                    ":count": 1,
                    "type": "effects",
                    "title": "Effects",
                },
            },
            "causes": {
                "cause": {
                    ":count": RangeRandomizer(1, 3, probability=0.8),
                    "type": "cause",
                    "title": Fab("$(Noun:plural) not provided"),
                },
            },
            "effects": {
                "effect": {
                    ":count": RangeRandomizer(1, 3, probability=0.8),
                    "type": "effect",
                    "title": Fab("$(Noun:plural) not provided"),
                },
            },
        },
    }

    random_data = generate_random_wb_source(structure_definition=structure_def)

    random_data.update(
        {
            "types": type_dict,
            "columns": column_list,
            "key_map": key_map,
            "positional": positional,
            "children": random_data["child_list"],
        }
    )
    return random_data


# ------------------------------------------------------------------------------
# Main CLI
# ------------------------------------------------------------------------------


def _size_disp(path: Path) -> str:
    size = path.stat().st_size
    if size > 500_000:
        return f"{round(0.000001*size, 2):,} MiB"
    elif size > 3000:
        return f"{round(0.001*size, 2):,} kiB"
    return f"{size:,}"


def _write_json(path: Path, data: dict, *, debug: bool):
    with open(path, "wt") as fp:
        if debug:
            json.dump(data, fp, indent=4, separators=(", ", ": "))
        else:
            json.dump(data, fp, indent=None, separators=(",", ":"))
    print(f"Created {path.name}, {_size_disp(path)}")


def main(locals):
    # --- Find all implementation functions (starting with 'generate_fixture_')
    METHOD_PREFIX = "_generate_fixture_"
    METHOD_PREFIX_LEN = len(METHOD_PREFIX)
    # ADD_HTML = False
    DEBUG = False
    # DEBUG = True

    avail = [
        name[METHOD_PREFIX_LEN:] for name in locals if name.startswith(METHOD_PREFIX)
    ]
    avail_disp = "'{}'".format("', '".join(avail))

    if len(sys.argv) != 2:
        print("Usage: `python make_fixture.py NAME`")
        print(f"Supported names: {avail_disp}")
        sys.exit(1)

    fixture_name = sys.argv[1]
    method = locals.get(f"{METHOD_PREFIX}{fixture_name}")
    if not callable(method):
        print(f"Invalid fixture name: {fixture_name!r}. Expected {avail_disp}")
        sys.exit(1)

    # --- Call the genreator method
    random_data = method(add_html=True)

    print(
        f'Generated tree with {random_data["node_count"]:,} nodes, depth: {random_data["depth"]}'
    )
    col_count = len(random_data["columns"]) if random_data.get("columns") else 1

    base_dir = Path(__file__).parent.parent / "fixtures"
    # base_name = f'fixture_{fixture_name}_{tree_data["node_count_disp"]}_{tree_data["depth"]}_{col_count}'
    base_name = f"fixture_{fixture_name}"

    print(f"Writing results to  {base_dir}")

    # Remove previous fixtures
    for fn in base_dir.glob(f"fixture_{fixture_name}_*"):
        fn.unlink()
        print(f"REMOVED {fn}")

    # Write as plain list
    file_name = f"{base_name}_p.json"
    path = base_dir / file_name
    out = random_data["child_list"]
    _write_json(path, out, debug=DEBUG)

    # Extended Standard (object format)
    file_name = f"{base_name}_o.json"
    path = base_dir / file_name
    out = {"children": random_data["children"]}
    _write_json(path, out, debug=DEBUG)

    if col_count:
        # Extended standard with columns
        file_name = f"{base_name}_c.json"
        path = base_dir / file_name
        out = {"columns": random_data["columns"], "children": random_data["children"]}
        _write_json(path, out, debug=DEBUG)

    if random_data["types"]:
        # Extended standard with types
        file_name = f"{base_name}_t.json"
        path = base_dir / file_name
        out = {"types": random_data["types"], "children": random_data["children"]}
        _write_json(path, out, debug=DEBUG)

        if col_count:
            # Extended standard with types and columns
            file_name = f"{base_name}_t_c.json"
            path = base_dir / file_name
            out = {
                "types": random_data["types"],
                "columns": random_data["columns"],
                "children": random_data["children"],
            }
            _write_json(path, out, debug=DEBUG)

    file_name = f"{base_name}_t_c_flat_comp.json"
    path = base_dir / file_name
    out = compress_child_list(
        deepcopy(random_data["child_list"]),  # DEEP-COPY, because nodes are modified
        format=FileFormat.flat,
        types=random_data["types"],
        columns=random_data["columns"],
        key_map=random_data["key_map"],
        positional=random_data["positional"],
        auto_compress=True,
    )
    _write_json(path, out, debug=DEBUG)

    file_name = f"{base_name}_t_c_comp.json"
    path = base_dir / file_name
    out = compress_child_list(
        random_data["child_list"],
        format=FileFormat.nested,
        types=random_data["types"],
        columns=random_data["columns"],
        key_map=random_data["key_map"],
        positional=random_data["positional"],
        auto_compress=True,
    )
    _write_json(path, out, debug=DEBUG)


if __name__ == "__main__":
    main(locals=locals())
