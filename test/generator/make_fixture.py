from copy import deepcopy
from datetime import date
import json
import os
from pathlib import Path
import sys
from textwrap import dedent

sys.path.append(os.path.dirname(__file__))

from generator import (
    compress_child_list,
    Automatic,
    DateRangeRandomizer,
    FileFormat,
    generate_tree,
    RangeRandomizer,
    SampleRandomizer,
    TextRandomizer,
    ValueRandomizer,
)

# ------------------------------------------------------------------------------
# Fixture: 'store'
# ------------------------------------------------------------------------------
def generate_fixture_store(*, add_html: bool) -> dict:

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
        {"id": "year", "title": "Year", "width": "50px", "classes": "wb-helper-end"},
        {"id": "qty", "title": "Qty", "width": "50px", "classes": "wb-helper-end"},
        {"id": "sale", "title": "Sale", "width": "50px", "classes": "wb-helper-center"},
        {
            "id": "price",
            "title": "Price ($)",
            "width": "80px",
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

    tree_data = generate_tree(
        spec_list=[
            {
                ":count": 10,
                "title": "$(Noun:plural)",
                "type": "folder",
                # "expanded": ValueRandomizer(True, probability=0.05),
            },
            {
                # ":count": 10,
                ":count": RangeRandomizer(70, 130),
                "title": "$(Adj) $(Noun:plural)",
                "type": "folder",
                # "expanded": ValueRandomizer(True, probability=0.3),
            },
            {
                # ":count": 10,
                ":count": RangeRandomizer(0, 200),
                # ":callback": _person_callback,
                "title": "$(Noun)",
                "author": TextRandomizer("$(name:middle)"),
                "type": SampleRandomizer(("book", "computer", "music", "phone")),
                # "year": RangeRandomizer(-1000, 2022),
                "year": DateRangeRandomizer(date(2, 1, 1), date(2021, 12, 31)),
                "qty": RangeRandomizer(0, 1000000),
                "price": RangeRandomizer(0, 10000),
                "details": TextRandomizer("$(Verb:s) $(noun:plural) $(adv:#positive)."),
            },
        ]
    )

    tree_data.update(
        {
            "types": type_dict,
            "columns": column_list,
            "key_map": key_map,
            "positional": positional,
            "children": tree_data["child_list"],
        }
    )
    return tree_data


# ------------------------------------------------------------------------------
# Fixture: 'department'
# ------------------------------------------------------------------------------


def generate_fixture_department(*, add_html: bool) -> dict:

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
            "html": dedent(
                """\
                <select tabindex='-1'>
                  <option value=h>Happy</option>
                  <option value=s>Sad</option>
                </select>
                """
            )
            if add_html
            else None,
        },
        {
            "title": "Avail",
            "id": "avail",
            "width": "30px",
            "html": "<input type=checkbox tabindex='-1'>" if add_html else None,
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

    # --- Build nested node dictionary ---
    def _person_callback(data):
        # Initialize checkbox values
        vr = ValueRandomizer(True, probability=0.2)
        for i in range(1, CB_COUNT + 1):
            key = f"state_{i}"
            val = vr.generate()
            if val is None:
                data.pop(key, None)
            else:
                data[key] = val
        return

    tree_data = generate_tree(
        spec_list=[
            {
                ":count": 10,
                "title": "Dept. for $(Noun:plural) and $(Noun:plural)",
                "type": "department",
                # "expanded": ValueRandomizer(True, probability=0.2),
            },
            {
                ":count": RangeRandomizer(8, 13),
                "title": "$(Verb) $(noun:plural)",
                "type": "role",
                # "expanded": ValueRandomizer(True, probability=0.3),7
            },
            {
                ":count": RangeRandomizer(0, 22),
                ":callback": _person_callback,
                "title": "$(name:middle)",
                "type": "person",
                "state": SampleRandomizer(("h", "s"), probability=0.3),
                "avail": ValueRandomizer(True, probability=0.9),
                "age": RangeRandomizer(21, 99),
                "date": DateRangeRandomizer(
                    date(1970, 1, 1),
                    date.today(),
                    probability=0.6,
                ),
                "remarks": TextRandomizer(
                    "$(Verb:s) $(noun:plural) $(adv:#positive).", probability=0.3
                ),
            },
        ]
    )

    tree_data.update(
        {
            "types": type_dict,
            "columns": column_list,
            "key_map": key_map,
            "positional": positional,
            "children": tree_data["child_list"],
        }
    )
    return tree_data


# ------------------------------------------------------------------------------
# Main CLI
# ------------------------------------------------------------------------------


def _size_disp(path: Path) -> str:
    size = path.stat().st_size
    if size > 500000:
        return f"{round(0.000001*size, 2):,} MiB"
    elif size > 3000:
        return f"{round(0.001*size, 2):,} kiB"
    return f"{size:,}"


def write_json(path: Path, data: dict, *, debug: bool):
    with open(path, "wt") as fp:
        if debug:
            json.dump(data, fp, indent=4, separators=(", ", ": "))
        else:
            json.dump(data, fp, indent=None, separators=(",", ":"))
    print(f"Created {file_name}, {_size_disp(path)}")


if __name__ == "__main__":
    METHOD_PREFIX = "generate_fixture_"
    ADD_HTML = False
    DEBUG = False
    # DEBUG = True

    avail = [name[17:] for name in locals() if name.startswith(METHOD_PREFIX)]
    avail_disp = "'{}'".format("', '".join(avail))

    if len(sys.argv) != 2:
        print("Usage: `python make_fixture.py NAME`")
        print(f"NAME: {avail_disp}")
        sys.exit(1)

    fixture_name = sys.argv[1]
    method = locals().get(f"{METHOD_PREFIX}{fixture_name}")
    if not callable(method):
        print(f"Invalid fixture name: {fixture_name!r}. Expected {avail_disp}")
        sys.exit(1)

    res = method(add_html=True)

    print(f'Generated tree with {res["node_count"]:,} nodes, depth: {res["depth"]}')
    col_count = len(res["columns"]) if res.get("columns") else 1

    base_dir = Path(__file__).parent
    base_name = (
        f'fixture_{fixture_name}_{res["node_count_disp"]}_{res["depth"]}_{col_count}'
    )

    print(f"Writing results to  {base_dir}")

    # Remove previous fixtures
    for fn in base_dir.glob(f"fixture_{fixture_name}_*"):
        fn.unlink()
        print(f"REMOVED {fn}")

    # Write as plain list
    file_name = f"{base_name}_p.json"
    path = base_dir / file_name
    out = res["child_list"]
    write_json(path, out, debug=DEBUG)

    # Extended Standard
    file_name = f"{base_name}.json"
    path = base_dir / file_name
    out = {"children": res["children"]}
    write_json(path, out, debug=DEBUG)

    if col_count:
        file_name = f"{base_name}_c.json"
        path = base_dir / file_name
        out = {"columns": res["columns"], "children": res["children"]}
        write_json(path, out, debug=DEBUG)

    if res["types"]:
        file_name = f"{base_name}_t.json"
        path = base_dir / file_name
        out = {"types": res["types"], "children": res["children"]}
        write_json(path, out, debug=DEBUG)

        if col_count:
            file_name = f"{base_name}_t_c.json"
            path = base_dir / file_name
            out = {
                "types": res["types"],
                "columns": res["columns"],
                "children": res["children"],
            }
            write_json(path, out, debug=DEBUG)

    file_name = f"{base_name}_flat_comp.json"
    path = base_dir / file_name
    out = compress_child_list(
        deepcopy(res["child_list"]),  # DEEP-COPY, because nodes ar4 modifiec
        format=FileFormat.flat,
        types=res["types"],
        columns=res["columns"],
        key_map=res["key_map"],
        positional=res["positional"],
        auto_compress=True,
    )
    write_json(path, out, debug=DEBUG)

    file_name = f"{base_name}_comp.json"
    path = base_dir / file_name
    out = compress_child_list(
        res["child_list"],
        format=FileFormat.nested,
        types=res["types"],
        columns=res["columns"],
        key_map=res["key_map"],
        positional=res["positional"],
        auto_compress=True,
    )
    write_json(path, out, debug=DEBUG)
