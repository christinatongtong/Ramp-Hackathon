import type { EntityDefinition, ProblemSemanticSpec } from "@/lib/api/types";

/**
 * Resolve a grid cell value to its entity definition.
 * Prefers semanticSpec bindings; falls back to entities keyed by cell value.
 */
export function resolveEntityForCell(
  cellValue: string | number,
  entities: Record<string, EntityDefinition>,
  semanticSpec: ProblemSemanticSpec | null | undefined,
): EntityDefinition {
  const raw = String(cellValue);

  if (semanticSpec?.bindings?.length) {
    const binding = semanticSpec.bindings.find((item) => item.value === raw);
    if (binding) {
      const entity = entities[binding.semanticKey];
      if (entity) return entity;
      return {
        primitive: binding.entityType,
        variant: binding.semanticKey,
        color: "#888888",
        label: binding.label,
        idleAnimation: "none",
        expression: null,
      };
    }
  }

  return (
    entities[raw] ?? {
      primitive: "empty_tile",
      variant: "fallback",
      color: "#888888",
      label: raw,
      idleAnimation: "none",
      expression: null,
    }
  );
}
