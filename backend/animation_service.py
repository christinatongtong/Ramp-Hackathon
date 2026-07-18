from __future__ import annotations

from backend.animation_generator import generate_visual_plan
from backend.knowledge_loader import load_knowledge
from backend.problem_loader import get_initial_state, get_problem_facts, load_problem
from backend.prompt_builder import build_animation_prompt
from backend.runner_service import UserCodeNotEnabledError, run_canonical_trace
from backend.schemas import AnimationPackage, ClientAnimationPackage, GeneratedVisualPlan
from backend.validator import validate_visual_plan
from backend.visual_plan_store import load_visual_plan, save_visual_plan


def resolve_visual_plan(
    problem_id: str,
    *,
    example_index: int = 0,
    style: str = "derpy",
    force: bool = False,
    save: bool = True,
) -> GeneratedVisualPlan:
    """Load visual plan from disk, or generate once using a canonical trace."""

    if not force:
        existing = load_visual_plan(problem_id)
        if existing is not None:
            return existing

    problem = load_problem(problem_id)
    execution = run_canonical_trace(problem, example_index)
    knowledge = load_knowledge()
    messages = build_animation_prompt(
        problem=problem,
        execution=execution,
        knowledge=knowledge,
        style=style,
    )
    visual_plan = generate_visual_plan(messages)
    validate_visual_plan(visual_plan, problem, execution)

    if save:
        save_visual_plan(problem_id, visual_plan)

    return visual_plan


def create_animation_package(
    problem_id: str,
    example_index: int = 0,
    user_code: str | None = None,
    style: str = "derpy",
    force: bool = False,
    save: bool = False,
) -> AnimationPackage:
    if user_code is not None:
        raise UserCodeNotEnabledError(
            "Animation generation uses the canonical solution only."
        )

    problem = load_problem(problem_id)
    execution = run_canonical_trace(problem, example_index)
    visual_plan = resolve_visual_plan(
        problem_id,
        example_index=example_index,
        style=style,
        force=force,
        save=save,
    )

    return AnimationPackage(
        problemId=problem.id,
        runMode="canonical",
        execution=execution,
        visualPlan=visual_plan,
    )


def get_client_package(
    problem_id: str,
    *,
    example_index: int | None = None,
    force_visual: bool = False,
    style: str = "derpy",
) -> ClientAnimationPackage:
    """Page-load package: problem facts + visual plan + static initial state."""

    problem = load_problem(problem_id)
    facts = get_problem_facts(problem_id)
    index = (
        example_index
        if example_index is not None
        else int(problem.config.get("defaultExample", 0))
    )

    visual_plan = resolve_visual_plan(
        problem_id,
        example_index=index,
        style=style,
        force=force_visual,
        save=True,
    )

    return ClientAnimationPackage(
        problem=facts,
        visualPlan=visual_plan,
        initialState=get_initial_state(problem.config, index),
    )
