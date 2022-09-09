from abc import ABC, abstractmethod
from datetime import date, datetime, timedelta
import json
from math import ceil
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
        assert self.max > self.min

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
            ONE_DAY_SEC = 24 * 60 * 60
            dt = datetime(res.year, res.month, res.day)
            stamp_ms = (dt.timestamp() + ONE_DAY_SEC) * 1000.0
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


def _make_tree(*, spec_list, parent=None, prefix=""):
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
            _make_tree(parent=node, spec_list=spec_list, prefix=p)
    return parent


def _rounded_number(n: int) -> str:
    if n < 900:
        return str(n)
    if n < 900000:
        return f"{round(n / 1000)}k"
    return f"{round(n / 1000000)}M"


# for n in (1, 32, 90, 100, 110, 532, 999, 1000, 1001, 2045, 98000, 101000, 300000):
#     print(n, rounded_number(n))


def generate_tree(spec_list):
    tree = _make_tree(spec_list=spec_list)
    if tree.count < 110:
        tree.print()
    # print(f"Generated tree with {len(tree):,} nodes, depth: {tree.calc_height()}")

    child_list = tree.to_dict(mapper=WbNode.serialize_mapper)
    res = {
        "child_list": child_list,
        "node_count": len(tree),
        "node_count_disp": _rounded_number(len(tree)),
        "depth": tree.calc_height(),
    }
    return res


if __name__ == "__main__":
    raise RuntimeError("Run `python make_fixture.py` instead.")
