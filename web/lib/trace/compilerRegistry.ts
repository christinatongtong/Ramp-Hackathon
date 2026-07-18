import type { SceneScript } from "@/lib/animation-engine/types";
import type { ExecutionResult, VisualPlan } from "@/lib/api/types";
import { compileArrayTimeline } from "./compilers/compileArrayTimeline";
import { compileGraphTimeline } from "./compilers/compileGraphTimeline";
import { compileGridTimeline } from "./compilers/compileGridTimeline";
import { compileLinkedListTimeline } from "./compilers/compileLinkedListTimeline";
import { compileTreeTimeline } from "./compilers/compileTreeTimeline";

export type TimelineCompiler = (
  problemId: string,
  execution: ExecutionResult,
  visualPlan: VisualPlan,
) => SceneScript;

/** Maps structure.type → timeline compiler. */
export const TIMELINE_COMPILERS: Record<string, TimelineCompiler> = {
  grid: compileGridTimeline,
  array: compileArrayTimeline,
  linked_list: compileLinkedListTimeline,
  binary_tree: compileTreeTimeline,
  graph: compileGraphTimeline,
};
