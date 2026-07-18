"""Instrumented DFS flood-fill for Number of Islands.

Emits the shared grid-event vocabulary understood by compileTimeline.
"""

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

    emit("init", structure="grid", grid=deepcopy(grid))

    def dfs(r: int, c: int, island_id: int, cells: list[list[int]]) -> None:
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
            return
        grid[r][c] = "#"
        cells.append([r, c])
        emit(
            "visit",
            row=r,
            col=c,
            islandId=island_id,
            value="#",
        )
        dfs(r + 1, c, island_id, cells)
        dfs(r - 1, c, island_id, cells)
        dfs(r, c + 1, island_id, cells)
        dfs(r, c - 1, island_id, cells)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                islands += 1
                cells: list[list[int]] = []
                emit("level_start", level=islands, row=r, col=c)
                dfs(r, c, islands, cells)
                emit(
                    "region_discovered",
                    islandId=islands,
                    cells=cells,
                    value="#",
                )

    emit("done", result=islands)
    return {"result": islands, "events": events, "finalGrid": grid}
