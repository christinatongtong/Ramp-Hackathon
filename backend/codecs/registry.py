"""Codec registry for entrypoint argument / return conversion."""

from __future__ import annotations

from typing import Any, Protocol

from backend.codecs import binary_tree, graph, linked_list


class StructureCodec(Protocol):
    def decode(self, value: Any) -> Any: ...

    def encode(self, value: Any) -> Any: ...

    def normalize(self, value: Any) -> Any: ...


_REGISTRY: dict[str, StructureCodec] = {
    "linked_list": linked_list.LinkedListCodec(),
    "binary_tree": binary_tree.BinaryTreeCodec(),
    "graph": graph.GraphCodec(),
}


def get_codec(name: str | None) -> StructureCodec | None:
    if not name:
        return None
    return _REGISTRY.get(name)


def list_codecs() -> list[str]:
    return sorted(_REGISTRY)
