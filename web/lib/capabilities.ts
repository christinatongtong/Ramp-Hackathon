import capabilities from "./visual-capabilities.json";

export type VisualCapabilities = {
  presets: string[];
  entityPrimitives: string[];
  propPrimitives: string[];
  effects: string[];
  gridEvents: string[];
};

export const VISUAL_CAPABILITIES = capabilities as VisualCapabilities;

export const SUPPORTED_PRESETS = new Set(VISUAL_CAPABILITIES.presets);
export const SUPPORTED_ENTITY_PRIMITIVES = new Set(
  VISUAL_CAPABILITIES.entityPrimitives,
);
export const SUPPORTED_PROP_PRIMITIVES = new Set(
  VISUAL_CAPABILITIES.propPrimitives,
);
export const SUPPORTED_PRIMITIVES = new Set([
  ...VISUAL_CAPABILITIES.entityPrimitives,
  ...VISUAL_CAPABILITIES.propPrimitives,
]);
export const SUPPORTED_EFFECTS = new Set(VISUAL_CAPABILITIES.effects);
export const SUPPORTED_GRID_EVENTS = new Set(VISUAL_CAPABILITIES.gridEvents);

export function isSupportedPreset(name: string): boolean {
  return SUPPORTED_PRESETS.has(name);
}

export function isSupportedPrimitive(name: string): boolean {
  return SUPPORTED_PRIMITIVES.has(name);
}

export function isSupportedEffect(name: string): boolean {
  return SUPPORTED_EFFECTS.has(name);
}
