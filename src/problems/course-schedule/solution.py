"""Instrumented Kahn's algorithm for detecting prerequisite cycles."""

from __future__ import annotations

from collections import deque
from typing import Any


def solve(numCourses: int, prerequisites: list[list[int]]) -> dict[str, Any]:
    adjacency = [[] for _ in range(numCourses)]
    indegrees = [0] * numCourses
    edges: list[dict[str, str]] = []
    edge_id_by_pair: dict[tuple[int, int], str] = {}
    for index, (course, prerequisite) in enumerate(prerequisites):
        adjacency[prerequisite].append(course)
        indegrees[course] += 1
        edge_id = f"e{index}"
        edges.append(
            {
                "id": edge_id,
                "from": f"c{prerequisite}",
                "to": f"c{course}",
            }
        )
        edge_id_by_pair[(prerequisite, course)] = edge_id

    events: list[dict[str, Any]] = []

    def emit(event_type: str, **payload: Any) -> None:
        events.append({"type": event_type, **payload})

    nodes = [
        {"id": f"c{course}", "label": course, "colorState": "unvisited"}
        for course in range(numCourses)
    ]
    indegree_map = {f"c{course}": indegrees[course] for course in range(numCourses)}
    emit(
        "init",
        structure="graph",
        nodes=nodes,
        edges=edges,
        indegrees=dict(indegree_map),
    )

    queue = deque(course for course, degree in enumerate(indegrees) if degree == 0)
    for course in queue:
        emit("node_enqueue", nodeId=f"c{course}", indegree=0)

    completed = 0
    while queue:
        course = queue.popleft()
        completed += 1
        emit("node_finalize", nodeId=f"c{course}", completed=completed)
        for next_course in adjacency[course]:
            events.append(
                {
                    "type": "edge_examine",
                    "edgeId": edge_id_by_pair[(course, next_course)],
                    "fromNodeId": f"c{course}",
                    "toNodeId": f"c{next_course}",
                    "from": f"c{course}",
                    "to": f"c{next_course}",
                }
            )
            old_indegree = indegrees[next_course]
            indegrees[next_course] -= 1
            indegree_map[f"c{next_course}"] = indegrees[next_course]
            emit(
                "indegree_update",
                nodeId=f"c{next_course}",
                oldIndegree=old_indegree,
                indegree=indegrees[next_course],
            )
            if indegrees[next_course] == 0:
                queue.append(next_course)
                emit("node_enqueue", nodeId=f"c{next_course}", indegree=0)

    result = completed == numCourses
    if not result:
        remaining = [
            f"c{course}" for course, degree in enumerate(indegrees) if degree > 0
        ]
        emit(
            "cycle_detected",
            nodeIds=remaining,
            nodeId=remaining[0] if remaining else None,
        )
    emit("done", result=result)
    return {
        "result": result,
        "events": events,
        "finalState": {
            "structure": "graph",
            "nodes": nodes,
            "edges": edges,
            "indegrees": indegree_map,
        },
    }
