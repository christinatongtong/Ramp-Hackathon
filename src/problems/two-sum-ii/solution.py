"""Instrumented two-pointer solution for Two Sum II.

Emits array structure events already supported by the shared ArrayScene compiler:
init, pointer_move, range_highlight, compare, window_shrink, element_finalize, done.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any


def solve(numbers: list[int], target: int) -> dict[str, Any]:
    numbers = list(numbers)
    events: list[dict[str, Any]] = []

    def emit(event_type: str, **payload: Any) -> None:
        events.append({"type": event_type, **payload})

    emit("init", structure="array", values=deepcopy(numbers), target=target)

    left, right = 0, len(numbers) - 1
    emit("pointer_move", pointer="left", to=left)
    emit("pointer_move", pointer="right", to=right)
    emit("range_highlight", left=left, right=right)

    result: list[int] = []
    while left < right:
        total = numbers[left] + numbers[right]
        emit(
            "compare",
            indices=[left, right],
            value=total,
            target=target,
            left_value=numbers[left],
            right_value=numbers[right],
        )

        if total == target:
            # Emit per-index finalize so the shared compiler (index field) works.
            emit("element_finalize", index=left, value=numbers[left])
            emit("element_finalize", index=right, value=numbers[right])
            result = [left + 1, right + 1]
            break

        if total < target:
            prev = left
            left = left + 1
            emit("pointer_move", pointer="left", to=left, **{"from": prev})
        else:
            prev = right
            right = right - 1
            emit("pointer_move", pointer="right", to=right, **{"from": prev})

        if left < right:
            emit("window_shrink", left=left, right=right)
            emit("range_highlight", left=left, right=right)

    emit("done", result=result)
    return {
        "result": result,
        "events": events,
        "finalState": {"values": numbers, "indices": result},
    }
