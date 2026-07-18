from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

from backend.schemas import (
    EntrypointSpec,
    JudgeTest,
    ProblemDetail,
    ProblemExample,
    ProblemFacts,
    ProblemPackage,
    ProblemSummary,
)
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
    """Internal load — includes full config (hidden tests + solution)."""

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
    """Discover problem packages by directory (no manual registry edit)."""

    problems_root = get_settings().problems_root
    if not problems_root.is_dir():
        raise FileNotFoundError(f"Missing problems root: {problems_root}")

    ids: list[str] = []
    for path in sorted(problems_root.iterdir()):
        if not path.is_dir():
            continue
        if path.name.startswith(".") or path.name.startswith("_"):
            continue
        if (path / "problem.md").exists() and (path / "solution.py").exists():
            ids.append(path.name)
    return ids


def list_problems() -> list[ProblemSummary]:
    summaries: list[ProblemSummary] = []

    for problem_id in list_problem_ids():
        problem = load_problem(problem_id)
        config = problem.config
        number = config.get("number")
        summaries.append(
            ProblemSummary(
                id=problem_id,
                title=str(config.get("title", problem_id)),
                difficulty=str(config.get("difficulty", "Unknown")),
                category=str(config.get("category", "unknown")),
                algorithm=list(config.get("algorithm", [])),
                number=int(number) if isinstance(number, int) else None,
                hasVisualPlan=is_problem_unlocked(problem_id),
            )
        )

    return summaries


def is_problem_unlocked(problem_id: str) -> bool:
    """Hub unlock: published + valid visual plan (+ semantic when present)."""

    from backend.publication_store import is_published
    from backend.visual_plan_store import load_visual_plan

    if not is_published(problem_id):
        return False
    try:
        return load_visual_plan(problem_id) is not None
    except (ValueError, FileNotFoundError):
        return False


def get_client_facts_package_parts(
    problem_id: str,
    example_index: int | None = None,
) -> tuple[ProblemFacts, dict[str, Any]]:
    facts = get_problem_facts(problem_id)
    problem = load_problem(problem_id)
    index = (
        example_index
        if example_index is not None
        else int(problem.config.get("defaultExample", 0))
    )
    return facts, get_initial_state(problem.config, index)


def get_problem_detail(problem_id: str) -> ProblemDetail:
    """Public detail — config without hidden tests."""

    problem = load_problem(problem_id)
    config = _public_config(problem.config)

    return ProblemDetail(
        id=problem_id,
        title=str(config.get("title", problem_id)),
        difficulty=str(config.get("difficulty", "Unknown")),
        category=str(config.get("category", "unknown")),
        algorithm=list(config.get("algorithm", [])),
        problemMarkdown=problem.problem_markdown,
        config=config,
    )


def _public_config(config: dict[str, Any]) -> dict[str, Any]:
    public = deepcopy(config)
    public.pop("tests", None)
    return public


def _parse_examples(config: dict[str, Any]) -> list[ProblemExample]:
    examples: list[ProblemExample] = []
    raw_examples = config.get("examples", [])
    if not isinstance(raw_examples, list):
        return examples

    for item in raw_examples:
        if not isinstance(item, dict):
            continue
        examples.append(
            ProblemExample(
                name=item.get("name"),
                input=item.get("input"),
                expected=item.get("expected"),
            )
        )
    return examples


def get_entrypoint(config: dict[str, Any]) -> EntrypointSpec:
    raw = config.get("entrypoint")
    if isinstance(raw, dict):
        method_name = raw.get("methodName") or raw.get("method") or "solve"
        return EntrypointSpec(
            language=str(raw.get("language", "python")),
            className=str(raw.get("className", "Solution")),
            methodName=str(method_name),
            arguments=[str(arg) for arg in raw.get("arguments", [])],
        )
    return EntrypointSpec(
        language="python",
        className="Solution",
        methodName="solve",
        arguments=["grid"],
    )


def get_judge_tests(config: dict[str, Any]) -> list[JudgeTest]:
    """Internal tests used for judging (includes hidden). Falls back to examples."""

    tests: list[JudgeTest] = []
    raw_tests = config.get("tests")
    if isinstance(raw_tests, list) and raw_tests:
        for item in raw_tests:
            if not isinstance(item, dict):
                continue
            tests.append(
                JudgeTest(
                    input=item.get("input"),
                    expected=item.get("expected"),
                    hidden=bool(item.get("hidden", False)),
                    name=item.get("name"),
                )
            )
        return tests

    for example in _parse_examples(config):
        tests.append(
            JudgeTest(
                input=example.input,
                expected=example.expected,
                hidden=False,
                name=example.name,
            )
        )
    return tests


def get_initial_state(
    config: dict[str, Any],
    example_index: int | None = None,
) -> dict[str, Any]:
    examples = config.get("examples")
    if not isinstance(examples, list) or not examples:
        return {}

    index = (
        example_index
        if example_index is not None
        else int(config.get("defaultExample", 0))
    )
    if index < 0 or index >= len(examples):
        index = 0

    example = examples[index]
    if not isinstance(example, dict):
        return {}

    initial_input = deepcopy(example.get("input"))
    if isinstance(initial_input, list):
        return {"grid": initial_input}
    if isinstance(initial_input, dict):
        return dict(initial_input)
    return {"input": initial_input}


def get_problem_facts(problem_id: str) -> ProblemFacts:
    """Public problem facts — no hidden tests."""

    problem = load_problem(problem_id)
    config = problem.config
    number = config.get("number")

    return ProblemFacts(
        id=problem_id,
        title=str(config.get("title", problem_id)),
        difficulty=str(config.get("difficulty", "Unknown")),
        category=str(config.get("category", "unknown")),
        algorithm=list(config.get("algorithm", [])),
        number=int(number) if isinstance(number, int) else None,
        description=problem.problem_markdown,
        examples=_parse_examples(config),
        entrypoint=get_entrypoint(config),
        starterCode=str(config.get("starterCode", "")),
        defaultExample=int(config.get("defaultExample", 0)),
    )


def get_cell_mapping(config: dict[str, Any]) -> dict[str, Any]:
    scene = config.get("scene", {})
    mapping = scene.get("cellMapping") or scene.get("cell_mapping")

    if mapping is None:
        return {}

    if not isinstance(mapping, dict):
        raise ValueError("config.scene.cellMapping must be an object.")

    return {str(key): value for key, value in mapping.items()}
