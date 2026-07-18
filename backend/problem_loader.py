from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.schemas import ProblemDetail, ProblemPackage, ProblemSummary
from backend.settings import get_settings


class ProblemNotFoundError(FileNotFoundError):
    pass


def get_problem_directory(problem_id: str) -> Path:
    if not problem_id.replace("-", "").isalnum():
        raise ValueError("Problem id contains invalid characters.")

    problems_root = get_settings().problems_root
    problem_directory = (problems_root / problem_id).resolve()

    if problems_root not in problem_directory.parents:
        raise ValueError("Problem path escapes the problems directory.")

    if not problem_directory.is_dir():
        raise ProblemNotFoundError(f"Unknown problem: {problem_id}")

    return problem_directory


def load_problem(problem_id: str) -> ProblemPackage:
    problem_directory = get_problem_directory(problem_id)

    problem_path = problem_directory / "problem.md"
    config_path = problem_directory / "config.json"
    solution_path = problem_directory / "solution.py"

    for required_path in (problem_path, config_path, solution_path):
        if not required_path.exists():
            raise FileNotFoundError(f"Missing required file: {required_path}")

    config = json.loads(config_path.read_text(encoding="utf-8"))

    return ProblemPackage(
        id=problem_id,
        directory=problem_directory,
        problem_markdown=problem_path.read_text(encoding="utf-8"),
        config=config,
        solution=solution_path.read_text(encoding="utf-8"),
    )


def list_problem_ids() -> list[str]:
    registry_path = get_settings().problems_root / "registry.json"

    if not registry_path.exists():
        raise FileNotFoundError(f"Missing registry: {registry_path}")

    payload = json.loads(registry_path.read_text(encoding="utf-8"))
    problems = payload.get("problems")

    if not isinstance(problems, list) or not all(isinstance(item, str) for item in problems):
        raise ValueError("registry.json must contain a string list under 'problems'.")

    return problems


def list_problems() -> list[ProblemSummary]:
    summaries: list[ProblemSummary] = []

    for problem_id in list_problem_ids():
        problem = load_problem(problem_id)
        config = problem.config
        summaries.append(
            ProblemSummary(
                id=problem_id,
                title=str(config.get("title", problem_id)),
                difficulty=str(config.get("difficulty", "Unknown")),
                category=str(config.get("category", "unknown")),
                algorithm=list(config.get("algorithm", [])),
            )
        )

    return summaries


def get_problem_detail(problem_id: str) -> ProblemDetail:
    problem = load_problem(problem_id)
    config = problem.config

    return ProblemDetail(
        id=problem_id,
        title=str(config.get("title", problem_id)),
        difficulty=str(config.get("difficulty", "Unknown")),
        category=str(config.get("category", "unknown")),
        algorithm=list(config.get("algorithm", [])),
        problemMarkdown=problem.problem_markdown,
        config=config,
    )


def get_cell_mapping(config: dict[str, Any]) -> dict[str, Any]:
    scene = config.get("scene", {})
    mapping = scene.get("cellMapping") or scene.get("cell_mapping")

    if mapping is None:
        return {}

    if not isinstance(mapping, dict):
        raise ValueError("config.scene.cellMapping must be an object.")

    return {str(key): value for key, value in mapping.items()}
