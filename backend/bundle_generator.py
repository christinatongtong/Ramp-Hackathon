"""Generate a semantic + visual bundle with one structured GPT call."""

from __future__ import annotations

from openai import OpenAI

from backend.schemas import (
    GeneratedProblemBundle,
    GeneratedVisualPlan,
    ParsedProblemBundle,
    coerce_structure,
)
from backend.settings import get_settings


def generate_problem_bundle(
    messages: list[dict],
    problem_id: str,
) -> GeneratedProblemBundle:
    settings = get_settings()
    client = OpenAI(api_key=settings.openai_api_key)

    response = client.responses.parse(
        model=settings.openai_model,
        input=messages,
        text_format=ParsedProblemBundle,
    )

    if response.output_parsed is None:
        raise RuntimeError(
            "The model did not return a parsed problem bundle. "
            f"Raw output: {response.output_text}"
        )

    parsed = response.output_parsed
    visual = parsed.visualPlan

    return GeneratedProblemBundle(
        problemId=problem_id,
        semanticSpec=parsed.semanticSpec,
        visualPlan=GeneratedVisualPlan(
            structure=coerce_structure(visual.structure),
            theme=visual.theme,
            entities={
                binding.semanticKey: binding.entity for binding in visual.entities
            },
            eventBindings={
                binding.eventType: binding.animation
                for binding in visual.eventBindings
            },
            resultChoreography=visual.resultChoreography,
            intro=visual.intro,
        ),
    )
