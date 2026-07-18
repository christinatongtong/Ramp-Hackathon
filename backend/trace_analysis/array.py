"""Array-structure trace analysis."""

from __future__ import annotations

from backend.schemas import ExecutionResult, ObservedTraceSchema, SceneType
from backend.trace_analysis.helpers import collect_scalar_values


def analyze(
    execution: ExecutionResult,
    structure_type: SceneType = "array",
) -> ObservedTraceSchema:
    cell_values: set[str] = set()
    event_types: set[str] = set()

    for key in ("values", "nums", "arr", "array"):
        collect_scalar_values(execution.initialState.get(key), cell_values)
    collect_scalar_values(execution.finalState.get("values"), cell_values)

    for index, event in enumerate(execution.events):
        if not isinstance(event, dict):
            raise ValueError(f"Trace event {index} is not an object.")
        event_type = event.get("type")
        if not isinstance(event_type, str) or not event_type:
            raise ValueError(f"Trace event {index} has no valid type.")
        event_types.add(event_type)

        collect_scalar_values(event.get("values"), cell_values)
        for key in ("value", "left_value", "right_value", "mid_value", "target"):
            value = event.get(key)
            if isinstance(value, (str, int, float, bool)):
                cell_values.add(str(value))

    return ObservedTraceSchema(
        structureType=structure_type,
        cellValues=sorted(cell_values),
        eventTypes=sorted(event_types),
    )
