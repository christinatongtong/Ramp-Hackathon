"""Generate a visual plan only (legacy). Prefer build_once for full bundles.

Usage:
  python -m backend.generate_once <problem_id>
"""

from __future__ import annotations

import argparse

from backend.animation_service import create_animation_package
from backend.visual_plan_store import save_visual_plan


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Legacy: generate a visual plan only. "
            "Prefer: python -m backend.build_once <id>"
        )
    )
    parser.add_argument("problem_id")
    parser.add_argument("--example", type=int, default=0)
    parser.add_argument("--style", default="derpy")
    parser.add_argument("--no-save", action="store_true")
    parser.add_argument("--dump-package", action="store_true")
    arguments = parser.parse_args()

    print(
        f"[legacy] Generating visual plan for {arguments.problem_id} "
        f"(prefer python -m backend.build_once)..."
    )

    package = create_animation_package(
        problem_id=arguments.problem_id,
        example_index=arguments.example,
        user_code=None,
        style=arguments.style,
        force=True,
        save=not arguments.no_save,
    )

    if not arguments.no_save:
        save_visual_plan(arguments.problem_id, package.visualPlan)
        print(f"Saved visual plan → src/problems/{arguments.problem_id}/animation.json")
        print(f"Next: python -m backend.build_once {arguments.problem_id}")

    print(package.visualPlan.model_dump_json(indent=2))
    if arguments.dump_package:
        print(package.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
