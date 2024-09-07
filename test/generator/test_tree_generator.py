"""
Generic tree generator for test data.
"""

from tree_generator import RangeRandomizer, TextRandomizer, build_random_tree


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
tree = build_random_tree(structure_definition)
tree.print()
