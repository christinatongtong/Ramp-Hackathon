/**
 * Closed set of effect names the frontend knows how to render.
 * Unknown effects no-op safely so GPT cannot crash the renderer.
 */

export type EffectHandler = {
  /** Whether this effect should pulse active cells */
  pulse: boolean;
  /** Optional status label override */
  label?: string;
};

const REGISTRY: Record<string, EffectHandler> = {
  none: { pulse: false },
  pulse: { pulse: true },
  bounce: { pulse: true },
  wobble: { pulse: true },
  squish: { pulse: true },
  cell_pulse: { pulse: true },
  queue_glow: { pulse: true, label: "Queue" },
  infection_poof: { pulse: true, label: "Infect" },
  infection_wave: { pulse: true, label: "Infect" },
  transform_entity: { pulse: true },
  island_discovery: { pulse: true },
  frontier_wave: { pulse: true },
  frontier_expand: { pulse: true },
  path_reveal: { pulse: true },
  water_flow: { pulse: false },
  dual_ocean_glow: { pulse: true },
  result_reveal: { pulse: false },
  confetti: { pulse: false, label: "Success!" },
  failure_deflate: { pulse: false, label: "Not quite…" },
  camera_shake: { pulse: false },
};

export function resolveEffect(name: string | null | undefined): EffectHandler {
  if (!name) return REGISTRY.none;
  return REGISTRY[name] ?? REGISTRY.none;
}

export function isKnownEffect(name: string): boolean {
  return name in REGISTRY;
}
