from __future__ import annotations

import argparse
import json

from backend.animation_service import create_animation_package
from backend.problem_loader import load_problem


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate one AnimationPackage using OpenAI."
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
        help="Print the package without writing animation.example.json.",
    )

    arguments = parser.parse_args()

    print(
        f"Generating animation package for {arguments.problem_id} "
        f"(example={arguments.example}, style={arguments.style})..."
    )

    package = create_animation_package(
        problem_id=arguments.problem_id,
        example_index=arguments.example,
        user_code=None,
        style=arguments.style,
    )

    package_json = package.model_dump_json(indent=2)

    if not arguments.no_save:
        problem = load_problem(arguments.problem_id)
        output_path = problem.directory / "animation.example.json"
        output_path.write_text(package_json + "\n", encoding="utf-8")
        print(f"Saved: {output_path}")

    print("\nAnimationPackage:\n")
    print(package_json)


if __name__ == "__main__":
    main()
