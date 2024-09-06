"""
Generate hierachical test data from a structure definition.
"""

from abc import ABC, abstractmethod

from datetime import date, datetime, timedelta
import random
from typing import Any, Sequence, Union

from fabulist import Fabulist
from nutree.typed_tree import TypedTree, TypedNode


fab = Fabulist()


class Automatic:
    """Argument value that triggers automatic calculation."""


# ------------------------------------------------------------------------------
# Randomizers
# ------------------------------------------------------------------------------
class Randomizer(ABC):
    def __init__(self, *, probability: float = None) -> None:
        assert (
            probability is None or 0.0 < probability < 1.0
        ), f"probality must be in the range [0.0 .. 1.0] or None: {probability}"
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
        probability: float = None,
        none_value: Any = None,
    ) -> None:
        super().__init__(probability=probability)
        assert type(min_val) is type(max_val)
        self.is_float = type(min_val) is float
        self.min = min_val
        self.max = max_val
        self.none_value = none_value
        assert self.max > self.min

    def generate(self) -> Union[float, int, None]:
        if self._skip_value():
            return self.none_value
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


class SparseBoolRandomizer(ValueRandomizer):
    def __init__(self, *, probability: float = None) -> None:
        super().__init__(True, probability=probability)


class TextRandomizer(Randomizer):
    def __init__(self, template: str | list, *, probability: float = None) -> None:
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


def resolve_random_dict(d: dict, *, macros: dict = None) -> None:
    remove = []
    for key in d.keys():
        val = d[key]

        if isinstance(val, Randomizer):
            val = val.generate()
            if val is None:  # Skip due to probability
                remove.append(key)
            else:
                d[key] = val

        if macros and isinstance(val, str):
            d[key] = val.format(**macros)

    for key in remove:
        d.pop(key)
    return


# ------------------------------------------------------------------------------
# Default data object
# ------------------------------------------------------------------------------


class NodeData:
    """Used as `node.data` instance in nutree.

    This is used as factory class

    See https://github.com/mar10/nutree
    """

    def __init__(self, **values) -> None:
        self.values: dict = values

    def __repr__(self):
        return f"{self.__class__.__name__}<{self.values}>"

    @staticmethod
    def serialize_mapper(nutree_node, data):
        return nutree_node.data.copy()


# ------------------------------------------------------------------------------
# Tree Builder
# ------------------------------------------------------------------------------


def _merge_specs(node_type: str, spec: dict, types: dict) -> dict:
    res = types.get("*", {}).copy()
    res.update(types.get(node_type, {}))
    res.update(spec)
    return res


def _make_tree(
    *,
    parent_node: TypedNode,
    parent_type: str,
    types: dict,
    relations: dict,
    prefix: str,
):
    """Return a nutree.TypedTree with random data from a specification.

    See https://github.com/mar10/nutree
    """
    child_specs = relations[parent_type]

    for node_type, spec in child_specs.items():
        spec = _merge_specs(node_type, spec, types)
        count = spec.pop(":count", 1)
        count = resolve_random(count)
        callback = spec.pop(":callback", None)
        factory = spec.pop(":factory", NodeData)

        for i in range(count):
            i += 1  # 1-based
            p = f"{prefix}.{i}" if prefix else f"{i}"

            # Resolve `Randomizer` values and resolve `{prefix}` and `{i}` macros
            data = spec.copy()

            resolve_random_dict(data, macros={"i": i, "prefix": p})

            if callback:
                callback(data)

            node_data = factory(**data)

            node = parent_node.add_child(node_data, kind=node_type)

            # Generate child relations
            if node_type in relations:
                _make_tree(
                    parent_node=node,
                    parent_type=node_type,
                    types=types,
                    relations=relations,
                    prefix=p,
                )

    return


def generate_tree(structure_def: dict) -> TypedTree:
    """
    Return a nutree.TypedTree with random data from a specification.

    See https://github.com/mar10/nutree
    """
    name = structure_def.pop("name", None)
    tree = TypedTree(name=name)
    types = structure_def.pop("types", {})
    relations = structure_def.pop("relations")
    assert not structure_def, f"found extra data: {structure_def}"
    assert "__root__" in relations, "missing '__root__' relation"

    _make_tree(
        parent_node=tree.system_root,
        parent_type="__root__",
        types=types,
        relations=relations,
        prefix="",
    )

    return tree
