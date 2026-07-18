"""Load/save semantic specs and generated bundles."""

from __future__ import annotations

import json
import os
from pathlib import Path

from backend.problem_loader import get_problem_directory
from backend.schemas import (
    GeneratedProblemBundle,
    GeneratedVisualPlan,
    ProblemSemanticSpec,
)
from backend.visual_plan_store import load_visual_plan, save_visual_plan_atomically


def semantic_json_path(problem_id: str) -> Path:
    return get_problem_directory(problem_id) / "semantic.json"


def load_semantic_spec(problem_id: str) -> ProblemSemanticSpec | None:
    path = semantic_json_path(problem_id)
    if not path.exists():
        return None
    raw = path.read_text(encoding="utf-8").strip()
    if not raw or raw == "{}":
        return None
    return ProblemSemanticSpec.model_validate(json.loads(raw))


def save_semantic_spec_atomically(problem_id: str, spec: ProblemSemanticSpec) -> None:
    """Write semantic.json via temp file so a bad write cannot corrupt the prior file."""

    path = semantic_json_path(problem_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(".json.tmp")
    payload = spec.model_dump_json(indent=2) + "\n"
    # Validate round-trip before replace
    ProblemSemanticSpec.model_validate(json.loads(payload))
    tmp_path.write_text(payload, encoding="utf-8")
    os.replace(tmp_path, path)


def save_semantic_spec(problem_id: str, spec: ProblemSemanticSpec) -> None:
    save_semantic_spec_atomically(problem_id, spec)


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


def save_bundle_atomically(bundle: GeneratedProblemBundle) -> None:
    """Persist plan + semantic atomically. Bad GPT output never replaces published files."""

    save_visual_plan_atomically(bundle.problemId, bundle.visualPlan)
    save_semantic_spec_atomically(bundle.problemId, bundle.semanticSpec)


def save_bundle(bundle: GeneratedProblemBundle) -> None:
    save_bundle_atomically(bundle)
