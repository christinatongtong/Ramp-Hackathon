from __future__ import annotations

import json

from backend.problem_loader import get_problem_directory
from backend.schemas import GeneratedVisualPlan


def animation_json_path(problem_id: str):
    return get_problem_directory(problem_id) / "animation.json"


def load_visual_plan(problem_id: str) -> GeneratedVisualPlan | None:
    path = animation_json_path(problem_id)
    if not path.exists():
        return None

    raw = path.read_text(encoding="utf-8").strip()
    if not raw or raw == "{}":
        return None

    payload = json.loads(raw)
    if not isinstance(payload, dict):
        raise ValueError(f"{path} must contain a JSON object.")

    # Reject legacy snake_case plans that lack the new world block.
    if "world" not in payload:
        return None

    return GeneratedVisualPlan.model_validate(payload)


def save_visual_plan(problem_id: str, plan: GeneratedVisualPlan) -> None:
    path = animation_json_path(problem_id)
    path.write_text(
        plan.model_dump_json(indent=2) + "\n",
        encoding="utf-8",
    )


def has_visual_plan(problem_id: str) -> bool:
    try:
        return load_visual_plan(problem_id) is not None
    except (ValueError, FileNotFoundError):
        return False
