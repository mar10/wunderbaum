from abc import ABC, abstractmethod
import json

from fabulist import Fabulist
from nutree.tree import Tree


fab = Fabulist()


class WbNode:
    """Used as `data` instance in nutree.

    See https://github.com/mar10/nutree
    """

    def __init__(self, title, *, data=None) -> None:
        self.title = title
        self.data = data

    def __repr__(self):
        return f"WbNode<'{self.title}'>"

    @staticmethod
    def serialize_mapper(nutree_node, data):
        wb_node = nutree_node.data
        res = {"title": wb_node.title}
        res.update(wb_node.data)
        return res


def make_tree(*, spec_list, parent=None, prefix=""):
    """Return a nutree.Tree with random data from a specification.

    See https://github.com/mar10/nutree
    """
    if parent is None:
        parent = Tree()

    spec_list = spec_list.copy()
    spec = spec_list.pop(0).copy()
    count = spec.pop("count")
    title = spec.pop("title")

    for i in range(count):
        i += 1  # 1-based
        p = f"{prefix}.{i}" if prefix else f"{i}"
        if "$(" in title:
            t = fab.get_quote(title)
        else:
            t = title
        wb_node = WbNode(
            t.format(i=i, prefix=p),
            data=spec,
        )
        node = parent.add(wb_node)
        if spec_list:
            make_tree(parent=node, spec_list=spec_list, prefix=p)
    return parent


class Randomizer(ABC):
    @abstractmethod
    def generate(self):
        pass


class RangeRandomizer(Randomizer):
    def __init__(self, min: float | int, max: float | int) -> None:
        self.min = min
        self.max = max


class SampleRandomizer(Randomizer):
    def __init__(self, sample_list: list) -> None:
        self.sample_list = sample_list


def create_fixed_multicheckbox(add_html: bool) -> dict:

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
            "width": "200px",
        },
        {
            "title": "Details",
            "id": "details",
            "width": "300px",
            "html": "<input type=text tabindex='-1'>" if add_html else None,
        },
        {
            "title": "Mode",
            "id": "mode",
            "width": "50px",
            "html": '<select><option value="a">A</option><option value="b">B</option></select>'
            if add_html
            else None,
        },
        {
            "title": "Date",
            "id": "date",
            "width": "130px",
            "html": "<input type=date tabindex='-1'>" if add_html else None,
        },
    ]

    for i in range(50):
        i += 1
        column_list.append(
            {
                "title": f"#{i}",
                "id": f"state_{i}",
                "width": "30px",
                "classes": "wb-helper-center",
                "html": "<input type=checkbox tabindex='-1'>",
            }
        )

    # --- Build nested node dictionary ---

    tree = make_tree(
        spec_list=[
            {
                "count": 2,
                "title": "Dept. for $(Noun:plural) and $(Noun:plural)",
                "type": "department",
                "expanded": True,
            },
            {
                "count": 2,
                "title": "$(Verb) $(noun:plural)",
                "type": "role",
            },
            {
                "count": 2,
                "title": "$(name)",
                "type": "person",
            },
        ]
    )
    tree.print()
    print(f"Generated tree with {len(tree):,} nodes, depth={tree.calc_height()}")

    child_list = tree.to_dict(mapper=WbNode.serialize_mapper)

    # Wunderbaum formatted dict.
    # Can be converted to JSON and directly consumed by Wunderbaum:
    wb_data = {
        "types": type_dict,
        "columns": column_list,
        "children": child_list,
    }
    return wb_data


if __name__ == "__main__":
    res = create_fixed_multicheckbox(add_html=True)
    with open("fixture.json", "wt") as fp:
        json.dump(res, fp)
