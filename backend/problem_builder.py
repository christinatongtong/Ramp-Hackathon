"""One-call problem build: analyze → GPT bundle → validate → publish."""

from __future__ import annotations

from backend.bundle_generator import generate_problem_bundle
from backend.bundle_store import save_bundle
from backend.bundle_validator import validate_bundle
from backend.knowledge_loader import load_knowledge
from backend.problem_loader import get_client_facts_package_parts, load_problem
from backend.prompt_builder import build_bundle_prompt
from backend.publication_store import mark_failed, mark_published
from backend.runner_service import run_canonical_trace
from backend.schemas import BuildResponse, ClientAnimationPackage
from backend.state_analyzer import analyze_execution


def build_problem(
    problem_id: str,
    *,
    example_index: int | None = None,
    style: str = "derpy",
    publish: bool = True,
) -> BuildResponse:
    problem = load_problem(problem_id)
    index = (
        example_index
        if example_index is not None
        else int(problem.config.get("defaultExample", 0))
    )

    execution = run_canonical_trace(problem, index)
    if not execution.passed:
        errors = [
            f"Canonical solution failed verification: got {execution.result!r}, "
            f"expected {execution.expected!r}."
        ]
        mark_failed(problem_id, errors)
        return BuildResponse(
            problemId=problem_id,
            status="generation_failed",
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
    except Exception as error:  # noqa: BLE001 — surface to API as generation_failed
        errors = [f"GPT generation failed: {error}"]
        mark_failed(problem_id, errors)
        return BuildResponse(
            problemId=problem_id,
            status="generation_failed",
            errors=errors,
        )

    errors = validate_bundle(bundle, problem, execution, observed)
    if errors:
        mark_failed(problem_id, errors)
        return BuildResponse(
            problemId=problem_id,
            status="generation_failed",
            errors=errors,
        )

    save_bundle(bundle)
    if publish:
        mark_published(problem_id)

    facts, initial_state = get_client_facts_package_parts(problem_id, index)
    package = ClientAnimationPackage(
        problem=facts,
        visualPlan=bundle.visualPlan,
        semanticSpec=bundle.semanticSpec,
        initialState=initial_state,
    )

    return BuildResponse(
        problemId=problem_id,
        status="published" if publish else "draft",
        errors=[],
        package=package,
    )
