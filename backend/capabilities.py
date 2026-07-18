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


def supported_scene_types() -> frozenset[str]:
    return frozenset(str(item) for item in load_capabilities().get("sceneTypes", []))


def supported_layouts(scene_type: str) -> frozenset[str]:
    layouts = load_capabilities().get("layouts") or {}
    return frozenset(str(item) for item in layouts.get(scene_type, []))


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


def supported_marker_primitives() -> frozenset[str]:
    return frozenset(
        str(item) for item in load_capabilities().get("markerPrimitives", [])
    )


def supported_connection_primitives() -> frozenset[str]:
    return frozenset(
        str(item) for item in load_capabilities().get("connectionPrimitives", [])
    )


def supported_primitives() -> frozenset[str]:
    return (
        supported_entity_primitives()
        | supported_prop_primitives()
        | supported_marker_primitives()
        | supported_connection_primitives()
    )


def supported_effects() -> frozenset[str]:
    return frozenset(str(item) for item in load_capabilities().get("effects", []))


def supported_grid_events() -> frozenset[str]:
    return frozenset(str(item) for item in load_capabilities().get("gridEvents", []))


def supported_array_events() -> frozenset[str]:
    return frozenset(str(item) for item in load_capabilities().get("arrayEvents", []))


def supported_events_for(structure_type: str) -> frozenset[str]:
    caps = load_capabilities()
    by_structure = caps.get("eventsByStructure") or {}
    if isinstance(by_structure, dict) and structure_type in by_structure:
        return frozenset(str(item) for item in by_structure[structure_type])
    if structure_type == "array":
        return supported_array_events()
    if structure_type == "linked_list":
        return frozenset(
            {
                "init",
                "pointer_set",
                "pointer_move",
                "link_update",
                "node_visit",
                "node_finalize",
                "done",
            }
        )
    if structure_type == "binary_tree":
        return frozenset(
            {
                "init",
                "node_visit",
                "child_swap",
                "move_left",
                "move_right",
                "subtree_complete",
                "done",
            }
        )
    if structure_type == "graph":
        return frozenset(
            {
                "init",
                "node_visit",
                "edge_examine",
                "node_enqueue",
                "indegree_update",
                "node_finalize",
                "cycle_detected",
                "done",
            }
        )
    return supported_grid_events()


def _theme_from_plan(plan: dict[str, Any]) -> dict[str, Any] | None:
    theme = plan.get("theme")
    if isinstance(theme, dict):
        return theme
    world = plan.get("world")
    if isinstance(world, dict):
        return world
    return None


def plan_uses_supported_capabilities(plan: dict[str, Any]) -> list[str]:
    """Return capability violations for a raw visual-plan dict (empty = ok)."""

    errors: list[str] = []
    theme = _theme_from_plan(plan)
    if theme is None:
        return ["Visual plan is missing theme/world."]

    structure = plan.get("structure")
    if isinstance(structure, dict):
        stype = structure.get("type")
        if stype not in supported_scene_types():
            errors.append(f"Unsupported structure type '{stype}'.")
        layout = structure.get("layout")
        if layout and stype in supported_scene_types():
            if layout not in supported_layouts(str(stype)):
                errors.append(f"Unsupported layout '{layout}' for '{stype}'.")

    preset = theme.get("preset")
    if preset not in supported_presets():
        errors.append(f"Unsupported theme preset '{preset}'.")

    for prop in theme.get("props") or []:
        if not isinstance(prop, dict):
            continue
        primitive = prop.get("primitive")
        if primitive not in supported_primitives():
            errors.append(f"Unsupported prop primitive '{primitive}'.")

    entities = plan.get("entities") or {}
    if isinstance(entities, dict):
        for key, entity in entities.items():
            if not isinstance(entity, dict):
                continue
            primitive = entity.get("primitive")
            if primitive not in supported_primitives():
                errors.append(
                    f"Unsupported primitive '{primitive}' for entity '{key}'."
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
