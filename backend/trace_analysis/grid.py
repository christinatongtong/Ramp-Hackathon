"""Grid-structure trace analysis."""

from __future__ import annotations

from backend.schemas import ExecutionResult, ObservedTraceSchema, SceneType
from backend.trace_analysis.helpers import collect_scalar_values


def analyze(
    execution: ExecutionResult,
    structure_type: SceneType = "grid",
) -> ObservedTraceSchema:
    cell_values: set[str] = set()
    event_types: set[str] = set()

    collect_scalar_values(execution.initialState.get("grid"), cell_values)
    collect_scalar_values(execution.finalState.get("grid"), cell_values)

    for index, event in enumerate(execution.events):
        if not isinstance(event, dict):
            raise ValueError(f"Trace event {index} is not an object.")
        event_type = event.get("type")
        if not isinstance(event_type, str) or not event_type:
            raise ValueError(f"Trace event {index} has no valid type.")
        event_types.add(event_type)
        collect_scalar_values(event.get("grid"), cell_values)
        value = event.get("value")
        if isinstance(value, (str, int, float, bool)):
            cell_values.add(str(value))

    return ObservedTraceSchema(
        structureType=structure_type,
        cellValues=sorted(cell_values),
        eventTypes=sorted(event_types),
    )
