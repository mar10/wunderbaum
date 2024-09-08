"""
Generate a test data fixture for the tree viewer.

Implements a generator that creates a random tree structure from a specification.

Example:

```py
structure_definition = {
    ...
}
random_tree: nutree.TypedTree = generate_tree(structure_definition)
```

See `make_fixture.py` for more examples.
See `test_tree_generator.py` for details.
"""

from collections import Counter
from enum import Enum
import json

from tree_generator import GenericNodeData, build_random_tree


class FileFormat(Enum):
    nested = "nested"
    flat = "flat"


class Automatic:
    """Argument value that triggers automatic calculation."""


#: Preferred mappings for auto-compression (_keyMap)
RESERVED_SHORT_NAMES = {
    "title": "t",
    "type": "y",
    "children": "c",
    "key": "k",
    "refKey": "r",
    "selected": "s",
    "expanded": "e",
}

#: Node properties that are of type bool (or boolean & string).
#: When parsing, we accept 0 for false and 1 for true for better JSON compression.
COMPRESSABLE_BOOLS = {
    "checkbox",
    "colspan",
    "expanded",
    "icon",
    "iconTooltip",
    "radiogroup",
    "selected",
    "tooltip",
    "unselectable",
}


def _rounded_number(n: int) -> str:
    if n < 800:
        return str(n)
    if n < 900_000:
        return f"{round(n / 1_000)}k"
    return f"{round(n / 1_000_000)}M"


# for n in (1, 32, 90, 100, 110, 532, 999, 1000, 1001, 2045, 98000, 101000, 300000):
#     print(n, rounded_number(n))


def generate_random_wb_source(structure_definition: dict):
    """
    Return a randomized tree structure in uncompressed, nested format.
    """
    # Generate a random nutree.TypedTree structure
    tree = build_random_tree(structure_definition)
    # tree.print()
    # if tree.count < 110:
    #     tree.print()
    # print(f"Generated tree with {len(tree):,} nodes, depth: {tree.calc_height()}")

    # nutree generator uses GenericNodeData as default node type and we rely on it
    defaults = structure_definition.get("types", {}).get("*", {})
    assert defaults.get(":factory") in (None, GenericNodeData)

    child_list = tree.to_dict_list(mapper=GenericNodeData.serialize_mapper)
    random_struct = {
        "child_list": child_list,
        "node_count": len(tree),
        "node_count_disp": _rounded_number(len(tree)),
        "depth": tree.calc_height(),
    }
    return random_struct


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
    key_map: dict | Automatic = Automatic,
    positional: list | Automatic = Automatic,
    auto_compress=True,
    auto_compress_bool: set | None = None,
) -> dict:
    """
    Convert a child_list that was created by `generate_tree()`.

    1. Optionally convert nested child list to flat parent-referencong list
    2. Shorten node dict keys using a `keyMap`
    3. In flat mode
    """
    if type(child_list) is not list:
        raise RuntimeError(f"Expected JSON list (not {child_list!r})")
    #: Available short type names
    avail_short_names = list("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

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
    seq = 0
    for parent_idx, node in _iter_dict_pre_order(child_list):
        # Build/update key_map / inverse_key_map
        for attr in node.keys():
            attr_counts[attr] += 1
            if attr not in inverse_key_map:
                if attr in RESERVED_SHORT_NAMES:
                    short = RESERVED_SHORT_NAMES[attr]
                else:
                    # Try to dreive the short name from first char
                    first_char_uc = attr[0].upper()
                    first_char_lc = attr[0].lower()
                    if first_char_uc in avail_short_names:
                        short = first_char_uc
                        avail_short_names.remove(first_char_uc)
                    elif first_char_lc.lower() in avail_short_names:
                        short = first_char_lc
                        avail_short_names.remove(first_char_lc)
                    elif avail_short_names:
                        short = avail_short_names.pop(0)
                    else:  # we are out of single-character short names
                        seq += 1
                        short = f"_{seq}"
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
        "_keyMap": inverse_key_map,  # since v0.7.0
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
