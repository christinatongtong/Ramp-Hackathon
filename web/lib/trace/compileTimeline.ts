import type { SceneScript } from "@/lib/animation-engine/types";
import type { ExecutionResult, VisualPlan } from "@/lib/api/types";
import { getStructure } from "@/lib/api/types";
import {
  TIMELINE_COMPILERS,
  type TimelineCompiler,
} from "./compilerRegistry";
import {
  compileIntroTimeline,
  readGridFromState,
} from "./compilers/compileGridTimeline";

export type { TimelineCompiler };

export function compileTimeline(
  problemId: string,
  execution: ExecutionResult,
  visualPlan: VisualPlan,
): SceneScript {
  const structure = getStructure(visualPlan);
  const compiler =
    TIMELINE_COMPILERS[structure.type] ?? TIMELINE_COMPILERS.grid;
  return compiler(problemId, execution, visualPlan);
}

export { compileIntroTimeline, readGridFromState, TIMELINE_COMPILERS };
