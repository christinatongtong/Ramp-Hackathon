"""Run a problem's instrumented solution and print animation events as JSON.

Usage:
  python -m src.runner rotting-oranges
  python -m src.runner number-of-islands --example 1
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent
PROBLEMS_DIR = SRC / "problems"


def load_config(problem_id: str) -> dict:
    path = PROBLEMS_DIR / problem_id / "config.json"
    with path.open() as f:
        return json.load(f)


def load_solution(problem_id: str, solution_file: str):
    path = PROBLEMS_DIR / problem_id / solution_file
    spec = importlib.util.spec_from_file_location(f"{problem_id}_solution", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(problem_id: str, example_index: int | None = None) -> dict:
    config = load_config(problem_id)
    idx = config.get("defaultExample", 0) if example_index is None else example_index
    example = config["examples"][idx]
    module = load_solution(problem_id, config["solutionFile"])
    return module.solve(example["input"])


def main() -> None:
    parser = argparse.ArgumentParser(description="Run instrumented problem solutions")
    parser.add_argument("problem_id", help="Folder name under src/problems/")
    parser.add_argument(
        "--example",
        type=int,
        default=None,
        help="Example index (defaults to config.defaultExample)",
    )
    args = parser.parse_args()

    try:
        payload = run(args.problem_id, args.example)
    except Exception as exc:  # noqa: BLE001 — CLI surface
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)

    print(json.dumps(payload, default=list))


if __name__ == "__main__":
    main()
