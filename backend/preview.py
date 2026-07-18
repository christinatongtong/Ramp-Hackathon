"""Preview a visual plan without publishing (hub stays locked).

Usage:
  python -m backend.preview number-of-islands
"""

from __future__ import annotations

import argparse
import json

from backend.bundle_store import load_semantic_spec
from backend.bundle_validator import validate_bundle
from backend.capabilities import plan_uses_supported_capabilities
from backend.problem_loader import load_problem
from backend.runner_service import run_canonical_trace
from backend.schemas import GeneratedProblemBundle
from backend.state_analyzer import analyze_execution
from backend.validator import validate_visual_plan
from backend.visual_plan_store import load_visual_plan


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate a saved visual plan and print a preview summary."
    )
    parser.add_argument("problem_id")
    parser.add_argument("--example", type=int, default=0)
    args = parser.parse_args()

    plan = load_visual_plan(args.problem_id)
    if plan is None:
        raise SystemExit(
            f"No animation.json for '{args.problem_id}'. "
            f"Run: python -m backend.build_once {args.problem_id}"
        )

    problem = load_problem(args.problem_id)
    execution = run_canonical_trace(problem, args.example)
    semantic = load_semantic_spec(args.problem_id)

    if semantic is not None:
        observed = analyze_execution(execution)
        errors = validate_bundle(
            GeneratedProblemBundle(
                problemId=args.problem_id,
                semanticSpec=semantic,
                visualPlan=plan,
            ),
            problem,
            execution,
            observed,
        )
        if errors:
            raise SystemExit("Validation errors:\n- " + "\n- ".join(errors))
    else:
        validate_visual_plan(plan, problem, execution)

    capability_errors = plan_uses_supported_capabilities(plan.model_dump())
    if capability_errors:
        raise SystemExit(
            "Capability errors:\n- " + "\n- ".join(capability_errors)
        )

    print(f"Preview OK for {args.problem_id}")
    print(f"  structure: {plan.structure.type}")
    print(f"  preset: {plan.theme.preset}")
    print(f"  theme:  {plan.theme.name}")
    print(f"  entities: {', '.join(plan.entities.keys())}")
    print(f"  bindings: {', '.join(plan.eventBindings.keys())}")
    print(f"  events in trace: {len(execution.events)}")
    print("\nVisual plan JSON:\n")
    print(json.dumps(plan.model_dump(), indent=2))


if __name__ == "__main__":
    main()
