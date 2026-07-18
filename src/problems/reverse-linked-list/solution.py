"""Instrumented iterative reversal for a singly linked list."""

from __future__ import annotations

from typing import Any


def solve(head: list[int] | None) -> dict[str, Any]:
    values = list(head or [])
    nodes = [
        {
            "id": f"n{index}",
            "value": value,
            "next": f"n{index + 1}" if index + 1 < len(values) else None,
        }
        for index, value in enumerate(values)
    ]
    next_by_id = {node["id"]: node["next"] for node in nodes}
    events: list[dict[str, Any]] = []

    def emit(event_type: str, **payload: Any) -> None:
        events.append({"type": event_type, **payload})

    initial_head = "n0" if nodes else None
    emit(
        "init",
        structure="linked_list",
        nodes=[{**node} for node in nodes],
        headId=initial_head,
    )

    prev_id: str | None = None
    current_id = initial_head
    emit("pointer_set", pointer="prev", nodeId=prev_id)
    emit("pointer_set", pointer="curr", nodeId=current_id)

    while current_id is not None:
        next_id = next_by_id[current_id]
        emit("node_visit", nodeId=current_id)
        emit("pointer_set", pointer="next", nodeId=next_id)
        old_next = next_by_id[current_id]
        emit(
            "link_update",
            nodeId=current_id,
            oldNext=old_next,
            newNext=prev_id,
        )
        next_by_id[current_id] = prev_id
        emit("node_finalize", nodeId=current_id)
        from_prev, from_curr = prev_id, current_id
        prev_id = current_id
        current_id = next_id
        emit(
            "pointer_move",
            pointer="prev",
            fromNodeId=from_prev,
            toNodeId=prev_id,
            nodeId=prev_id,
        )
        emit(
            "pointer_move",
            pointer="curr",
            fromNodeId=from_curr,
            toNodeId=current_id,
            nodeId=current_id,
        )

    result = list(reversed(values))
    final_state = {
        "structure": "linked_list",
        "nodes": [
            {"id": node["id"], "value": node["value"], "next": next_by_id[node["id"]]}
            for node in nodes
        ],
        "headId": prev_id,
    }
    emit("done", result=result, headId=prev_id)
    return {"result": result, "events": events, "finalState": final_state}
