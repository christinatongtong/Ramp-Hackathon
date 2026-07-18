"""Instrumented BFS solution for Rotting Oranges.

Emits animation events the frontend can replay when the user presses Start.
"""

from __future__ import annotations

from collections import deque
from copy import deepcopy
from typing import Any


def solve(grid: list[list[int]]) -> dict[str, Any]:
    grid = deepcopy(grid)
    rows, cols = len(grid), len(grid[0])
    events: list[dict[str, Any]] = []
    queue: deque[tuple[int, int, int]] = deque()
    fresh = 0

    def emit(event_type: str, **payload: Any) -> None:
        events.append({"type": event_type, **payload})

    emit("init", structure="grid", grid=deepcopy(grid))

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c, 0))
                emit("enqueue", row=r, col=c, value=2, minute=0)
            elif grid[r][c] == 1:
                fresh += 1

    minutes = 0
    directions = ((0, 1), (0, -1), (1, 0), (-1, 0))

    while queue:
        r, c, minutes = queue.popleft()
        emit("dequeue", row=r, col=c, minute=minutes)

        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                grid[nr][nc] = 2
                fresh -= 1
                queue.append((nr, nc, minutes + 1))
                emit(
                    "cell_update",
                    row=nr,
                    col=nc,
                    value=2,
                    from_value=1,
                    minute=minutes + 1,
                )
                emit("enqueue", row=nr, col=nc, value=2, minute=minutes + 1)

    result = minutes if fresh == 0 else -1
    emit("done", result=result, remaining_fresh=fresh)
    return {"result": result, "events": events, "finalGrid": grid}
