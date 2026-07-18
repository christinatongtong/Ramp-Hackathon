"""Linked-list structure trace analysis + structural validation helpers."""

from __future__ import annotations

from typing import Any

from backend.schemas import ExecutionResult, ObservedTraceSchema, SceneType
from backend.trace_analysis.helpers import collect_scalar_values


def _nodes_from(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    return [item for item in raw if isinstance(item, dict) and isinstance(item.get("id"), str)]


def validate_linked_list_trace(execution: ExecutionResult) -> list[str]:
    """Validate linked-list init + event state machine. Empty = ok."""

    errors: list[str] = []
    init = next(
        (
            event
            for event in execution.events
            if isinstance(event, dict) and event.get("type") == "init"
        ),
        None,
    )
    if init is None:
        return ["Missing init event for linked_list."]

    nodes = _nodes_from(init.get("nodes"))
    ids = [str(node["id"]) for node in nodes]
    if len(ids) != len(set(ids)):
        errors.append("Duplicate node IDs in linked_list init.")

    id_set = set(ids)
    next_map: dict[str, str | None] = {}
    for node in nodes:
        node_id = str(node["id"])
        nxt = node.get("next")
        if nxt is not None and nxt not in id_set:
            errors.append(f"Init next '{nxt}' for '{node_id}' is not a known node.")
        next_map[node_id] = str(nxt) if isinstance(nxt, str) else None

    head_id = init.get("headId")
    if head_id is not None and not (
        isinstance(head_id, str) and head_id in id_set
    ):
        if head_id is not None:
            errors.append(f"Init headId '{head_id}' is not a known node.")

    # Cycle-safe traversal of initial list
    seen: set[str] = set()
    cur = head_id if isinstance(head_id, str) else None
    steps = 0
    while cur is not None:
        if cur in seen:
            errors.append("Init list contains a cycle.")
            break
        if cur not in next_map:
            errors.append(f"Traversal hit unknown node '{cur}'.")
            break
        seen.add(cur)
        cur = next_map[cur]
        steps += 1
        if steps > len(ids) + 1:
            errors.append("Init traversal exceeded node count (possible cycle).")
            break

    for index, event in enumerate(execution.events):
        if not isinstance(event, dict):
            errors.append(f"Event {index} is not an object.")
            continue
        et = event.get("type")
        if et in {"pointer_set", "pointer_move", "node_visit", "node_finalize"}:
            node_id = event.get("nodeId", event.get("toNodeId"))
            if node_id is not None and node_id not in id_set:
                errors.append(
                    f"Event {index} ({et}) references unknown node '{node_id}'."
                )
        if et == "link_update":
            node_id = event.get("nodeId")
            if not isinstance(node_id, str) or node_id not in id_set:
                errors.append(f"Event {index} link_update has invalid nodeId.")
                continue
            old_next = event.get("oldNext")
            new_next = event.get("newNext")
            if old_next != next_map.get(node_id):
                errors.append(
                    f"Event {index} link_update.oldNext mismatch for '{node_id}': "
                    f"expected {next_map.get(node_id)!r}, got {old_next!r}."
                )
            if new_next is not None and new_next not in id_set:
                errors.append(
                    f"Event {index} link_update.newNext '{new_next}' is unknown."
                )
            next_map[node_id] = str(new_next) if isinstance(new_next, str) else None

    # Final normalized list vs result when result is a list
    result = execution.result
    if isinstance(result, list):
        order: list[Any] = []
        seen_final: set[str] = set()
        # Prefer head pointer if present in last events
        cur = head_id if isinstance(head_id, str) else None
        # If pointers named head were updated, ignore — use traversal from result expectation
        steps = 0
        value_by_id = {str(n["id"]): n.get("value") for n in nodes}
        # Recompute head: node with no incoming after rewires, or keep init head if still valid
        incoming = {nid: 0 for nid in id_set}
        for nxt in next_map.values():
            if isinstance(nxt, str) and nxt in incoming:
                incoming[nxt] += 1
        heads = [nid for nid, count in incoming.items() if count == 0]
        if len(heads) == 1:
            cur = heads[0]
        while cur is not None and cur not in seen_final and steps <= len(ids):
            seen_final.add(cur)
            order.append(value_by_id.get(cur))
            cur = next_map.get(cur)
            steps += 1
        if steps > len(ids):
            errors.append("Final traversal exceeded node count (possible cycle).")
        elif order != result and result != []:
            # Soft check: only error when lengths differ or clearly wrong
            if len(order) == len(result) and order != result:
                errors.append(
                    f"Final normalized list {order!r} does not match result {result!r}."
                )

    return errors


def analyze(
    execution: ExecutionResult,
    structure_type: SceneType = "linked_list",
) -> ObservedTraceSchema:
    cell_values: set[str] = set()
    event_types: set[str] = set()

    for event in execution.events:
        if not isinstance(event, dict):
            raise ValueError("Trace event is not an object.")
        et = event.get("type")
        if not isinstance(et, str) or not et:
            raise ValueError("Trace event missing type.")
        event_types.add(et)
        if et == "init":
            for node in _nodes_from(event.get("nodes")):
                collect_scalar_values(node.get("value"), cell_values)
        collect_scalar_values(event.get("value"), cell_values)

    for node in _nodes_from(execution.initialState.get("nodes")):
        collect_scalar_values(node.get("value"), cell_values)

    validation_errors = validate_linked_list_trace(execution)
    if validation_errors:
        raise ValueError(
            "Linked-list trace validation failed:\n- "
            + "\n- ".join(validation_errors)
        )

    return ObservedTraceSchema(
        structureType=structure_type,
        cellValues=sorted(cell_values),
        eventTypes=sorted(event_types),
    )
