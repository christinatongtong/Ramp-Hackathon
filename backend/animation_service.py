from __future__ import annotations

from backend.animation_generator import generate_visual_plan
from backend.knowledge_loader import load_knowledge
from backend.problem_loader import load_problem
from backend.prompt_builder import build_animation_prompt
from backend.runner_service import run_solution
from backend.schemas import AnimationPackage
from backend.validator import validate_visual_plan


def create_animation_package(
    problem_id: str,
    example_index: int = 0,
    user_code: str | None = None,
    style: str = "derpy",
) -> AnimationPackage:
    problem = load_problem(problem_id)
    execution = run_solution(problem, example_index, user_code)
    knowledge = load_knowledge()

    messages = build_animation_prompt(
        problem=problem,
        execution=execution,
        knowledge=knowledge,
        style=style,
    )

    visual_plan = generate_visual_plan(messages)

    validate_visual_plan(
        visual_plan,
        problem,
        execution,
    )

    return AnimationPackage(
        problemId=problem.id,
        runMode="user" if user_code else "canonical",
        execution=execution,
        visualPlan=visual_plan,
    )
