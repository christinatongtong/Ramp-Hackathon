from typing import Any

from backend.animation_schema import AnimationPlan


def get_trace_event_types(trace: dict[str, Any]) -> set[str]:
    events = trace.get("events")

    if not isinstance(events, list):
        raise ValueError("Trace must contain an events list.")

    event_types: set[str] = set()

    for index, event in enumerate(events):
        if not isinstance(event, dict):
            raise ValueError(f"Trace event {index} is not an object.")

        event_type = event.get("type")

        if not isinstance(event_type, str) or not event_type:
            raise ValueError(f"Trace event {index} has no valid type.")

        event_types.add(event_type)

    return event_types


def get_cell_mapping(config: dict[str, Any]) -> dict[str, Any]:
    scene = config.get("scene", {})

    mapping = scene.get("cellMapping") or scene.get("cell_mapping")

    if mapping is None:
        return {}

    if not isinstance(mapping, dict):
        raise ValueError("config.scene.cellMapping must be an object.")

    return {str(key): value for key, value in mapping.items()}


def validate_animation_plan(
    plan: AnimationPlan,
    problem: dict[str, Any],
    trace: dict[str, Any],
) -> None:
    errors: list[str] = []

    if plan.problem_id != problem["id"]:
        errors.append(
            f"Plan problem_id '{plan.problem_id}' does not match "
            f"'{problem['id']}'."
        )

    trace_event_types = get_trace_event_types(trace)
    bound_event_types = {binding.event_type for binding in plan.event_bindings}

    unknown_bindings = bound_event_types - trace_event_types

    if unknown_bindings:
        errors.append(
            "Animation plan binds nonexistent trace events: "
            + ", ".join(sorted(unknown_bindings))
        )

    if not bound_event_types:
        errors.append("Animation plan must bind at least one trace event.")

    cell_mapping = get_cell_mapping(problem["config"])
    entity_keys = {binding.cell_value for binding in plan.entities}

    if cell_mapping:
        missing_entities = set(cell_mapping) - entity_keys

        if missing_entities:
            errors.append(
                "Animation plan is missing entity definitions for cell values: "
                + ", ".join(sorted(missing_entities))
            )

    configured_scene_type = (
        problem["config"].get("scene", {}).get("type")
    )

    if configured_scene_type and plan.scene.type != configured_scene_type:
        errors.append(
            f"Plan scene type '{plan.scene.type}' does not match configured "
            f"scene type '{configured_scene_type}'."
        )

    if errors:
        raise ValueError(
            "Generated animation plan failed validation:\n- "
            + "\n- ".join(errors)
        )
