"""Publish a generated visual plan after capability validation.

Usage:
  python -m backend.publish number-of-islands
"""

from __future__ import annotations

import argparse
import json

from backend.capabilities import plan_uses_supported_capabilities
from backend.problem_loader import load_problem
from backend.runner_service import run_canonical_trace
from backend.validator import validate_visual_plan
from backend.visual_plan_store import animation_json_path, load_visual_plan


def publish_problem(problem_id: str, *, example_index: int = 0) -> None:
    plan = load_visual_plan(problem_id)
    if plan is None:
        raise FileNotFoundError(
            f"No animation.json for '{problem_id}'. "
            f"Run: python -m backend.generate_once {problem_id}"
        )

    problem = load_problem(problem_id)
    execution = run_canonical_trace(problem, example_index)
    validate_visual_plan(plan, problem, execution)

    capability_errors = plan_uses_supported_capabilities(plan.model_dump())
    if capability_errors:
        raise ValueError(
            "Cannot publish — unsupported capabilities:\n- "
            + "\n- ".join(capability_errors)
        )

    # Re-write with a published marker for hub unlock.
    payload = json.loads(plan.model_dump_json())
    payload["published"] = True
    path = animation_json_path(problem_id)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    # Keep pydantic-valid shape without the extra field by re-saving through schema
    # after stamping published via a sidecar-compatible dump.
    # Hub unlock reads the raw JSON "published" flag.
    print(f"Published {problem_id} → {path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate capabilities and mark a visual plan as published."
    )
    parser.add_argument("problem_id", help="Problem id from registry.json")
    parser.add_argument("--example", type=int, default=0)
    args = parser.parse_args()
    publish_problem(args.problem_id, example_index=args.example)


if __name__ == "__main__":
    main()
