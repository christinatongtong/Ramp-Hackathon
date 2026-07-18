"""Normalize problem inputs into structure-aware initial animation state."""

from __future__ import annotations

from collections import deque
from copy import deepcopy
from typing import Any


def scene_type_from_config(config: dict[str, Any] | None) -> str:
    if not isinstance(config, dict):
        return "grid"
    scene = config.get("scene") or {}
    if isinstance(scene, dict) and scene.get("type"):
        return str(scene["type"])
    return "grid"


def input_key_from_config(config: dict[str, Any] | None, scene_type: str) -> str:
    if isinstance(config, dict):
        scene = config.get("scene") or {}
        if isinstance(scene, dict) and scene.get("inputKey"):
            return str(scene["inputKey"])
        entry = config.get("entrypoint") or {}
        if isinstance(entry, dict):
            args = entry.get("arguments") or []
            if isinstance(args, list) and args:
                return str(args[0])
    defaults = {
        "array": "nums",
        "linked_list": "head",
        "binary_tree": "root",
        "graph": "numCourses",
    }
    return defaults.get(scene_type, "grid")


def _list_nodes_from_values(values: list[Any]) -> tuple[list[dict[str, Any]], str | None]:
    nodes = [
        {
            "id": f"n{index}",
            "value": value,
            "next": f"n{index + 1}" if index + 1 < len(values) else None,
        }
        for index, value in enumerate(values)
    ]
    return nodes, ("n0" if nodes else None)


def _tree_nodes_from_level_order(
    values: list[Any],
) -> tuple[list[dict[str, Any]], str | None]:
    if not values or values[0] is None:
        return [], None
    node_ids = [
        f"n{index}" if value is not None else None
        for index, value in enumerate(values)
    ]
    nodes = [
        {"id": node_id, "value": value, "left": None, "right": None}
        for node_id, value in zip(node_ids, values)
        if node_id is not None
    ]
    by_id = {node["id"]: node for node in nodes}
    root_id = node_ids[0]
    pending: deque[str] = deque([root_id] if root_id else [])
    value_index = 1
    while pending and value_index < len(values):
        parent_id = pending.popleft()
        for side in ("left", "right"):
            if value_index >= len(values):
                break
            child_id = node_ids[value_index]
            by_id[parent_id][side] = child_id
            if child_id is not None:
                pending.append(child_id)
            value_index += 1
    return nodes, root_id


def build_initial_state(
    initial_input: Any,
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Map example input into the shape compilers expect."""

    scene_type = scene_type_from_config(config)
    input_key = input_key_from_config(config, scene_type)

    if isinstance(initial_input, dict):
        state = deepcopy(initial_input)
        if scene_type == "array":
            if "values" not in state:
                raw = state.get(input_key)
                if isinstance(raw, list) and (
                    not raw or not isinstance(raw[0], list)
                ):
                    state["values"] = deepcopy(raw)
        elif scene_type == "linked_list":
            raw = state.get(input_key)
            if isinstance(raw, list):
                nodes, head_id = _list_nodes_from_values(raw)
                state["nodes"] = nodes
                state["headId"] = head_id
        elif scene_type == "binary_tree":
            raw = state.get(input_key)
            if isinstance(raw, list):
                nodes, root_id = _tree_nodes_from_level_order(raw)
                state["nodes"] = nodes
                state["rootId"] = root_id
        elif scene_type == "graph":
            num_courses = state.get("numCourses")
            prerequisites = state.get("prerequisites") or []
            if isinstance(num_courses, int):
                state["nodes"] = [
                    {"id": f"c{i}", "label": i, "colorState": "unvisited"}
                    for i in range(num_courses)
                ]
                edges = []
                indegrees = {f"c{i}": 0 for i in range(num_courses)}
                if isinstance(prerequisites, list):
                    for index, pair in enumerate(prerequisites):
                        if not isinstance(pair, list) or len(pair) < 2:
                            continue
                        course, prereq = pair[0], pair[1]
                        edges.append(
                            {
                                "id": f"e{index}",
                                "from": f"c{prereq}",
                                "to": f"c{course}",
                            }
                        )
                        indegrees[f"c{course}"] = indegrees.get(f"c{course}", 0) + 1
                state["edges"] = edges
                state["indegrees"] = indegrees
        elif "grid" not in state and input_key in state:
            state["grid"] = deepcopy(state[input_key])
        return state

    if isinstance(initial_input, list):
        if scene_type == "array":
            if (
                len(initial_input) >= 1
                and isinstance(initial_input[0], list)
                and (
                    not initial_input[0]
                    or not isinstance(initial_input[0][0], list)
                )
            ):
                nums = deepcopy(initial_input[0])
                state = {"values": nums, input_key: nums}
                if len(initial_input) > 1:
                    state["target"] = deepcopy(initial_input[1])
                return state
            if not initial_input or not isinstance(initial_input[0], list):
                nums = deepcopy(initial_input)
                return {"values": nums, input_key: nums}
        if scene_type == "linked_list":
            nodes, head_id = _list_nodes_from_values(initial_input)
            return {"head": deepcopy(initial_input), "nodes": nodes, "headId": head_id}
        if scene_type == "binary_tree":
            nodes, root_id = _tree_nodes_from_level_order(initial_input)
            return {"root": deepcopy(initial_input), "nodes": nodes, "rootId": root_id}
        return {"grid": deepcopy(initial_input)}

    return {"input": deepcopy(initial_input)}
