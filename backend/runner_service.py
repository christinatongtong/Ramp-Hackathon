from __future__ import annotations

from copy import deepcopy
from typing import Any

from backend.initial_state import build_initial_state
from backend.judge_service import judge_user_code
from backend.problem_loader import get_entrypoint, get_judge_tests
from backend.schemas import ExecutionResult, ProblemPackage, RunResponse
from src.runner import run as run_canonical_solution


class UserCodeNotEnabledError(NotImplementedError):
    """Legacy alias — user judging is enabled via run_submission."""

    pass


def run_canonical_trace(
    problem: ProblemPackage,
    example_index: int = 0,
) -> ExecutionResult:
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

    return ExecutionResult(
        result=result,
        expected=expected,
        passed=result == expected,
        initialState=build_initial_state(initial_input, problem.config),
        finalState=_build_final_state(raw, final_grid),
        events=events,
    )


def run_solution(
    problem: ProblemPackage,
    example_index: int,
    user_code: str | None = None,
) -> ExecutionResult:
    """Tooling helper: always runs the canonical instrumented solution."""

    if user_code is not None:
        raise UserCodeNotEnabledError(
            "Use POST /run with { code } to judge submissions. "
            "Trace tooling only supports the canonical solution."
        )

    return run_canonical_trace(problem, example_index)


def run_submission(
    problem: ProblemPackage,
    *,
    code: str,
    example_index: int = 0,
) -> RunResponse:
    """Judge user code first; unlock canonical animation only on acceptance."""

    entrypoint = get_entrypoint(problem.config)
    tests = get_judge_tests(problem.config)
    test_result = judge_user_code(
        code=code,
        entrypoint=entrypoint,
        tests=tests,
        example_index=example_index,
    )

    if not test_result.passed:
        return RunResponse(
            passed=False,
            verdict=test_result.verdict,
            message=test_result.message,
            testsPassed=test_result.tests_passed,
            testsTotal=test_result.tests_total,
            execution=None,
        )

    # Animation reward: verified canonical trace for the requested example.
    animation_index = example_index
    examples = problem.config.get("examples") or []
    if not isinstance(examples, list) or not examples:
        animation_index = 0
    elif animation_index < 0 or animation_index >= len(examples):
        animation_index = int(problem.config.get("defaultExample", 0))

    canonical_execution = run_canonical_trace(problem, animation_index)

    return RunResponse(
        passed=True,
        verdict="accepted",
        message=test_result.message,
        testsPassed=test_result.tests_passed,
        testsTotal=test_result.tests_total,
        execution=canonical_execution,
    )


def _build_final_state(raw: dict[str, Any], final_grid: Any) -> dict[str, Any]:
    if final_grid is not None:
        return {"grid": final_grid}

    final_state = raw.get("finalState")
    if isinstance(final_state, dict):
        return final_state

    values = raw.get("finalValues")
    if isinstance(values, list):
        return {"values": values}

    return {}
