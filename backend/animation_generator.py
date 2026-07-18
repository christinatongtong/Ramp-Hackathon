from __future__ import annotations

from openai import OpenAI

from backend.schemas import GeneratedVisualPlan, ParsedVisualPlan
from backend.settings import get_settings


def generate_visual_plan(messages: list[dict]) -> GeneratedVisualPlan:
    """Legacy visual-only generation. Prefer generate_problem_bundle."""

    settings = get_settings()
    client = OpenAI(api_key=settings.openai_api_key)

    response = client.responses.parse(
        model=settings.openai_model,
        input=messages,
        text_format=ParsedVisualPlan,
    )

    if response.output_parsed is None:
        raise RuntimeError(
            "The model did not return a parsed visual plan. "
            f"Raw output: {response.output_text}"
        )

    parsed = response.output_parsed

    return GeneratedVisualPlan(
        world=parsed.world,
        entities={
            binding.semanticKey: binding.entity for binding in parsed.entities
        },
        eventBindings={
            binding.eventType: binding.animation for binding in parsed.eventBindings
        },
        resultChoreography=parsed.resultChoreography,
        intro=parsed.intro,
    )
