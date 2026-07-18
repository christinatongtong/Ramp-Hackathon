"""Instrumented multi-source DFS for Pacific Atlantic Water Flow."""

from __future__ import annotations

from copy import deepcopy
from typing import Any


def solve(heights: list[list[int]]) -> dict[str, Any]:
    heights = deepcopy(heights)
    rows, cols = len(heights), len(heights[0])
    events: list[dict[str, Any]] = []

    def emit(event_type: str, **payload: Any) -> None:
        events.append({"type": event_type, **payload})

    emit("init", grid=deepcopy(heights))

    pacific: set[tuple[int, int]] = set()
    atlantic: set[tuple[int, int]] = set()

    def dfs(
        r: int,
        c: int,
        visited: set[tuple[int, int]],
        ocean: str,
        prev_height: int,
    ) -> None:
        if (
            r < 0
            or c < 0
            or r >= rows
            or c >= cols
            or (r, c) in visited
            or heights[r][c] < prev_height
        ):
            return
        visited.add((r, c))
        emit("visit", row=r, col=c, ocean=ocean, height=heights[r][c])
        h = heights[r][c]
        dfs(r + 1, c, visited, ocean, h)
        dfs(r - 1, c, visited, ocean, h)
        dfs(r, c + 1, visited, ocean, h)
        dfs(r, c - 1, visited, ocean, h)

    for c in range(cols):
        dfs(0, c, pacific, "pacific", heights[0][c])
        dfs(rows - 1, c, atlantic, "atlantic", heights[rows - 1][c])
    for r in range(rows):
        dfs(r, 0, pacific, "pacific", heights[r][0])
        dfs(r, cols - 1, atlantic, "atlantic", heights[r][cols - 1])

    both = sorted(pacific & atlantic)
    for r, c in both:
        emit("both", row=r, col=c)

    result = [[r, c] for r, c in both]
    emit("done", result=result)
    return {"result": result, "events": events, "finalGrid": heights}
