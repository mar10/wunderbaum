"""
Implements a generator that creates a random tree structure from a specification.

Returns a nutree.TypedTree with random data from a specification.

Example:

```py
from tree_generator import RangeRandomizer, TextRandomizer, generate_tree


structure_definition = {
    "name": "fmea",
    #: Types define the default properties of the nodes
    "types": {
        #: Default properties for all node types
        # "*": {":factory": WbNode},
        #: Specific default properties for each node type
        "function": {"icon": "bi bi-gear"},
        "failure": {"icon": "bi bi-exclamation-triangle"},
        "cause": {"icon": "bi bi-tools"},
        "effect": {"icon": "bi bi-lightning"},
    },
    #: Relations define the possible parent / child relationships between
    #: node types and optionally override the default properties.
    "relations": {
        "__root__": {
            "function": {
                ":count": 10,
                "title": TextRandomizer(("{i}: Provide $(Noun:plural)",)),
                "expanded": True,
            },
        },
        "function": {
            "failure": {
                ":count": RangeRandomizer(1, 3),
                "title": TextRandomizer("$(Noun:plural) not provided"),
            },
        },
        "failure": {
            "cause": {
                ":count": RangeRandomizer(1, 3),
                "title": TextRandomizer("$(Noun:plural) not provided"),
            },
            "effect": {
                ":count": RangeRandomizer(1, 3),
                "title": TextRandomizer("$(Noun:plural) not provided"),
            },
        },
    },
}
tree = generate_tree(structure_definition)
tree.print()
```
"""

from abc import ABC, abstractmethod

from datetime import date, datetime, timedelta, timezone
import random
from typing import Any, Sequence, Union

from fabulist import Fabulist
from nutree.typed_tree import TypedTree, TypedNode


fab = Fabulist()


# ------------------------------------------------------------------------------
# Generic data object to be used when nutree.Node instances
# ------------------------------------------------------------------------------


class GenericNodeData:
    """Used as `node.data` instance in nutree.

    Initialized with a dictionary of values. The values can be accessed
    via the `node.data` attribute like `node.data["KEY"]`.
    If the Tree is initialized with `shadow_attrs=True`, the values are also
    available as attributes of the node like `node.KEY`.

    If the tree is serialized, the values are copied to the serialized data.

    Examples:

    ```py
    node = TypedNode(DictNodeData(a=1, b=2))
    tree.add_child(node)

    print(node.a)  # 1
    print(node.data["b"])  # 2
    ```

    Alternatively, the data can be initialized with a dictionary like this:
    ```py
    d = {"a": 1, "b": 2}
    node = TypedNode(DictNodeData(**d))
    ```

    See https://github.com/mar10/nutree
    """

    def __init__(self, **values) -> None:
        self.values: dict = values

    def __repr__(self):
        return f"{self.__class__.__name__}<{self.values}>"

    def __getitem__(self, key):
        return self.values[key]

    @staticmethod
    def serialize_mapper(nutree_node, data):
        return nutree_node.data.values.copy()


# ------------------------------------------------------------------------------
# Randomizers
# ------------------------------------------------------------------------------
class Randomizer(ABC):
    """
    Abstract base class for randomizers.
    Args:
        probability (float, optional): The probability of using the randomizer.
            Must be in the range [0.0, 1.0]. Defaults to 1.0.
    Attributes:
        probability (float): The probability of using the randomizer.
    """

    def __init__(self, *, probability: float = 1.0) -> None:
        assert (
            probability is None or 0.0 <= probability <= 1.0
        ), f"probality must be in the range [0.0 .. 1.0]: {probability}"
        self.probability = probability

    def _skip_value(self) -> bool:
        use = self.probability == 1.0 or random.random() <= self.probability
        return not use

    @abstractmethod
    def generate(self) -> Any: ...


class RangeRandomizer(Randomizer):
    def __init__(
        self,
        min_val: Union[float, int],
        max_val: Union[float, int],
        *,
        probability: float = 1.0,
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
        probability: float = 1.0,
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
        # print(self.min, self.max, self.delta_days, self.probability)
        if self._skip_value():
            # print("SKIP")
            return
        res = self.min + timedelta(days=random.randrange(self.delta_days))
        # print(res)
        if self.as_js_stamp:
            ONE_DAY_SEC = 24 * 60 * 60
            dt = datetime(res.year, res.month, res.day)
            # print(f"{dt=}")
            # print(f"{dt=}, {dt.timestamp()=}")
            dt_utc = dt.replace(tzinfo=timezone.utc)
            stamp_ms = (dt_utc.timestamp() + ONE_DAY_SEC) * 1000.0
            # print(self.min, self.max, self.delta_days, res, stamp_ms)
            res = stamp_ms
        return res


class ValueRandomizer(Randomizer):
    def __init__(self, value: Any, *, probability: float = 1.0) -> None:
        super().__init__(probability=probability)
        self.value = value

    def generate(self) -> Any:
        if self._skip_value():
            return
        return self.value


class SparseBoolRandomizer(ValueRandomizer):
    def __init__(self, *, probability: float = 1.0) -> None:
        super().__init__(True, probability=probability)


class TextRandomizer(Randomizer):
    def __init__(self, template: str | list, *, probability: float = 1.0) -> None:
        super().__init__(probability=probability)
        self.template = template

    def generate(self) -> Any:
        if self._skip_value():
            return
        return fab.get_quote(self.template)


class SampleRandomizer(Randomizer):
    def __init__(
        self, sample_list: Sequence, *, counts=None, probability: float = 1.0
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


def _resolve_random(val: Any) -> Any:
    if isinstance(val, Randomizer):
        return val.generate()
    return val


def _resolve_random_dict(d: dict, *, macros: dict = None) -> None:
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
    child_specs = relations[parent_type]

    for node_type, spec in child_specs.items():
        spec = _merge_specs(node_type, spec, types)
        count = spec.pop(":count", 1)
        count = _resolve_random(count) or 0
        callback = spec.pop(":callback", None)
        factory = spec.pop(":factory", GenericNodeData)

        for i in range(count):
            i += 1  # 1-based
            p = f"{prefix}.{i}" if prefix else f"{i}"

            # Resolve `Randomizer` values and resolve `{prefix}` and `{i}` macros
            data = spec.copy()

            _resolve_random_dict(data, macros={"i": i, "prefix": p})

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


def build_random_tree(structure_def: dict) -> TypedTree:
    """
    Return a nutree.TypedTree with random data from a specification.
    """
    name = structure_def.pop("name", None)

    tree = TypedTree(name=name, shadow_attrs=True)

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
