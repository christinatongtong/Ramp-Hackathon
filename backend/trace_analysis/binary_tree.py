"""Binary-tree trace analysis."""

from __future__ import annotations

from backend.schemas import ExecutionResult, ObservedTraceSchema, SceneType
from backend.trace_analysis.helpers import collect_scalar_values


def analyze(
    execution: ExecutionResult,
    structure_type: SceneType = "binary_tree",
) -> ObservedTraceSchema:
    cell_values: set[str] = set()
    event_types: set[str] = set()

    for event in execution.events:
        if not isinstance(event, dict):
            raise ValueError("Trace event is not an object.")
        et = event.get("type")
        if not isinstance(et, str) or not et:
            raise ValueError("Trace event missing type.")
        event_types.add(et)
        nodes = event.get("nodes")
        if isinstance(nodes, list):
            for node in nodes:
                if isinstance(node, dict):
                    collect_scalar_values(node.get("value"), cell_values)
        collect_scalar_values(event.get("value"), cell_values)

    return ObservedTraceSchema(
        structureType=structure_type,
        cellValues=sorted(cell_values),
        eventTypes=sorted(event_types),
    )
