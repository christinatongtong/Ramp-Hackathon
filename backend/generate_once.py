import argparse
import json

from backend.animation_generator import generate_animation_plan
from backend.context_loader import load_problem, run_problem_trace
from backend.validator import validate_animation_plan


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate one animation plan using OpenAI."
    )

    parser.add_argument(
        "problem_id",
        help="Problem id from src/problems/registry.json",
    )

    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Print the plan without writing animation.json.",
    )

    arguments = parser.parse_args()

    print(f"Loading problem: {arguments.problem_id}")
    problem = load_problem(arguments.problem_id)

    print("Running verified canonical solution...")
    trace = run_problem_trace(arguments.problem_id)

    print(
        f"Trace result: {trace.get('result')}; "
        f"events: {len(trace.get('events', []))}"
    )

    print("Requesting animation plan from OpenAI...")
    plan = generate_animation_plan(problem, trace)

    print("Validating animation plan...")
    validate_animation_plan(plan, problem, trace)

    plan_json = plan.model_dump_json(indent=2)

    if not arguments.no_save:
        output_path = problem["directory"] / "animation.json"
        output_path.write_text(plan_json + "\n", encoding="utf-8")
        print(f"Saved: {output_path}")

    print("\nGenerated animation plan:\n")
    print(plan_json)


if __name__ == "__main__":
    main()