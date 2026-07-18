from __future__ import annotations

import argparse

from backend.animation_service import create_animation_package
from backend.visual_plan_store import save_visual_plan


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Generate a visual plan once and save it to animation.json. "
            "Execution is used for validation only and is not persisted."
        )
    )
    parser.add_argument(
        "problem_id",
        help="Problem id from src/problems/registry.json",
    )
    parser.add_argument(
        "--example",
        type=int,
        default=0,
        help="Example index from config.json (default: 0)",
    )
    parser.add_argument(
        "--style",
        default="derpy",
        help="Requested visual style (default: derpy)",
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Print the visual plan without writing animation.json.",
    )
    parser.add_argument(
        "--dump-package",
        action="store_true",
        help="Also print the full AnimationPackage (execution + visualPlan).",
    )

    arguments = parser.parse_args()

    print(
        f"Generating visual plan for {arguments.problem_id} "
        f"(example={arguments.example}, style={arguments.style})..."
    )

    package = create_animation_package(
        problem_id=arguments.problem_id,
        example_index=arguments.example,
        user_code=None,
        style=arguments.style,
        force=True,
        save=not arguments.no_save,
    )

    plan_json = package.visualPlan.model_dump_json(indent=2)

    if not arguments.no_save:
        # create_animation_package already saved when save=True; confirm path.
        save_visual_plan(arguments.problem_id, package.visualPlan)
        print(f"Saved visual plan → src/problems/{arguments.problem_id}/animation.json")
        print(
            f"Next: python -m backend.preview {arguments.problem_id} && "
            f"python -m backend.publish {arguments.problem_id}"
        )

    print("\nGeneratedVisualPlan:\n")
    print(plan_json)

    if arguments.dump_package:
        print("\nFull AnimationPackage:\n")
        print(package.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
