from abc import ABC, abstractmethod
from datetime import date, datetime, timedelta
import json
import random
from typing import Any, Sequence, Union

from fabulist import Fabulist
from nutree.tree import Tree


fab = Fabulist()

# ------------------------------------------------------------------------------
# Randomizers
# ------------------------------------------------------------------------------
class Randomizer(ABC):
    def __init__(self, *, probability: float = None) -> None:
        assert (
            probability is None or 0.0 < probability < 1.0
        ), f"probality mus be in the range [0.0..1.0] or None: {probability}"
        self.probability = probability

    def _skip_value(self) -> bool:
        use = self.probability is None or random.random() <= self.probability
        return not use

    @abstractmethod
    def generate(self) -> Any:
        pass


class RangeRandomizer(Randomizer):
    def __init__(
        self,
        min_val: Union[float, int],
        max_val: Union[float, int],
        *,
        probability=None,
    ) -> None:
        super().__init__(probability=probability)
        assert type(min_val) is type(max_val)
        self.is_float = type(min_val) is float
        self.min = min_val
        self.max = max_val

    def generate(self) -> Union[float, int, None]:
        if self._skip_value():
            return
        if self.is_float:
            return random.uniform(self.min, self.max)
        return random.randrange(self.min, self.max)


class DateRangeRandomizer(Randomizer):
    def __init__(
        self,
        min_dt: date,
        max_dt: Union[date, int],
        *,
        as_js_stamp=True,
        probability=None,
    ) -> None:
        super().__init__(probability=probability)
        if type(max_dt) in (int, float):
            self.delta_days = max_dt
            max_dt = min_dt + self.delta_days
        else:
            self.delta_days = (max_dt - min_dt).days
        assert max_dt > min_dt
        self.min = min_dt
        self.max = max_dt
        self.as_js_stamp = as_js_stamp

    def generate(self) -> Union[date, None]:
        if self._skip_value():
            return
        res = self.min + timedelta(days=random.randrange(self.delta_days))
        if self.as_js_stamp:
            ONE_DAY = 24 * 60 * 60
            dt = datetime(res.year, res.month, res.day)
            stamp_ms = (dt.timestamp() + ONE_DAY) * 1000.0
            # print(self.min, self.max, self.delta_days, res, stamp_ms)
            res = stamp_ms
        return res


class ValueRandomizer(Randomizer):
    def __init__(self, value: Any, *, probability: float) -> None:
        super().__init__(probability=probability)
        self.value = value

    def generate(self) -> Any:
        if self._skip_value():
            return
        return self.value


class TextRandomizer(Randomizer):
    def __init__(
        self, template: Union[str, list], *, probability: float = None
    ) -> None:
        super().__init__(probability=probability)
        self.template = template

    def generate(self) -> Any:
        if self._skip_value():
            return
        return fab.get_quote(self.template)


class SampleRandomizer(Randomizer):
    def __init__(
        self, sample_list: Sequence, *, counts=None, probability: float = None
    ) -> None:
        super().__init__(probability=probability)
        self.sample_list = sample_list
        self.counts = counts

    def generate(self) -> Any:
        if self._skip_value():
            return
        return random.sample(self.sample_list, 1, counts=self.counts)[0]


# class BoolRandomizer(SampleRandomizer):
#     def __init__(self, *, allow_none: bool = False) -> None:
#         if allow_none:
#             super().__init__((True, False, None))
#         else:
#             super().__init__((True, False))


def resolve_random(val: Any) -> Any:
    if isinstance(val, Randomizer):
        return val.generate()
    return val


def resolve_random_dict(d: dict) -> None:
    remove = []
    for key in d.keys():
        val = d[key]
        if isinstance(val, Randomizer):
            val = val.generate()
            if val is None:  # Skip due to probability
                remove.append(key)
            else:
                d[key] = val
    for key in remove:
        d.pop(key)
    return


# ------------------------------------------------------------------------------
# Tree Builder
# ------------------------------------------------------------------------------


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
    count = resolve_random(spec.pop(":count"))
    title = spec.pop("title")
    callback = spec.pop(":callback", None)

    for i in range(count):
        i += 1  # 1-based
        p = f"{prefix}.{i}" if prefix else f"{i}"
        if "$(" in title:
            t = fab.get_quote(title)
        else:
            t = title

        # Resolve `Randomizer` values
        data = spec.copy()
        resolve_random_dict(data)
        if callback:
            callback(data)

        wb_node = WbNode(
            t.format(i=i, prefix=p),
            data=data,
        )
        node = parent.add(wb_node)
        if spec_list:
            make_tree(parent=node, spec_list=spec_list, prefix=p)
    return parent


# ------------------------------------------------------------------------------
# Fixture Definitions
# ------------------------------------------------------------------------------


def create_fixed_multicheckbox(
    *, add_types: bool, add_columns: bool, add_html: bool
) -> dict:

    CB_COUNT = 50

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
            "html": '<input type=date tabindex="-1">' if add_html else None,
        },
        {
            "title": "Mood",
            "id": "mood",
            "width": "70px",
            "html": """<select tabindex="-1">
                <option value="h">Happy</option>
                <option value="s">Sad</option>
                </select>
                """
            if add_html
            else None,
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
            "width": "300px",
            "html": "<input type=text tabindex='-1'>" if add_html else None,
        },
    ]

    for i in range(1, CB_COUNT + 1):
        column_list.append(
            {
                "title": f"#{i}",
                "id": f"state_{i}",
                "width": "30px",
                "classes": "wb-helper-center",
                "html": "<input type=checkbox tabindex='-1'>" if add_html else None,
            }
        )

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

    tree = make_tree(
        spec_list=[
            {
                ":count": 10,
                "title": "Dept. for $(Noun:plural) and $(Noun:plural)",
                "type": "department",
                "expanded": ValueRandomizer(True, probability=0.2),
            },
            {
                ":count": RangeRandomizer(7, 13),
                "title": "$(Verb) $(noun:plural)",
                "type": "role",
                "expanded": ValueRandomizer(True, probability=0.3),
            },
            {
                ":count": RangeRandomizer(0, 20),
                ":callback": _person_callback,
                "title": "$(name:middle)",
                "type": "person",
                "mood": SampleRandomizer(("h", "s"), probability=0.3),
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
    tree.print()
    print(f"Generated tree with {len(tree):,} nodes, depth={tree.calc_height()}")

    child_list = tree.to_dict(mapper=WbNode.serialize_mapper)

    # Wunderbaum formatted dict.
    # Can be converted to JSON and directly consumed by Wunderbaum:
    wb_data = {}
    if add_types:
        wb_data["types"] = type_dict
    if add_columns:
        wb_data["columns"] = column_list
    wb_data["children"] = child_list
    return wb_data


if __name__ == "__main__":
    res = create_fixed_multicheckbox(add_types=True, add_columns=True, add_html=True)
    with open("fixture.json", "wt") as fp:
        json.dump(res, fp)
