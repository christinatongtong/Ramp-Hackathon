"""One-call problem build: analyze → GPT bundle → validate → publish.

CLI (`python -m backend.build_once`) and POST /api/problems/{id}/build both call
`build_and_publish_problem` — there is no separate generation path.
"""

from __future__ import annotations

from backend.bundle_generator import generate_problem_bundle
from backend.bundle_store import load_bundle, save_bundle_atomically
from backend.bundle_validator import validate_bundle
from backend.knowledge_loader import load_knowledge
from backend.problem_loader import (
    get_client_facts_package_parts,
    is_problem_unlocked,
    load_problem,
)
from backend.prompt_builder import build_bundle_prompt
from backend.publication_store import is_published, mark_failed, mark_published
from backend.runner_service import run_canonical_trace
from backend.schemas import (
    BuildProblemRequest,
    BuildProblemResponse,
    BuildResponse,
    ClientAnimationPackage,
)
from backend.state_analyzer import analyze_execution
from backend.visual_plan_store import load_visual_plan


def _client_package(
    problem_id: str,
    *,
    example_index: int | None = None,
) -> ClientAnimationPackage:
    facts, initial_state = get_client_facts_package_parts(problem_id, example_index)
    bundle = load_bundle(problem_id)
    plan = bundle.visualPlan if bundle else load_visual_plan(problem_id)
    if plan is None:
        raise FileNotFoundError(f"No visual plan for '{problem_id}'")
    return ClientAnimationPackage(
        problem=facts,
        visualPlan=plan,
        semanticSpec=bundle.semanticSpec if bundle else None,
        initialState=initial_state,
    )


def build_and_publish_problem(
    problem_id: str,
    *,
    style: str = "derpy",
    force: bool = False,
    example_index: int | None = None,
    publish: bool = True,
) -> BuildProblemResponse:
    """Shared one-action pipeline used by CLI and HTTP."""

    problem = load_problem(problem_id)
    index = (
        example_index
        if example_index is not None
        else int(problem.config.get("defaultExample", 0))
    )

    if (
        not force
        and publish
        and is_published(problem_id)
        and is_problem_unlocked(problem_id)
    ):
        return BuildProblemResponse(
            problemId=problem_id,
            status="published",
            errors=[],
            package=_client_package(problem_id, example_index=index),
        )

    execution = run_canonical_trace(problem, index)
    if not execution.passed:
        errors = [
            f"Canonical solution failed verification: got {execution.result!r}, "
            f"expected {execution.expected!r}."
        ]
        mark_failed(problem_id, errors)
        return BuildProblemResponse(
            problemId=problem_id,
            status="validation_failed",
            errors=errors,
        )

    observed = analyze_execution(execution)
    knowledge = load_knowledge()
    messages = build_bundle_prompt(
        problem=problem,
        execution=execution,
        observed=observed,
        knowledge=knowledge,
        style=style,
    )

    try:
        bundle = generate_problem_bundle(messages, problem_id=problem_id)
    except Exception as error:  # noqa: BLE001 — surface as validation_failed
        errors = [f"GPT generation failed: {error}"]
        mark_failed(problem_id, errors)
        return BuildProblemResponse(
            problemId=problem_id,
            status="validation_failed",
            errors=errors,
        )

    errors = validate_bundle(bundle, problem, execution, observed)
    if errors:
        mark_failed(problem_id, errors)
        return BuildProblemResponse(
            problemId=problem_id,
            status="validation_failed",
            errors=errors,
        )

    # Atomic write: never replace published animation.json with invalid data.
    save_bundle_atomically(bundle)
    if publish:
        mark_published(problem_id)

    return BuildProblemResponse(
        problemId=problem_id,
        status="published" if publish else "draft",
        errors=[],
        package=_client_package(problem_id, example_index=index),
    )


def build_problem(
    problem_id: str,
    *,
    example_index: int | None = None,
    style: str = "derpy",
    publish: bool = True,
    force: bool = False,
) -> BuildResponse:
    """Backward-compatible wrapper around build_and_publish_problem."""

    return build_and_publish_problem(
        problem_id,
        style=style,
        force=force,
        example_index=example_index,
        publish=publish,
    )


def build_from_request(
    problem_id: str,
    request: BuildProblemRequest,
) -> BuildProblemResponse:
    return build_and_publish_problem(
        problem_id,
        style=request.style,
        force=request.force,
        example_index=request.exampleIndex,
        publish=True,
    )
