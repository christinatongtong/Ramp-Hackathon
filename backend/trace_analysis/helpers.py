"""Shared scalar collection helpers (no circular imports)."""

from __future__ import annotations

from typing import Any

from backend.schemas import ExecutionResult, SceneType


def collect_scalar_values(value: Any, into: set[str]) -> None:
    if isinstance(value, list):
        for item in value:
            collect_scalar_values(item, into)
        return
    if isinstance(value, (str, int, float, bool)):
        into.add(str(value))


def detect_structure(execution: ExecutionResult) -> SceneType:
    for event in execution.events:
        if not isinstance(event, dict):
            continue
        if event.get("type") != "init":
            continue
        structure = event.get("structure")
        if structure in {
            "array",
            "grid",
            "linked_list",
            "binary_tree",
            "graph",
        }:
            return structure  # type: ignore[return-value]

    initial = execution.initialState
    if isinstance(initial.get("nodes"), list) and initial.get("headId") is not None:
        return "linked_list"
    if isinstance(initial.get("nodes"), list) and initial.get("rootId") is not None:
        return "binary_tree"
    if isinstance(initial.get("nodes"), list) and isinstance(initial.get("edges"), list):
        return "graph"
    if isinstance(initial.get("values"), list):
        return "array"
    nums = initial.get("nums")
    if isinstance(nums, list) and nums and not isinstance(nums[0], list):
        return "array"
    return "grid"
