"""Graph adjacency-list codec (pass-through with light validation)."""

from __future__ import annotations

from typing import Any


class GraphCodec:
    """Normalize LeetCode-style adjacency lists.

    Expected JSON shape: list[list[int]] (neighbors per node index).
    """

    def decode(self, value: Any) -> list[list[Any]]:
        return self.normalize(value)

    def encode(self, value: Any) -> list[list[Any]]:
        return self.normalize(value)

    def normalize(self, value: Any) -> list[list[Any]]:
        if value is None:
            return []
        if not isinstance(value, list):
            raise TypeError("graph codec expects an adjacency list")
        result: list[list[Any]] = []
        for row in value:
            if not isinstance(row, list):
                raise TypeError("graph adjacency row must be a list")
            result.append(list(row))
        return result
