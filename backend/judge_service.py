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
from collections import deque
from copy import deepcopy

payload = json.load(sys.stdin)
code = payload["code"]
class_name = payload["className"]
method_name = payload["methodName"]
tests = payload["tests"]
arguments = payload.get("arguments") or []
argument_codecs = payload.get("argumentCodecs") or {}
return_codec = payload.get("returnCodec")


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


class LinkedListCodec:
    def decode(self, values):
        if values is None:
            return None
        if not isinstance(values, list):
            raise TypeError("linked_list decode expects a JSON array or null")
        dummy = ListNode()
        current = dummy
        for value in values:
            current.next = ListNode(value)
            current = current.next
        return dummy.next

    def encode(self, head):
        if head is None:
            return []
        values = []
        seen = set()
        while head is not None:
            node_id = id(head)
            if node_id in seen:
                raise ValueError("Cycle detected while serializing linked list")
            seen.add(node_id)
            values.append(getattr(head, "val", head))
            head = getattr(head, "next", None)
        return values

    def normalize(self, value):
        if value is None:
            return []
        if isinstance(value, list):
            return list(value)
        return self.encode(value)


class BinaryTreeCodec:
    def decode(self, values):
        if values is None:
            return None
        if not isinstance(values, list) or not values or values[0] is None:
            return None
        root = TreeNode(values[0])
        queue = deque([root])
        index = 1
        while queue and index < len(values):
            node = queue.popleft()
            if index < len(values) and values[index] is not None:
                node.left = TreeNode(values[index])
                queue.append(node.left)
            index += 1
            if index < len(values) and values[index] is not None:
                node.right = TreeNode(values[index])
                queue.append(node.right)
            index += 1
        return root

    def encode(self, root):
        if root is None:
            return None
        values = []
        queue = deque([root])
        while queue:
            node = queue.popleft()
            if node is None:
                values.append(None)
                continue
            values.append(getattr(node, "val", None))
            queue.append(getattr(node, "left", None))
            queue.append(getattr(node, "right", None))
        while values and values[-1] is None:
            values.pop()
        return values

    def normalize(self, value):
        if value is None:
            return None
        if isinstance(value, list):
            return list(value)
        return self.encode(value)


class GraphCodec:
    def decode(self, value):
        return self.normalize(value)

    def encode(self, value):
        return self.normalize(value)

    def normalize(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise TypeError("graph codec expects an adjacency list")
        return [list(row) for row in value]


CODECS = {
    "linked_list": LinkedListCodec(),
    "binary_tree": BinaryTreeCodec(),
    "graph": GraphCodec(),
}


def apply_codec(name, value, direction):
    if not name:
        return value
    codec = CODECS.get(name)
    if codec is None:
        raise ValueError(f"Unknown codec '{name}'")
    if direction == "decode":
        return codec.decode(value)
    if direction == "encode":
        return codec.encode(value)
    return codec.normalize(value)


namespace = {
    "__name__": "__user__",
    "ListNode": ListNode,
    "TreeNode": TreeNode,
}
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


def decode_input(raw_input):
    if isinstance(raw_input, dict) and arguments:
        kwargs = {}
        for name in arguments:
            if name not in raw_input:
                raise KeyError(f"Missing argument '{name}' in test input")
            value = deepcopy(raw_input[name])
            kwargs[name] = apply_codec(argument_codecs.get(name), value, "decode")
        return ("kwargs", kwargs)
    if isinstance(raw_input, list) and len(arguments) > 1 and len(raw_input) == len(arguments):
        args = []
        for name, item in zip(arguments, raw_input):
            args.append(apply_codec(argument_codecs.get(name), deepcopy(item), "decode"))
        return ("args", args)
    value = deepcopy(raw_input)
    if arguments and len(arguments) == 1:
        value = apply_codec(argument_codecs.get(arguments[0]), value, "decode")
    return ("single", value)


def invoke(method, raw_input):
    kind, payload_value = decode_input(raw_input)
    if kind == "kwargs":
        return method(**payload_value)
    if kind == "args":
        return method(*payload_value)
    return method(payload_value)


def normalize_result(actual, expected):
    encoded = apply_codec(return_codec, actual, "encode") if return_codec else actual
    expected_norm = (
        apply_codec(return_codec, expected, "normalize") if return_codec else expected
    )
    return encoded, expected_norm


passed_count = 0
for index, test in enumerate(tests):
    expected = test["expected"]
    try:
        actual = invoke(method, test["input"])
        actual_norm, expected_norm = normalize_result(actual, expected)
    except Exception as error:
        print(json.dumps({
            "passed": False,
            "verdict": "runtime_error",
            "message": f"Runtime error on test {index + 1}: {error}",
            "testsPassed": passed_count,
            "testsTotal": len(tests),
        }))
        raise SystemExit(0)

    if actual_norm != expected_norm:
        print(json.dumps({
            "passed": False,
            "verdict": "wrong_answer",
            "message": f"Expected {expected_norm!r}, received {actual_norm!r}",
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
        "arguments": list(entrypoint.arguments),
        "argumentCodecs": dict(entrypoint.argumentCodecs),
        "returnCodec": entrypoint.returnCodec,
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
