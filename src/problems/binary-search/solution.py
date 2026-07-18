"""Instrumented binary search — emits array structure events."""

from __future__ import annotations

from copy import deepcopy
from typing import Any


def solve(nums: list[int], target: int) -> dict[str, Any]:
    nums = list(nums)
    events: list[dict[str, Any]] = []

    def emit(event_type: str, **payload: Any) -> None:
        events.append({"type": event_type, **payload})

    emit("init", structure="array", values=deepcopy(nums), target=target)

    left, right = 0, len(nums) - 1
    emit("pointer_move", pointer="left", to=left)
    emit("pointer_move", pointer="right", to=right)
    emit("range_highlight", left=left, right=right)

    result = -1
    while left <= right:
        mid = (left + right) // 2
        emit("pointer_move", pointer="mid", to=mid)
        emit(
            "compare",
            indices=[mid],
            mid=mid,
            mid_value=nums[mid],
            target=target,
        )

        if nums[mid] == target:
            result = mid
            emit("element_finalize", index=mid, value=nums[mid])
            break
        if nums[mid] < target:
            left = mid + 1
            emit("pointer_move", pointer="left", to=left)
        else:
            right = mid - 1
            emit("pointer_move", pointer="right", to=right)

        if left <= right:
            emit("window_shrink", left=left, right=right)
            emit("range_highlight", left=left, right=right)

    emit("done", result=result)
    return {
        "result": result,
        "events": events,
        "finalState": {"values": nums, "index": result},
    }
