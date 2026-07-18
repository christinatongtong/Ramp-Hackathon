/**
 * Closed set of effect names the frontend knows how to render.
 * Unknown effects no-op safely so GPT cannot crash the renderer.
 */

import { SUPPORTED_EFFECTS } from "@/lib/capabilities";

export type EffectHandler = {
  /** Whether this effect should pulse active cells via entity scale */
  pulse: boolean;
  /** Optional status label override */
  label?: string;
  /** Which overlay component to mount */
  overlay:
    | "none"
    | "cell_pulse"
    | "bounce"
    | "queue_glow"
    | "infection_poof"
    | "island_discovery"
    | "frontier_wave"
    | "path_reveal"
    | "result_reveal"
    | "confetti"
    | "failure_deflate";
};

const REGISTRY: Record<string, EffectHandler> = {
  none: { pulse: false, overlay: "none" },
  cell_pulse: { pulse: true, overlay: "cell_pulse" },
  bounce: { pulse: true, overlay: "bounce" },
  queue_glow: { pulse: true, label: "Queue", overlay: "queue_glow" },
  infection_poof: { pulse: true, label: "Infect", overlay: "infection_poof" },
  island_discovery: { pulse: false, overlay: "island_discovery" },
  frontier_wave: { pulse: true, overlay: "frontier_wave" },
  path_reveal: { pulse: true, overlay: "path_reveal" },
  result_reveal: { pulse: false, label: "Result", overlay: "result_reveal" },
  confetti: { pulse: false, label: "Success!", overlay: "confetti" },
  failure_deflate: {
    pulse: false,
    label: "Not quite…",
    overlay: "failure_deflate",
  },
};

export function resolveEffect(name: string | null | undefined): EffectHandler {
  if (!name) return REGISTRY.none;
  return REGISTRY[name] ?? REGISTRY.none;
}

export function isKnownEffect(name: string): boolean {
  return SUPPORTED_EFFECTS.has(name) || name in REGISTRY;
}
