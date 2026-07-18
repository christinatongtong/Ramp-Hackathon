"""Instrumented DFS flood-fill for Number of Islands."""

from __future__ import annotations

from copy import deepcopy
from typing import Any


def solve(grid: list[list[str]]) -> dict[str, Any]:
    grid = deepcopy(grid)
    rows, cols = len(grid), len(grid[0])
    events: list[dict[str, Any]] = []
    islands = 0

    def emit(event_type: str, **payload: Any) -> None:
        events.append({"type": event_type, **payload})

    emit("init", grid=deepcopy(grid))

    def dfs(r: int, c: int, island_id: int) -> None:
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
            return
        grid[r][c] = "#"
        emit(
            "visit",
            row=r,
            col=c,
            islandId=island_id,
            value="#",
        )
        dfs(r + 1, c, island_id)
        dfs(r - 1, c, island_id)
        dfs(r, c + 1, island_id)
        dfs(r, c - 1, island_id)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                islands += 1
                emit("island_start", row=r, col=c, islandId=islands)
                dfs(r, c, islands)
                emit("island_complete", islandId=islands)

    emit("done", result=islands)
    return {"result": islands, "events": events, "finalGrid": grid}
