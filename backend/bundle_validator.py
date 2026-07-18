"""Validate a GPT-generated semantic + visual bundle against the observed trace."""

from __future__ import annotations

from backend.capabilities import (
    supported_effects,
    supported_entity_primitives,
    supported_presets,
    supported_primitives,
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

    _ = execution
    errors: list[str] = []
    plan = bundle.visualPlan
    spec = bundle.semanticSpec

    if plan.world.preset not in supported_presets():
        errors.append(f"Unsupported world preset '{plan.world.preset}'.")

    for prop in plan.world.props:
        if prop.primitive not in supported_primitives():
            errors.append(
                f"Unsupported prop primitive '{prop.primitive}' "
                f"(placement={prop.placement})."
            )

    observed_values = set(observed.cellValues)
    bound_values = {binding.value for binding in spec.bindings}
    missing_values = observed_values - bound_values
    if missing_values:
        errors.append(
            "Missing state bindings for observed cell values: "
            + ", ".join(sorted(missing_values))
        )

    extra_values = bound_values - observed_values
    # Extra bindings are allowed (e.g. unused height levels) — no error.

    semantic_keys = [binding.semanticKey for binding in spec.bindings]
    if len(semantic_keys) != len(set(semantic_keys)):
        errors.append("semanticSpec.bindings must use unique semanticKey values.")

    value_keys = [binding.value for binding in spec.bindings]
    if len(value_keys) != len(set(value_keys)):
        errors.append("semanticSpec.bindings must use unique value entries.")

    entity_primitives = supported_entity_primitives()
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
            if (
                entity.primitive not in entity_primitives
                and entity.primitive not in supported_primitives()
            ):
                errors.append(
                    f"Unsupported entity primitive '{entity.primitive}' "
                    f"for '{binding.semanticKey}'."
                )

    orphan_entities = set(plan.entities) - set(semantic_keys)
    if orphan_entities:
        errors.append(
            "visualPlan.entities has keys without state bindings: "
            + ", ".join(sorted(orphan_entities))
        )

    trace_event_types = set(observed.eventTypes)
    bound_event_types = set(plan.eventBindings)
    unknown_bindings = bound_event_types - trace_event_types
    if unknown_bindings:
        errors.append(
            "Visual plan binds nonexistent trace events: "
            + ", ".join(sorted(unknown_bindings))
        )
    if not bound_event_types:
        errors.append("Visual plan must bind at least one trace event.")

    # Prefer binding the important algorithm events when present.
    important = {"visit", "cell_update", "region_discovered", "path_mark", "done"}
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
    if configured_scene_type and plan.world.sceneType != configured_scene_type:
        errors.append(
            f"Plan scene type '{plan.world.sceneType}' does not match configured "
            f"scene type '{configured_scene_type}'."
        )
    if spec.sceneType != plan.world.sceneType:
        errors.append(
            f"semanticSpec.sceneType '{spec.sceneType}' does not match "
            f"visualPlan.world.sceneType '{plan.world.sceneType}'."
        )

    return errors
