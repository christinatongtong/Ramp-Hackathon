import json
import os
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

from backend.animation_schema import AnimationPlan
from backend.context_loader import ROOT, load_animation_knowledge


load_dotenv(ROOT / ".env")


SYSTEM_PROMPT = """
You design educational animations for an algorithm-learning game.

Your job is to convert a verified algorithm problem and execution trace into an
AnimationPlan.

Hard rules:

1. The execution trace is factual. Never invent, remove, reorder, or reinterpret
   algorithm behavior.
2. Only bind animations to event types that exist in the supplied trace.
3. Only use primitives, actions, camera modes, and effects allowed by the
   response schema.
4. The animation must make the algorithm easier to understand.
5. Decorative effects must not obscure grid state.
6. The animation plan describes presentation, not algorithm execution.
7. Do not generate JavaScript, Python, React, Three.js, or shader code.
8. Keep animation durations suitable for interactive playback.
9. The plan must work for different inputs to the same problem.
10. Return the structured AnimationPlan only.
""".strip()


def build_generation_input(
    problem: dict[str, Any],
    trace: dict[str, Any],
) -> str:
    knowledge = load_animation_knowledge()

    payload = {
        "problem_id": problem["id"],
        "problem_markdown": problem["problem_markdown"],
        "config": problem["config"],
        "canonical_solution": problem["solution"],
        "verified_trace": trace,
    }

    return (
        "Create an animation plan for the following problem.\n\n"
        "ANIMATION SYSTEM KNOWLEDGE:\n"
        f"{knowledge}\n\n"
        "PROBLEM PACKAGE AND VERIFIED TRACE:\n"
        f"{json.dumps(payload, indent=2)}"
    )


def generate_animation_plan(
    problem: dict[str, Any],
    trace: dict[str, Any],
) -> AnimationPlan:
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Add it to the repository's .env file."
        )

    model = os.getenv("OPENAI_MODEL", "gpt-5.6-sol")
    client = OpenAI(api_key=api_key)

    # Structured output via the Responses API — no browser calls.
    response = client.responses.parse(
        model=model,
        input=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": build_generation_input(problem, trace),
            },
        ],
        text_format=AnimationPlan,
    )

    if response.output_parsed is None:
        raise RuntimeError(
            "The model did not return a parsed animation plan. "
            f"Raw output: {response.output_text}"
        )

    return response.output_parsed