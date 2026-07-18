import json
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PROBLEMS_ROOT = ROOT / "src" / "problems"
KNOWLEDGE_ROOT = ROOT / "knowledge"


class ProblemNotFoundError(FileNotFoundError):
    pass


def get_problem_directory(problem_id: str) -> Path:
    if not problem_id.replace("-", "").isalnum():
        raise ValueError("Problem id contains invalid characters.")

    problem_directory = (PROBLEMS_ROOT / problem_id).resolve()

    if PROBLEMS_ROOT.resolve() not in problem_directory.parents:
        raise ValueError("Problem path escapes the problems directory.")

    if not problem_directory.is_dir():
        raise ProblemNotFoundError(f"Unknown problem: {problem_id}")

    return problem_directory


def load_problem(problem_id: str) -> dict[str, Any]:
    problem_directory = get_problem_directory(problem_id)

    problem_path = problem_directory / "problem.md"
    config_path = problem_directory / "config.json"
    solution_path = problem_directory / "solution.py"

    for required_path in (problem_path, config_path, solution_path):
        if not required_path.exists():
            raise FileNotFoundError(f"Missing required file: {required_path}")

    return {
        "id": problem_id,
        "directory": problem_directory,
        "problem_markdown": problem_path.read_text(encoding="utf-8"),
        "config": json.loads(config_path.read_text(encoding="utf-8")),
        "solution": solution_path.read_text(encoding="utf-8"),
    }


def load_animation_knowledge() -> str:
    paths = [
        KNOWLEDGE_ROOT / "SKILL.md",
        KNOWLEDGE_ROOT / "references" / "animation-contract.md",
        KNOWLEDGE_ROOT / "references" / "grid-scenes.md",
        KNOWLEDGE_ROOT / "references" / "supported-effects.md",
        KNOWLEDGE_ROOT / "references" / "examples.md",
    ]

    sections: list[str] = []

    for path in paths:
        if not path.exists():
            raise FileNotFoundError(f"Missing knowledge file: {path}")

        sections.append(
            f"\n\n--- BEGIN {path.name} ---\n"
            f"{path.read_text(encoding='utf-8')}"
            f"\n--- END {path.name} ---"
        )

    return "".join(sections)


def run_problem_trace(problem_id: str) -> dict[str, Any]:
    command = [sys.executable, "-m", "src.runner", problem_id]

    completed = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )

    if completed.returncode != 0:
        raise RuntimeError(
            "Problem runner failed.\n"
            f"Command: {' '.join(command)}\n"
            f"stdout:\n{completed.stdout}\n"
            f"stderr:\n{completed.stderr}"
        )

    output = completed.stdout.strip()

    if not output:
        raise RuntimeError("Problem runner returned no JSON.")

    try:
        return json.loads(output)
    except json.JSONDecodeError as error:
        raise RuntimeError(
            "Problem runner did not return valid JSON.\n"
            f"Output:\n{output}"
        ) from error