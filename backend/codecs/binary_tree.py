"""Binary-tree JSON ↔ TreeNode codec (level-order with nulls)."""

from __future__ import annotations

from collections import deque
from typing import Any


class TreeNode:
    def __init__(
        self,
        val: int = 0,
        left: "TreeNode | None" = None,
        right: "TreeNode | None" = None,
    ) -> None:
        self.val = val
        self.left = left
        self.right = right


class BinaryTreeCodec:
    def decode(self, values: Any) -> TreeNode | None:
        if values is None:
            return None
        if not isinstance(values, list):
            raise TypeError("binary_tree decode expects a JSON array or null")
        if not values:
            return None
        if values[0] is None:
            return None

        root = TreeNode(values[0])
        queue: deque[TreeNode] = deque([root])
        index = 1
        while queue and index < len(values):
            node = queue.popleft()
            if index < len(values) and values[index] is not None:
                node.left = TreeNode(values[index])
                queue.append(node.left)
            index += 1
            if index < len(values) and values[index] is not None:
                node.right = TreeNode(values[index])
                queue.append(node.right)
            index += 1
        return root

    def encode(self, root: Any) -> list[Any] | None:
        if root is None:
            return None
        values: list[Any] = []
        queue: deque[Any] = deque([root])
        while queue:
            node = queue.popleft()
            if node is None:
                values.append(None)
                continue
            values.append(getattr(node, "val", None))
            queue.append(getattr(node, "left", None))
            queue.append(getattr(node, "right", None))
        while values and values[-1] is None:
            values.pop()
        return values

    def normalize(self, value: Any) -> list[Any] | None:
        if value is None:
            return None
        if isinstance(value, list):
            return list(value)
        return self.encode(value)
