from abc import ABC, abstractmethod
from collections import Counter
from datetime import date, datetime, timedelta
from enum import Enum
import json
import random
from typing import Any, Sequence, Union

from fabulist import Fabulist
from nutree.tree import Tree


fab = Fabulist()


class FileFormat(Enum):
    nested = "nested"
    flat = "flat"


class Automatic:
    """Argument value that triggers automatic calculation."""


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
    if n < 800:
        return str(n)
    if n < 900000:
        return f"{round(n / 1000)}k"
    return f"{round(n / 1000000)}M"


# for n in (1, 32, 90, 100, 110, 532, 999, 1000, 1001, 2045, 98000, 101000, 300000):
#     print(n, rounded_number(n))


def generate_tree(spec_list):
    """
    Return a randomized tree structure in uncompressed, nested format.
    """
    tree = _make_tree(spec_list=spec_list)
    if tree.count < 110:
        tree.print()
    # print(f"Generated tree with {len(tree):,} nodes, depth: {tree.calc_height()}")

    child_list = tree.to_dict(mapper=WbNode.serialize_mapper)
    tree_data = {
        "child_list": child_list,
        "node_count": len(tree),
        "node_count_disp": _rounded_number(len(tree)),
        "depth": tree.calc_height(),
    }
    return tree_data


def _iter_dict_pre_order(child_list: list):
    """Depth-first, pre-order iterator."""
    idx = 0

    def _iter(child_list: list, parent_idx):
        nonlocal idx

        for c in child_list:
            # Get 'children' before caller renames to short name
            cl = c.get("children")
            yield parent_idx, c
            idx += 1
            if cl:
                yield from _iter(cl, idx - 1)
        return

    yield from _iter(child_list, None)


def compress_child_list(
    child_list: list,
    *,
    format: FileFormat,
    types: dict = None,
    columns: list = None,
    key_map: dict = Automatic,
    positional: list = Automatic,
    auto_compress=True,
) -> dict:
    """
    Convert a child_list that was created by `generate_tree()`.

    1. Optionally convert nested child list to flat parent-referencong list
    2. Shorten node dict keys using a `keyMap`
    3. In flat mode
    """
    if type(child_list) is not list:
        raise RuntimeError(f"Expected JSON list (not {type(child_list)})")
    #: Available short type names
    avail_short_names = list("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

    RESERVED_SHORT_NAMES = {
        "title": "t",
        "type": "y",
        "children": "c",
        "key": "k",
        "refKey": "r",
        "selected": "s",
        "expanded": "e",
    }
    for short in RESERVED_SHORT_NAMES.values():
        avail_short_names.remove(short)

    if auto_compress and key_map is Automatic:
        # Reserve some short names for well-known attributes
        key_map = {}
    else:
        key_map = key_map.copy()

    #: Map full_name -> short_name
    inverse_key_map = {v: k for k, v in key_map.items()}

    # Remove used short names from list of available abbreviations
    for short in key_map.keys():
        if len(short) == 1:
            # Raises ValueError if key_map contains a reserved abbrev.
            avail_short_names.remove(short)

    if auto_compress and positional is Automatic:
        positional = ["title", "type"]
    if positional:
        positional = list(positional)  # don't want <dict_keys> type
        if "children" in positional:
            positional.remove("children")

    #: Occurrence counter of (long) attribute names
    attr_counts = Counter()
    #: Flat node list (used for)
    node_list = []
    #: Map type_name -> type_idx
    type_map = {}
    #: List of type names. The index into this list will be used.
    type_list = []

    # ----------
    # Pass 1: collect used attribute and type names

    for parent_idx, node in _iter_dict_pre_order(child_list):
        # Build/update key_map / inverse_key_map
        for attr in node.keys():
            attr_counts[attr] += 1
            if attr not in inverse_key_map:
                if attr in RESERVED_SHORT_NAMES:
                    short = RESERVED_SHORT_NAMES[attr]
                else:
                    short = avail_short_names.pop(0)
                inverse_key_map[attr] = short
                key_map[short] = attr

        # Build/update type_map & type_list
        node_type = node.get("type")
        if node_type and node_type not in type_map:
            type_idx = len(type_list)
            type_list.append(node_type)
            type_map[node_type] = type_idx

    #: Short names of attrs that are passed as posiotional arg
    positional_short_names = [inverse_key_map.get(p, p) for p in positional]
    positional_short_names_set = set(positional_short_names)

    # ----------
    # Pass 2: collect used attribute and type names

    for parent_idx, node in _iter_dict_pre_order(child_list):
        # Replace `"type": "TYPE_NAME"` with `"type": INDEX`
        node_type = node.get("type")
        if node_type:
            type_idx = type_map.get(node_type)
            node["type"] = type_idx

        # Replace `"FULL_NAME": VALUE` with `"SHORT_NAME": VALUE`
        for attr, val in list(node.items()):
            short = inverse_key_map.get(attr)
            if short:
                node[short] = val
                del node[attr]

        if format == FileFormat.flat:
            pos_args = [node.get(p) for p in positional_short_names]
            key_args = {
                k: v for k, v in node.items() if k not in positional_short_names_set
            }
            key_args.pop(inverse_key_map.get("children", "children"), None)
            if key_args:
                elem = (parent_idx, pos_args, key_args)
            else:
                elem = (parent_idx, pos_args)
            node_list.append(elem)
        # else:
        #     node =

    if format == FileFormat.flat:
        children = node_list
    else:
        children = child_list

    print("Attribute usage:", attr_counts)
    # print("inverse_key_map:", inverse_key_map)
    # print("positional:", positional)
    # print("positional_short_names:", positional_short_names)
    # print("type_map:", type_map)
    # print("type_list:", type_list)
    # print("key_map:", key_map)
    # print("node_list:", node_list)

    # Declare complete dict here, so we can control the order
    res = {
        "_format": format.value,
        # "_version": 1,
        "types": types,
        "columns": columns,
        "_valueMap": {"type": type_list},
        # "_typeList": type_list,
        "_keyMap": key_map,
        "_positional": positional,
        "children": children,
    }
    if format != FileFormat.flat:
        res.pop("_positional")
    # pprint(res)
    return res


def compress_source_file(file_path, *, key_map: dict) -> dict:
    with open(file_path, "rt") as fp:
        source = json.load(fp)
    return compress_child_list(source, key_map=key_map)


if __name__ == "__main__":
    raise RuntimeError("Run `python make_fixture.py` instead.")
