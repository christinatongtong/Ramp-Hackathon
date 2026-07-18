"""One-call build: analyze → GPT semantic+visual → validate → publish.

Usage:
  python -m backend.build_once number-of-islands
"""

from __future__ import annotations

import argparse
import json

from backend.problem_builder import build_problem


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build and publish a problem world with one GPT call."
    )
    parser.add_argument("problem_id")
    parser.add_argument("--example", type=int, default=None)
    parser.add_argument("--style", default="derpy")
    parser.add_argument(
        "--no-publish",
        action="store_true",
        help="Save bundle but do not mark published.",
    )
    args = parser.parse_args()

    print(f"Building {args.problem_id}…")
    result = build_problem(
        args.problem_id,
        example_index=args.example,
        style=args.style,
        publish=not args.no_publish,
    )

    print(json.dumps(result.model_dump(mode="json"), indent=2))
    if result.status == "generation_failed":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
