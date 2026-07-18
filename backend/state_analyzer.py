"""Inspect a verified execution for observed cell values and event types."""

from __future__ import annotations

from typing import Any

from backend.schemas import ExecutionResult, ObservedTraceSchema


def _collect_grid_values(grid: Any, into: set[str]) -> None:
    if not isinstance(grid, list):
        return
    for row in grid:
        if not isinstance(row, list):
            continue
        for cell in row:
            if isinstance(cell, (str, int, float, bool)):
                into.add(str(cell))


def analyze_execution(execution: ExecutionResult) -> ObservedTraceSchema:
    cell_values: set[str] = set()
    event_types: set[str] = set()

    _collect_grid_values(execution.initialState.get("grid"), cell_values)
    _collect_grid_values(execution.finalState.get("grid"), cell_values)

    for index, event in enumerate(execution.events):
        if not isinstance(event, dict):
            raise ValueError(f"Trace event {index} is not an object.")
        event_type = event.get("type")
        if not isinstance(event_type, str) or not event_type:
            raise ValueError(f"Trace event {index} has no valid type.")
        event_types.add(event_type)

        _collect_grid_values(event.get("grid"), cell_values)

        value = event.get("value")
        if isinstance(value, (str, int, float, bool)):
            cell_values.add(str(value))

        cells = event.get("cells")
        if isinstance(cells, list):
            # region cells don't add values, but region may carry value already handled
            pass

    return ObservedTraceSchema(
        cellValues=sorted(cell_values),
        eventTypes=sorted(event_types),
    )
