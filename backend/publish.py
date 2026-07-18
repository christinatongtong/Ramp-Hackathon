"""Mark an existing valid bundle as published.

Usage:
  python -m backend.publish number-of-islands
"""

from __future__ import annotations

import argparse

from backend.bundle_store import load_bundle
from backend.bundle_validator import validate_bundle
from backend.problem_loader import load_problem
from backend.publication_store import mark_published
from backend.runner_service import run_canonical_trace
from backend.state_analyzer import analyze_execution


def publish_problem(problem_id: str, *, example_index: int = 0) -> None:
    bundle = load_bundle(problem_id)
    if bundle is None:
        # Allow publishing legacy visual-only plans once.
        from backend.visual_plan_store import load_visual_plan

        if load_visual_plan(problem_id) is None:
            raise FileNotFoundError(
                f"No bundle for '{problem_id}'. "
                f"Run: python -m backend.build_once {problem_id}"
            )
        mark_published(problem_id)
        print(f"Published legacy plan for {problem_id}")
        return

    problem = load_problem(problem_id)
    execution = run_canonical_trace(problem, example_index)
    observed = analyze_execution(execution)
    errors = validate_bundle(bundle, problem, execution, observed)
    if errors:
        raise ValueError(
            "Cannot publish — validation errors:\n- " + "\n- ".join(errors)
        )

    mark_published(problem_id)
    print(f"Published {problem_id}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate and mark a problem as published."
    )
    parser.add_argument("problem_id")
    parser.add_argument("--example", type=int, default=0)
    args = parser.parse_args()
    publish_problem(args.problem_id, example_index=args.example)


if __name__ == "__main__":
    main()
