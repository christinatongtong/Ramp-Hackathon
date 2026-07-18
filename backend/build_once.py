"""One-call build: analyze → GPT semantic+visual → validate → publish.

Usage:
  python -m backend.build_once two-sum-ii
  python -m backend.build_once two-sum-ii --force
"""

from __future__ import annotations

import argparse
import json

from backend.problem_builder import build_and_publish_problem


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build and publish a problem world with one GPT call."
    )
    parser.add_argument("problem_id")
    parser.add_argument("--example", type=int, default=None)
    parser.add_argument("--style", default="derpy")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Rebuild even if the problem is already published.",
    )
    parser.add_argument(
        "--no-publish",
        action="store_true",
        help="Validate and save bundle but do not mark published.",
    )
    args = parser.parse_args()

    print(f"Building {args.problem_id}…")
    result = build_and_publish_problem(
        args.problem_id,
        example_index=args.example,
        style=args.style,
        force=args.force,
        publish=not args.no_publish,
    )

    print(json.dumps(result.model_dump(mode="json"), indent=2))
    if result.status != "published":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
