"""Structure-aware inspection of verified executions."""

from __future__ import annotations

from backend.schemas import ExecutionResult, ObservedTraceSchema
from backend.trace_analysis import array as array_analysis
from backend.trace_analysis import binary_tree as tree_analysis
from backend.trace_analysis import graph as graph_analysis
from backend.trace_analysis import grid as grid_analysis
from backend.trace_analysis import linked_list as linked_list_analysis
from backend.trace_analysis.helpers import detect_structure


def analyze_execution(execution: ExecutionResult) -> ObservedTraceSchema:
    structure_type = detect_structure(execution)
    if structure_type == "array":
        return array_analysis.analyze(execution, structure_type)
    if structure_type == "linked_list":
        return linked_list_analysis.analyze(execution, structure_type)
    if structure_type == "binary_tree":
        return tree_analysis.analyze(execution, structure_type)
    if structure_type == "graph":
        return graph_analysis.analyze(execution, structure_type)
    return grid_analysis.analyze(execution, structure_type)
