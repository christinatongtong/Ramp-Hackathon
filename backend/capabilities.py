"""Load the shared visual-capabilities.json manifest."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parents[1]
_CAPABILITIES_PATH = _ROOT / "visual-capabilities.json"


@lru_cache(maxsize=1)
def load_capabilities() -> dict[str, Any]:
    payload = json.loads(_CAPABILITIES_PATH.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("visual-capabilities.json must be an object.")
    return payload


def supported_presets() -> frozenset[str]:
    return frozenset(str(item) for item in load_capabilities().get("presets", []))


def supported_entity_primitives() -> frozenset[str]:
    return frozenset(
        str(item) for item in load_capabilities().get("entityPrimitives", [])
    )


def supported_prop_primitives() -> frozenset[str]:
    return frozenset(
        str(item) for item in load_capabilities().get("propPrimitives", [])
    )


def supported_primitives() -> frozenset[str]:
    return supported_entity_primitives() | supported_prop_primitives()


def supported_effects() -> frozenset[str]:
    return frozenset(str(item) for item in load_capabilities().get("effects", []))


def supported_grid_events() -> frozenset[str]:
    return frozenset(str(item) for item in load_capabilities().get("gridEvents", []))


def plan_uses_supported_capabilities(plan: dict[str, Any]) -> list[str]:
    """Return capability violations for a raw visual-plan dict (empty = ok)."""

    errors: list[str] = []
    world = plan.get("world")
    if not isinstance(world, dict):
        return ["Visual plan is missing world."]

    preset = world.get("preset")
    if preset not in supported_presets():
        errors.append(f"Unsupported world preset '{preset}'.")

    for prop in world.get("props") or []:
        if not isinstance(prop, dict):
            continue
        primitive = prop.get("primitive")
        if primitive not in supported_primitives():
            errors.append(f"Unsupported prop primitive '{primitive}'.")

    entities = plan.get("entities") or {}
    if isinstance(entities, dict):
        for cell_value, entity in entities.items():
            if not isinstance(entity, dict):
                continue
            primitive = entity.get("primitive")
            if primitive not in supported_primitives():
                errors.append(
                    f"Unsupported primitive '{primitive}' for cell value '{cell_value}'."
                )

    bindings = plan.get("eventBindings") or {}
    if isinstance(bindings, dict):
        for event_type, animation in bindings.items():
            if not isinstance(animation, dict):
                continue
            effect = animation.get("effect")
            if effect not in supported_effects():
                errors.append(
                    f"Unsupported effect '{effect}' for event '{event_type}'."
                )

    choreography = plan.get("resultChoreography") or {}
    if isinstance(choreography, dict):
        for label in ("success", "failure"):
            reaction = choreography.get(label)
            if isinstance(reaction, dict):
                effect = reaction.get("effect")
                if effect not in supported_effects():
                    errors.append(
                        f"Unsupported resultChoreography.{label} effect '{effect}'."
                    )

    return errors
