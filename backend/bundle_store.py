"""Load/save semantic specs and generated bundles."""

from __future__ import annotations

import json

from backend.problem_loader import get_problem_directory
from backend.schemas import (
    GeneratedProblemBundle,
    GeneratedVisualPlan,
    ProblemSemanticSpec,
)
from backend.visual_plan_store import load_visual_plan, save_visual_plan


def semantic_json_path(problem_id: str):
    return get_problem_directory(problem_id) / "semantic.json"


def load_semantic_spec(problem_id: str) -> ProblemSemanticSpec | None:
    path = semantic_json_path(problem_id)
    if not path.exists():
        return None
    raw = path.read_text(encoding="utf-8").strip()
    if not raw or raw == "{}":
        return None
    return ProblemSemanticSpec.model_validate(json.loads(raw))


def save_semantic_spec(problem_id: str, spec: ProblemSemanticSpec) -> None:
    path = semantic_json_path(problem_id)
    path.write_text(spec.model_dump_json(indent=2) + "\n", encoding="utf-8")


def load_bundle(problem_id: str) -> GeneratedProblemBundle | None:
    plan = load_visual_plan(problem_id)
    spec = load_semantic_spec(problem_id)
    if plan is None or spec is None:
        return None
    return GeneratedProblemBundle(
        problemId=problem_id,
        semanticSpec=spec,
        visualPlan=plan,
    )


def save_bundle(bundle: GeneratedProblemBundle) -> None:
    save_visual_plan(bundle.problemId, bundle.visualPlan)
    save_semantic_spec(bundle.problemId, bundle.semanticSpec)
