from __future__ import annotations

from copy import deepcopy
from typing import Any

from backend.schemas import ExecutionResult, ProblemPackage
from src.runner import run as run_canonical_solution


class UserCodeNotEnabledError(NotImplementedError):
    pass


def run_solution(
    problem: ProblemPackage,
    example_index: int,
    user_code: str | None = None,
) -> ExecutionResult:
    if user_code is not None:
        raise UserCodeNotEnabledError(
            "User-code execution is not enabled yet. Pass userCode=null."
        )

    examples = problem.config.get("examples")
    if not isinstance(examples, list) or not examples:
        raise ValueError(f"Problem '{problem.id}' has no examples in config.json.")

    if example_index < 0 or example_index >= len(examples):
        raise ValueError(
            f"exampleIndex {example_index} is out of range for problem "
            f"'{problem.id}' (0..{len(examples) - 1})."
        )

    example = examples[example_index]
    if not isinstance(example, dict):
        raise ValueError(f"Example {example_index} must be an object.")

    expected = example.get("expected")
    initial_input = deepcopy(example.get("input"))

    raw = run_canonical_solution(problem.id, example_index)

    if not isinstance(raw, dict):
        raise RuntimeError("Canonical solution must return a dict payload.")

    events = raw.get("events")
    if not isinstance(events, list):
        raise RuntimeError("Canonical solution must include an events list.")

    result = raw.get("result")
    final_grid = raw.get("finalGrid")

    initial_state = _build_initial_state(initial_input)
    final_state = _build_final_state(raw, final_grid)

    return ExecutionResult(
        result=result,
        expected=expected,
        passed=result == expected,
        initialState=initial_state,
        finalState=final_state,
        events=events,
    )


def _build_initial_state(initial_input: Any) -> dict[str, Any]:
    if isinstance(initial_input, list):
        return {"grid": initial_input}
    if isinstance(initial_input, dict):
        return dict(initial_input)
    return {"input": initial_input}


def _build_final_state(raw: dict[str, Any], final_grid: Any) -> dict[str, Any]:
    if final_grid is not None:
        return {"grid": final_grid}

    final_state = raw.get("finalState")
    if isinstance(final_state, dict):
        return final_state

    return {}
