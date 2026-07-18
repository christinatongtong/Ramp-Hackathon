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
    | "failure_deflate"
    | "compare_flash"
    | "swap_arc"
    | "pointer_hop"
    | "window_slide"
    | "value_flip"
    | "edge_break"
    | "edge_connect"
    | "list_complete"
    | "child_swap_flash"
    | "subtree_glow"
    | "cycle_pulse";
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
  compare_flash: { pulse: true, label: "Compare", overlay: "cell_pulse" },
  swap_arc: { pulse: true, label: "Swap", overlay: "bounce" },
  pointer_hop: { pulse: true, label: "Pointer", overlay: "cell_pulse" },
  window_slide: { pulse: false, label: "Window", overlay: "frontier_wave" },
  value_flip: { pulse: true, label: "Write", overlay: "bounce" },
  edge_break: { pulse: true, label: "Break link", overlay: "bounce" },
  edge_connect: { pulse: true, label: "Reconnect", overlay: "path_reveal" },
  list_complete: { pulse: false, label: "Reversed!", overlay: "confetti" },
  child_swap_flash: { pulse: true, label: "Swap children", overlay: "bounce" },
  subtree_glow: { pulse: true, label: "Subtree done", overlay: "result_reveal" },
  cycle_pulse: { pulse: true, label: "Cycle!", overlay: "failure_deflate" },
};

export function resolveEffect(name: string | null | undefined): EffectHandler {
  if (!name) return REGISTRY.none;
  return REGISTRY[name] ?? REGISTRY.none;
}

export function isKnownEffect(name: string): boolean {
  return SUPPORTED_EFFECTS.has(name) || name in REGISTRY;
}
