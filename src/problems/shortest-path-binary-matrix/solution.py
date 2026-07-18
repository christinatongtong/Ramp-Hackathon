"""Instrumented 8-directional BFS for Shortest Path in Binary Matrix.

Emits shared grid events: init, visit, frontier_add, frontier_remove,
path_mark, done.
"""

from __future__ import annotations

from collections import deque
from copy import deepcopy
from typing import Any


def solve(grid: list[list[int]]) -> dict[str, Any]:
    grid = deepcopy(grid)
    n = len(grid)
    events: list[dict[str, Any]] = []

    def emit(event_type: str, **payload: Any) -> None:
        events.append({"type": event_type, **payload})

    emit("init", grid=deepcopy(grid))

    if grid[0][0] != 0 or grid[n - 1][n - 1] != 0:
        emit("done", result=-1)
        return {"result": -1, "events": events, "finalGrid": grid}

    directions = (
        (-1, -1),
        (-1, 0),
        (-1, 1),
        (0, -1),
        (0, 1),
        (1, -1),
        (1, 0),
        (1, 1),
    )
    queue: deque[tuple[int, int, int]] = deque([(0, 0, 1)])
    visited = {(0, 0)}
    parent: dict[tuple[int, int], tuple[int, int] | None] = {(0, 0): None}
    emit("visit", row=0, col=0, distance=1, value=2)
    emit("frontier_add", row=0, col=0, distance=1)
    # Visually mark explored open cells as 2 (visited path candidate).
    grid[0][0] = 2

    while queue:
        r, c, dist = queue.popleft()
        emit("frontier_remove", row=r, col=c, distance=dist)

        if r == n - 1 and c == n - 1:
            path: list[list[int]] = []
            cur: tuple[int, int] | None = (r, c)
            while cur is not None:
                path.append([cur[0], cur[1]])
                cur = parent[cur]
            path.reverse()
            for pr, pc in path:
                emit("path_mark", row=pr, col=pc, value=3)
                grid[pr][pc] = 3
            emit("done", result=dist, path=path)
            return {"result": dist, "events": events, "finalGrid": grid, "path": path}

        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if (
                0 <= nr < n
                and 0 <= nc < n
                and grid[nr][nc] == 0
                and (nr, nc) not in visited
            ):
                visited.add((nr, nc))
                parent[(nr, nc)] = (r, c)
                queue.append((nr, nc, dist + 1))
                grid[nr][nc] = 2
                emit("visit", row=nr, col=nc, distance=dist + 1, value=2)
                emit("frontier_add", row=nr, col=nc, distance=dist + 1)

    emit("done", result=-1)
    return {"result": -1, "events": events, "finalGrid": grid}
