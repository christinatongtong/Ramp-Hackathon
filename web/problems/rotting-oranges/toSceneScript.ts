import type { SceneScript } from "@/lib/animation-engine/types";
import { simulateRotting } from "@/lib/rotting-oranges/simulation";
import type { Grid } from "@/lib/rotting-oranges/types";
import { ROTTING_ORANGES_MANIFEST } from "./manifest";

type ToSceneScriptOptions = {
  grid: Grid;
  verdict?: SceneScript["metadata"]["verdict"];
  userAnswer?: number;
  note?: string;
  /** Override steps (e.g. from LLM or wrong-code tracer) */
  steps?: Grid[];
};

/**
 * Deterministic adapter: grid BFS snapshots → universal SceneScript.
 * Wrong solutions pass custom `steps` from backend/sandbox later.
 */
export function rottingOrangesToSceneScript(options: ToSceneScriptOptions): SceneScript {
  const { grid, verdict = "correct", userAnswer, note } = options;
  const simulation = options.steps
    ? { steps: options.steps, minutes: options.steps.length - 1 }
    : simulateRotting(grid);

  const expected = simulateRotting(grid).minutes;

  return {
    problemId: ROTTING_ORANGES_MANIFEST.id,
    metadata: {
      title: ROTTING_ORANGES_MANIFEST.title,
      verdict,
      expectedAnswer: expected,
      userAnswer,
      note,
    },
    initialInput: { grid },
    steps: simulation.steps.map((stepGrid, index) => ({
      day: index,
      label: index === 0 ? "Day 1 — dawn" : `Day ${index + 1}`,
      state: { grid: stepGrid },
      events:
        index > 0
          ? [{ type: "message" as const, text: `Night falls… Day ${index + 1} begins.`, tone: "info" as const }]
          : undefined,
    })),
  };
}
