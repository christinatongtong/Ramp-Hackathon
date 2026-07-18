"""Linked-list JSON ↔ ListNode codec."""

from __future__ import annotations

from typing import Any


class ListNode:
    def __init__(self, val: int = 0, next: "ListNode | None" = None) -> None:
        self.val = val
        self.next = next


class LinkedListCodec:
    def decode(self, values: Any) -> ListNode | None:
        if values is None:
            return None
        if not isinstance(values, list):
            raise TypeError("linked_list decode expects a JSON array or null")
        dummy = ListNode()
        current = dummy
        for value in values:
            current.next = ListNode(value)
            current = current.next
        return dummy.next

    def encode(self, head: Any) -> list[Any]:
        if head is None:
            return []
        values: list[Any] = []
        seen: set[int] = set()
        while head is not None:
            node_id = id(head)
            if node_id in seen:
                raise ValueError("Cycle detected while serializing linked list")
            seen.add(node_id)
            values.append(getattr(head, "val", head))
            head = getattr(head, "next", None)
        return values

    def normalize(self, value: Any) -> list[Any]:
        if value is None:
            return []
        if isinstance(value, list):
            return list(value)
        return self.encode(value)
