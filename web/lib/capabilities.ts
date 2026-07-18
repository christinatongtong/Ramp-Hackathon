import capabilities from "./visual-capabilities.json";

export type VisualCapabilities = {
  sceneTypes: string[];
  layouts: Record<string, string[]>;
  presets: string[];
  entityPrimitives: string[];
  propPrimitives: string[];
  markerPrimitives: string[];
  effects: string[];
  gridEvents: string[];
  arrayEvents: string[];
};

export const VISUAL_CAPABILITIES = capabilities as VisualCapabilities;

export const SUPPORTED_SCENE_TYPES = new Set(VISUAL_CAPABILITIES.sceneTypes);
export const SUPPORTED_PRESETS = new Set(VISUAL_CAPABILITIES.presets);
export const SUPPORTED_ENTITY_PRIMITIVES = new Set(
  VISUAL_CAPABILITIES.entityPrimitives,
);
export const SUPPORTED_PROP_PRIMITIVES = new Set(
  VISUAL_CAPABILITIES.propPrimitives,
);
export const SUPPORTED_MARKER_PRIMITIVES = new Set(
  VISUAL_CAPABILITIES.markerPrimitives ?? [],
);
export const SUPPORTED_PRIMITIVES = new Set([
  ...VISUAL_CAPABILITIES.entityPrimitives,
  ...VISUAL_CAPABILITIES.propPrimitives,
  ...(VISUAL_CAPABILITIES.markerPrimitives ?? []),
]);
export const SUPPORTED_EFFECTS = new Set(VISUAL_CAPABILITIES.effects);
export const SUPPORTED_GRID_EVENTS = new Set(VISUAL_CAPABILITIES.gridEvents);
export const SUPPORTED_ARRAY_EVENTS = new Set(
  VISUAL_CAPABILITIES.arrayEvents ?? [],
);

export function isSupportedPreset(name: string): boolean {
  return SUPPORTED_PRESETS.has(name);
}

export function isSupportedPrimitive(name: string): boolean {
  return SUPPORTED_PRIMITIVES.has(name);
}

export function isSupportedEffect(name: string): boolean {
  return SUPPORTED_EFFECTS.has(name);
}

export function eventsForStructure(type: string): Set<string> {
  if (type === "array") return SUPPORTED_ARRAY_EVENTS;
  return SUPPORTED_GRID_EVENTS;
}
