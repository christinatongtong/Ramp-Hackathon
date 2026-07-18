import type { SceneScript } from "@/lib/animation-engine/types";

/** Everything rotting-oranges–specific lives under problems/ + components/rotting-oranges */
export const ROTTING_ORANGES_MANIFEST = {
  id: "rotting-oranges",
  slug: "/world/rotting-oranges",
  number: 994,
  title: "Rotting Oranges",
  theme: "Orange grove farm",
  functionName: "orangesRotting",
  inputKey: "grid",
} as const;

export type RottingOrangesState = {
  grid: number[][];
};

export function isRottingOrangesState(state: Record<string, unknown>): state is RottingOrangesState {
  return Array.isArray(state.grid);
}

export function readGridFromStep(step: { state: Record<string, unknown> }): number[][] | null {
  if (!isRottingOrangesState(step.state)) return null;
  return step.state.grid;
}

export function scriptSummary(script: SceneScript): string {
  const { verdict, expectedAnswer, userAnswer } = script.metadata;
  if (verdict === "correct") {
    return `Correct — ${script.steps.length - 1} day(s) elapsed.`;
  }
  if (verdict === "timeout" || verdict === "runtime_error") {
    return script.metadata.note ?? "Execution failed.";
  }
  return `Wrong — expected ${expectedAnswer}, got ${userAnswer ?? "?"}.`;
}
