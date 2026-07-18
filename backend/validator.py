from __future__ import annotations

from backend.problem_loader import get_cell_mapping
from backend.schemas import (
    SUPPORTED_EFFECTS,
    SUPPORTED_PRIMITIVES,
    ExecutionResult,
    GeneratedVisualPlan,
    ProblemPackage,
)


def get_trace_event_types(execution: ExecutionResult) -> set[str]:
    event_types: set[str] = set()

    for index, event in enumerate(execution.events):
        if not isinstance(event, dict):
            raise ValueError(f"Trace event {index} is not an object.")

        event_type = event.get("type")
        if not isinstance(event_type, str) or not event_type:
            raise ValueError(f"Trace event {index} has no valid type.")

        event_types.add(event_type)

    return event_types


def validate_visual_plan(
    plan: GeneratedVisualPlan,
    problem: ProblemPackage,
    execution: ExecutionResult,
) -> None:
    errors: list[str] = []

    trace_event_types = get_trace_event_types(execution)
    bound_event_types = set(plan.eventBindings)

    unknown_bindings = bound_event_types - trace_event_types
    if unknown_bindings:
        errors.append(
            "Visual plan binds nonexistent trace events: "
            + ", ".join(sorted(unknown_bindings))
        )

    if not bound_event_types:
        errors.append("Visual plan must bind at least one trace event.")

    for event_type, animation in plan.eventBindings.items():
        if animation.effect not in SUPPORTED_EFFECTS:
            errors.append(
                f"Unsupported effect '{animation.effect}' for event '{event_type}'."
            )
        if not 100 <= animation.durationMs <= 3000:
            errors.append(
                f"Event '{event_type}' durationMs must be between 100 and 3000."
            )

    for action in plan.intro:
        if not 100 <= action.durationMs <= 3000:
            errors.append(
                f"Intro action '{action.action}' durationMs must be between 100 and 3000."
            )

    cell_mapping = get_cell_mapping(problem.config)
    if cell_mapping:
        missing_entities = set(cell_mapping) - set(plan.entities)
        if missing_entities:
            errors.append(
                "Visual plan is missing entity definitions for cell values: "
                + ", ".join(sorted(missing_entities))
            )

    for cell_value, entity in plan.entities.items():
        if entity.primitive not in SUPPORTED_PRIMITIVES:
            errors.append(
                f"Unsupported primitive '{entity.primitive}' for cell value "
                f"'{cell_value}'."
            )

    configured_scene_type = problem.config.get("scene", {}).get("type")
    if configured_scene_type and plan.scene.type != configured_scene_type:
        errors.append(
            f"Plan scene type '{plan.scene.type}' does not match configured "
            f"scene type '{configured_scene_type}'."
        )

    # Presentation-only: reject accidental algorithm fields if present as extras
    # (StrictModel already forbids extras on nested models.)
    forbidden_plan_keys = {
        "events",
        "result",
        "expected",
        "coordinates",
        "finalState",
        "initialState",
    }
    leaked = forbidden_plan_keys.intersection(plan.model_dump().keys())
    if leaked:
        errors.append(
            "Visual plan must not include execution fields: "
            + ", ".join(sorted(leaked))
        )

    if errors:
        raise ValueError(
            "Generated visual plan failed validation:\n- " + "\n- ".join(errors)
        )
