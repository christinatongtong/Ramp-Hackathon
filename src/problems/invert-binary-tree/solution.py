"""Instrumented recursive inversion of a binary tree."""

from __future__ import annotations

from collections import deque
from typing import Any


def solve(root: list[int | None] | None) -> dict[str, Any]:
    values = list(root or [])
    node_ids = [f"n{index}" if value is not None else None for index, value in enumerate(values)]
    nodes = [
        {"id": node_id, "value": value, "left": None, "right": None}
        for node_id, value in zip(node_ids, values)
        if node_id is not None
    ]
    nodes_by_id = {node["id"]: node for node in nodes}
    root_id = node_ids[0] if node_ids else None
    pending: deque[str] = deque([root_id] if root_id is not None else [])
    value_index = 1
    while pending and value_index < len(values):
        parent_id = pending.popleft()
        for side in ("left", "right"):
            if value_index >= len(values):
                break
            child_id = node_ids[value_index]
            nodes_by_id[parent_id][side] = child_id
            if child_id is not None:
                pending.append(child_id)
            value_index += 1
    children = {
        node["id"]: {"left": node["left"], "right": node["right"]} for node in nodes
    }
    events: list[dict[str, Any]] = []

    def emit(event_type: str, **payload: Any) -> None:
        events.append({"type": event_type, **payload})

    emit("init", structure="binary_tree", nodes=nodes, rootId=root_id)

    def invert(node_id: str | None) -> None:
        if node_id is None:
            return
        emit("node_visit", nodeId=node_id)
        old_left = children[node_id]["left"]
        old_right = children[node_id]["right"]
        children[node_id]["left"] = old_right
        children[node_id]["right"] = old_left
        emit(
            "child_swap",
            nodeId=node_id,
            oldLeft=old_left,
            oldRight=old_right,
            newLeft=old_right,
            newRight=old_left,
        )
        invert(old_right)
        invert(old_left)
        emit("subtree_complete", nodeId=node_id)

    invert(root_id)

    def level_order() -> list[int | None]:
        if root_id is None:
            return []
        ordered: list[int | None] = []
        values_by_id = {node["id"]: node["value"] for node in nodes}
        queue: deque[str | None] = deque([root_id])
        while queue:
            node_id = queue.popleft()
            if node_id is None:
                ordered.append(None)
                continue
            ordered.append(values_by_id[node_id])
            queue.append(children[node_id]["left"])
            queue.append(children[node_id]["right"])
        while ordered and ordered[-1] is None:
            ordered.pop()
        return ordered

    result = level_order()
    final_state = {
        "structure": "binary_tree",
        "nodes": [
            {
                "id": node["id"],
                "value": node["value"],
                "left": children[node["id"]]["left"],
                "right": children[node["id"]]["right"],
            }
            for node in nodes
        ],
        "rootId": root_id,
    }
    emit("done", result=result)
    return {"result": result, "events": events, "finalState": final_state}
