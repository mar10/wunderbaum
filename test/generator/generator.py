import json

from fabulist import Fabulist
from nutree.tree import Tree


class WbNode:
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


fab = Fabulist()


def make_tree(*, spec_list, parent=None, prefix=""):
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


def create_fixed_multicheckbox():
    tree = make_tree(
        spec_list=[
            {"count": 10, "title": "Node {i}", "type": "folder", "expanded": True},
            {"count": 10, "title": "Node {prefix}", "type": "location"},
            {"count": 10, "title": "$(name)", "type": "article"},
        ]
    )
    tree.print()
    child_list = tree.to_dict(mapper=WbNode.serialize_mapper)
    type_dict = {
        "folder": {"icon": "bi bi-folder", "classes": "classo"},
        "article": {"icon": "bi bi-book"},
    }
    column_list = [
        {"title": "Title", "id": "*", "width": "200px"},
        # {
        #     "title": "Fav",
        #     "id": "favorite",
        #     "width": "30px",
        #     "classes": "wb-helper-center",
        #     "html": "<input type=checkbox tabindex='-1'>",
        # },
        {
            "title": "Details",
            "id": "details",
            "width": "300px",
            "html": "<input type=text tabindex='-1'>",
        },
        {"title": "Mode", "id": "mode", "width": "50px"},
        {
            "title": "Date",
            "id": "date",
            "width": "130px",
            "html": "<input type=date tabindex='-1'>",
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
    wb_data = {
        "columns": column_list,
        "types": type_dict,
        "children": child_list,
    }
    return wb_data


if __name__ == "__main__":
    res = create_fixed_multicheckbox()
    with open("fixture.json", "wt") as fp:
        json.dump(res, fp)
