from __future__ import annotations

import json

from backend.problem_loader import get_problem_directory
from backend.schemas import GeneratedVisualPlan


def animation_json_path(problem_id: str):
    return get_problem_directory(problem_id) / "animation.json"


def _migrate_legacy_payload(payload: dict) -> dict:
    """Map old {world: ...} plans into {structure, theme}."""

    if "structure" in payload and "theme" in payload:
        return payload

    world = payload.get("world")
    if not isinstance(world, dict):
        return payload

    scene_type = world.get("sceneType") or "grid"
    if scene_type == "array":
        structure = {
            "type": "array",
            "inputKey": "nums",
            "layout": "horizontal",
            "showIndices": True,
        }
    else:
        cam_mode = (world.get("camera") or {}).get("mode") or "isometric"
        layout = "top_down" if cam_mode == "top_down" else "isometric"
        structure = {
            "type": "grid",
            "inputKey": "grid",
            "layout": layout,
        }

    theme = {
        "preset": world.get("preset", "generic_grid"),
        "name": world.get("theme", "untitled"),
        "palette": world.get("palette"),
        "camera": world.get("camera"),
        "props": world.get("props") or [],
        "timeSystem": world.get("timeSystem")
        or {"mode": "static", "advanceOn": "none"},
    }

    migrated = dict(payload)
    migrated["structure"] = structure
    migrated["theme"] = theme
    # Keep world for older clients; GeneratedVisualPlan ignores unknown via model
    return migrated


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

    if "world" not in payload and "structure" not in payload:
        return None

    migrated = _migrate_legacy_payload(payload)
    # Drop legacy world before validate so GeneratedVisualPlan doesn't reject it
    cleaned = {k: v for k, v in migrated.items() if k != "world"}
    return GeneratedVisualPlan.model_validate(cleaned)


def save_visual_plan_atomically(problem_id: str, plan: GeneratedVisualPlan) -> None:
    """Write animation.json via temp+replace after validating the payload."""

    import os

    path = animation_json_path(problem_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(".json.tmp")
    payload = plan.model_dump_json(indent=2) + "\n"
    # Round-trip validate before replacing any published plan.
    GeneratedVisualPlan.model_validate(json.loads(payload))
    tmp_path.write_text(payload, encoding="utf-8")
    os.replace(tmp_path, path)


def save_visual_plan(problem_id: str, plan: GeneratedVisualPlan) -> None:
    save_visual_plan_atomically(problem_id, plan)


def has_visual_plan(problem_id: str) -> bool:
    try:
        return load_visual_plan(problem_id) is not None
    except (ValueError, FileNotFoundError):
        return False
