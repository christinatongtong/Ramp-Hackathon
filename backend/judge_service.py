"""Subprocess-based judge for untrusted user Python.

Runs outside the FastAPI request handler's trust boundary: the worker is a
separate process with a timeout. AST checks block obvious dangerous imports
and builtins. This is a hackathon MVP sandbox, not production isolation.
"""

from __future__ import annotations

import ast
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from backend.schemas import EntrypointSpec, JudgeTest, Verdict


BLOCKED_MODULES = frozenset(
    {
        "os",
        "sys",
        "subprocess",
        "socket",
        "pathlib",
        "shutil",
        "ctypes",
        "importlib",
        "builtins",
        "pickle",
        "http",
        "urllib",
        "requests",
        "multiprocessing",
        "threading",
        "signal",
        "resource",
        "fcntl",
        "pty",
        "fcntl",
    }
)

BLOCKED_NAMES = frozenset(
    {
        "open",
        "exec",
        "eval",
        "compile",
        "__import__",
        "input",
        "breakpoint",
        "exit",
        "quit",
        "help",
        "memoryview",
    }
)

JUDGE_TIMEOUT_SECONDS = 5


class JudgeResult:
    def __init__(
        self,
        *,
        passed: bool,
        verdict: Verdict,
        message: str,
        tests_passed: int,
        tests_total: int,
        example_index: int = 0,
    ) -> None:
        self.passed = passed
        self.verdict = verdict
        self.message = message
        self.tests_passed = tests_passed
        self.tests_total = tests_total
        self.example_index = example_index


def _validate_source_ast(code: str) -> str | None:
    """Return an error message if the source fails static safety checks."""

    try:
        tree = ast.parse(code)
    except SyntaxError as error:
        line = f" on line {error.lineno}" if error.lineno else ""
        return f"Syntax error{line}: {error.msg}"

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root = alias.name.split(".", 1)[0]
                if root in BLOCKED_MODULES:
                    return f"Import of '{alias.name}' is not allowed"
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                root = node.module.split(".", 1)[0]
                if root in BLOCKED_MODULES:
                    return f"Import of '{node.module}' is not allowed"
        elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
            if node.id in BLOCKED_NAMES:
                return f"Use of '{node.id}' is not allowed"
        elif isinstance(node, ast.Attribute):
            if node.attr.startswith("__"):
                return "Dunder attribute access is not allowed"

    return None


WORKER_SOURCE = r'''
import json
import sys
import traceback
from copy import deepcopy

payload = json.load(sys.stdin)
code = payload["code"]
class_name = payload["className"]
method_name = payload["methodName"]
tests = payload["tests"]

namespace = {"__name__": "__user__"}
try:
    compiled = compile(code, "<submission>", "exec")
    exec(compiled, namespace, namespace)
except SyntaxError as error:
    line = f" on line {error.lineno}" if error.lineno else ""
    print(json.dumps({
        "passed": False,
        "verdict": "syntax_error",
        "message": f"Syntax error{line}: {error.msg}",
        "testsPassed": 0,
        "testsTotal": len(tests),
    }))
    raise SystemExit(0)
except Exception as error:
    print(json.dumps({
        "passed": False,
        "verdict": "runtime_error",
        "message": f"Runtime error while loading submission: {error}",
        "testsPassed": 0,
        "testsTotal": len(tests),
    }))
    raise SystemExit(0)

solution_cls = namespace.get(class_name)
if solution_cls is None:
    print(json.dumps({
        "passed": False,
        "verdict": "runtime_error",
        "message": f"Missing class '{class_name}'",
        "testsPassed": 0,
        "testsTotal": len(tests),
    }))
    raise SystemExit(0)

try:
    solution = solution_cls()
except Exception as error:
    print(json.dumps({
        "passed": False,
        "verdict": "runtime_error",
        "message": f"Could not construct {class_name}(): {error}",
        "testsPassed": 0,
        "testsTotal": len(tests),
    }))
    raise SystemExit(0)

method = getattr(solution, method_name, None)
if not callable(method):
    print(json.dumps({
        "passed": False,
        "verdict": "runtime_error",
        "message": f"Missing method '{class_name}.{method_name}'",
        "testsPassed": 0,
        "testsTotal": len(tests),
    }))
    raise SystemExit(0)

passed_count = 0
for index, test in enumerate(tests):
    expected = test["expected"]
    try:
        actual = method(deepcopy(test["input"]))
    except Exception as error:
        print(json.dumps({
            "passed": False,
            "verdict": "runtime_error",
            "message": f"Runtime error on test {index + 1}: {error}",
            "testsPassed": passed_count,
            "testsTotal": len(tests),
        }))
        raise SystemExit(0)

    if actual != expected:
        print(json.dumps({
            "passed": False,
            "verdict": "wrong_answer",
            "message": f"Expected {expected!r}, received {actual!r}",
            "testsPassed": passed_count,
            "testsTotal": len(tests),
        }))
        raise SystemExit(0)

    passed_count += 1

print(json.dumps({
    "passed": True,
    "verdict": "accepted",
    "message": f"All {len(tests)} tests passed",
    "testsPassed": passed_count,
    "testsTotal": len(tests),
}))
'''


def judge_user_code(
    *,
    code: str,
    entrypoint: EntrypointSpec,
    tests: list[JudgeTest],
    example_index: int = 0,
) -> JudgeResult:
    tests_total = len(tests)
    if tests_total == 0:
        return JudgeResult(
            passed=False,
            verdict="runtime_error",
            message="No judge tests configured for this problem.",
            tests_passed=0,
            tests_total=0,
            example_index=example_index,
        )

    ast_error = _validate_source_ast(code)
    if ast_error:
        verdict: Verdict = (
            "syntax_error" if ast_error.startswith("Syntax error") else "runtime_error"
        )
        return JudgeResult(
            passed=False,
            verdict=verdict,
            message=ast_error,
            tests_passed=0,
            tests_total=tests_total,
            example_index=example_index,
        )

    payload = {
        "code": code,
        "className": entrypoint.className,
        "methodName": entrypoint.methodName,
        "tests": [
            {"input": test.input, "expected": test.expected} for test in tests
        ],
    }

    with tempfile.TemporaryDirectory(prefix="judge-") as temp_dir:
        worker_path = Path(temp_dir) / "worker.py"
        worker_path.write_text(WORKER_SOURCE, encoding="utf-8")

        try:
            completed = subprocess.run(
                [sys.executable, str(worker_path)],
                input=json.dumps(payload),
                capture_output=True,
                text=True,
                timeout=JUDGE_TIMEOUT_SECONDS,
                cwd=temp_dir,
                env={
                    "PATH": os.environ.get("PATH", ""),
                    "HOME": temp_dir,
                    "TMPDIR": temp_dir,
                    "PYTHONDONTWRITEBYTECODE": "1",
                    "PYTHONNOUSERSITE": "1",
                    "OPENAI_API_KEY": "",
                    "PYTHONPATH": "",
                },
                check=False,
            )
        except subprocess.TimeoutExpired:
            return JudgeResult(
                passed=False,
                verdict="time_limit_exceeded",
                message="Your solution exceeded the time limit",
                tests_passed=0,
                tests_total=tests_total,
                example_index=example_index,
            )

    stdout = (completed.stdout or "").strip()
    if not stdout:
        stderr = (completed.stderr or "").strip()
        return JudgeResult(
            passed=False,
            verdict="runtime_error",
            message=stderr or "Judge worker returned no output",
            tests_passed=0,
            tests_total=tests_total,
            example_index=example_index,
        )

    try:
        data = json.loads(stdout.splitlines()[-1])
    except json.JSONDecodeError:
        return JudgeResult(
            passed=False,
            verdict="runtime_error",
            message="Judge worker returned invalid JSON",
            tests_passed=0,
            tests_total=tests_total,
            example_index=example_index,
        )

    verdict_raw = str(data.get("verdict", "runtime_error"))
    allowed: set[str] = {
        "accepted",
        "wrong_answer",
        "syntax_error",
        "runtime_error",
        "time_limit_exceeded",
    }
    verdict_value: Verdict = (
        verdict_raw if verdict_raw in allowed else "runtime_error"  # type: ignore[assignment]
    )

    return JudgeResult(
        passed=bool(data.get("passed")),
        verdict=verdict_value,
        message=str(data.get("message", "")),
        tests_passed=int(data.get("testsPassed", 0)),
        tests_total=int(data.get("testsTotal", tests_total)),
        example_index=example_index,
    )
