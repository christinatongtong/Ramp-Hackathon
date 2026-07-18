"""Validate a GPT-generated semantic + visual bundle against the observed trace."""

from __future__ import annotations

from backend.capabilities import (
    supported_effects,
    supported_entity_primitives,
    supported_events_for,
    supported_layouts,
    supported_presets,
    supported_primitives,
    supported_scene_types,
)
from backend.schemas import (
    ExecutionResult,
    GeneratedProblemBundle,
    ObservedTraceSchema,
    ProblemPackage,
)


def validate_bundle(
    bundle: GeneratedProblemBundle,
    problem: ProblemPackage,
    execution: ExecutionResult,
    observed: ObservedTraceSchema,
) -> list[str]:
    """Return validation errors (empty = ok). Does not raise."""

    errors: list[str] = []
    plan = bundle.visualPlan
    spec = bundle.semanticSpec
    structure = plan.structure
    theme = plan.theme

    if structure.type not in supported_scene_types():
        errors.append(f"Unsupported structure type '{structure.type}'.")

    if observed.structureType and structure.type != observed.structureType:
        errors.append(
            f"Plan structure '{structure.type}' does not match trace init "
            f"structure '{observed.structureType}'."
        )

    layout = getattr(structure, "layout", None)
    if layout and layout not in supported_layouts(structure.type):
        errors.append(f"Unsupported layout '{layout}' for '{structure.type}'.")

    if theme.preset not in supported_presets():
        errors.append(f"Unsupported theme preset '{theme.preset}'.")

    for prop in theme.props:
        if prop.primitive not in supported_primitives():
            errors.append(
                f"Unsupported prop primitive '{prop.primitive}' "
                f"(placement={prop.placement})."
            )

    if spec.sceneType != structure.type:
        errors.append(
            f"semanticSpec.sceneType '{spec.sceneType}' does not match "
            f"structure.type '{structure.type}'."
        )

    observed_values = set(observed.cellValues)
    bound_values = {binding.value for binding in spec.bindings}
    missing_values = observed_values - bound_values
    if missing_values:
        errors.append(
            "Missing state bindings for observed values: "
            + ", ".join(sorted(missing_values))
        )

    semantic_keys = [binding.semanticKey for binding in spec.bindings]
    if len(semantic_keys) != len(set(semantic_keys)):
        errors.append("semanticSpec.bindings must use unique semanticKey values.")

    value_keys = [binding.value for binding in spec.bindings]
    if len(value_keys) != len(set(value_keys)):
        errors.append("semanticSpec.bindings must use unique value entries.")

    for binding in spec.bindings:
        if binding.entityType not in supported_primitives():
            errors.append(
                f"Unsupported entityType '{binding.entityType}' "
                f"for value '{binding.value}'."
            )
        if binding.semanticKey not in plan.entities:
            errors.append(
                f"visualPlan.entities missing semantic key '{binding.semanticKey}'."
            )
        else:
            entity = plan.entities[binding.semanticKey]
            if entity.primitive != binding.entityType:
                errors.append(
                    f"Entity '{binding.semanticKey}' primitive "
                    f"'{entity.primitive}' != binding entityType "
                    f"'{binding.entityType}'."
                )

    orphan_entities = set(plan.entities) - set(semantic_keys)
    if orphan_entities:
        errors.append(
            "visualPlan.entities has keys without state bindings: "
            + ", ".join(sorted(orphan_entities))
        )

    allowed_events = supported_events_for(structure.type)
    trace_event_types = set(observed.eventTypes)
    bound_event_types = set(plan.eventBindings)
    unknown_bindings = bound_event_types - trace_event_types
    if unknown_bindings:
        errors.append(
            "Visual plan binds nonexistent trace events: "
            + ", ".join(sorted(unknown_bindings))
        )
    unsupported_events = (bound_event_types - allowed_events) - trace_event_types
    if unsupported_events:
        errors.append(
            f"Events not in {structure.type} vocabulary: "
            + ", ".join(sorted(unsupported_events))
        )
    if not bound_event_types:
        errors.append("Visual plan must bind at least one trace event.")

    important = {
        "grid": {"visit", "cell_update", "region_discovered", "path_mark", "done"},
        "array": {"compare", "pointer_move", "done", "write", "swap"},
    }.get(structure.type, {"done"})
    missing_important = (important & trace_event_types) - bound_event_types
    if missing_important:
        errors.append(
            "Missing event bindings for important trace events: "
            + ", ".join(sorted(missing_important))
        )

    for event_type, animation in plan.eventBindings.items():
        if animation.effect not in supported_effects():
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

    for label, reaction in (
        ("success", plan.resultChoreography.success),
        ("failure", plan.resultChoreography.failure),
    ):
        if reaction.effect not in supported_effects():
            errors.append(
                f"Unsupported resultChoreography.{label} effect '{reaction.effect}'."
            )

    configured_scene_type = problem.config.get("scene", {}).get("type")
    if configured_scene_type and structure.type != configured_scene_type:
        # height_map treated as grid
        if not (
            configured_scene_type == "height_map" and structure.type == "grid"
        ):
            errors.append(
                f"Plan structure '{structure.type}' does not match configured "
                f"scene type '{configured_scene_type}'."
            )

    _ = execution
    _ = supported_entity_primitives
    return errors
