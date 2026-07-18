import type { AnimationStep, SceneScript } from "@/lib/animation-engine/types";
import type { ExecutionResult, VisualPlan } from "@/lib/api/types";
import { getTheme } from "@/lib/api/types";

function asNumberArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length === 0) return [];
  if (typeof value[0] === "number") return value as number[];
  if (Array.isArray(value[0])) return null;
  return value.map((item) => Number(item));
}

function cloneValues(values: number[]): number[] {
  return [...values];
}

/**
 * Compile array-structure execution events into AnimationEngine steps.
 */
export function compileArrayTimeline(
  problemId: string,
  execution: ExecutionResult,
  visualPlan: VisualPlan,
): SceneScript {
  const initial =
    asNumberArray(execution.initialState.values) ??
    asNumberArray(execution.initialState.nums) ??
    asNumberArray(execution.initialState.arr) ??
    asNumberArray(
      execution.events.find((event) => event.type === "init")?.values,
    ) ??
    [];

  let values = cloneValues(initial);
  const pointers: Record<string, number> = {};
  let windowRange: { left: number; right: number } | null = null;
  let finalized: number[] = [];
  const steps: AnimationStep[] = [];
  const theme = getTheme(visualPlan);

  const pushStep = (
    label: string | undefined,
    event: Record<string, unknown>,
    extra: Record<string, unknown> = {},
  ) => {
    const eventType = String(event.type ?? "unknown");
    const binding = visualPlan.eventBindings[eventType];
    steps.push({
      day: 0,
      label,
      durationMs: binding?.durationMs ?? 700,
      state: {
        structureType: "array",
        values: cloneValues(values),
        pointers: { ...pointers },
        window: windowRange ? { ...windowRange } : null,
        activeIndices: extra.activeIndices ?? null,
        finalized: [...finalized],
        effect: binding?.effect ?? null,
        effectColor: binding?.color ?? null,
        targetReaction: binding?.targetReaction ?? null,
        cameraCue: binding?.camera ?? null,
        passed: execution.passed,
        ...extra,
      },
    });
  };

  pushStep("Initial state", { type: "init" });

  for (const event of execution.events) {
    const type = String(event.type ?? "");
    if (type === "init") {
      const next =
        asNumberArray(event.values) ??
        asNumberArray(event.nums) ??
        asNumberArray(event.arr);
      if (next) values = cloneValues(next);
      continue;
    }

    let activeIndices: number[] | null = null;

    if (type === "compare") {
      const indices = event.indices;
      if (Array.isArray(indices)) {
        activeIndices = indices.filter((i): i is number => typeof i === "number");
      } else if (typeof event.i === "number" && typeof event.j === "number") {
        activeIndices = [event.i, event.j];
      } else if (typeof event.mid === "number") {
        activeIndices = [event.mid];
      }
    }

    if (type === "swap") {
      const i = event.i ?? (Array.isArray(event.indices) ? event.indices[0] : null);
      const j = event.j ?? (Array.isArray(event.indices) ? event.indices[1] : null);
      if (typeof i === "number" && typeof j === "number") {
        const tmp = values[i];
        values[i] = values[j];
        values[j] = tmp;
        activeIndices = [i, j];
      }
    }

    if (type === "write") {
      const index = event.index ?? event.i;
      const value = event.value;
      if (typeof index === "number" && typeof value === "number") {
        values[index] = value;
        activeIndices = [index];
      }
    }

    if (type === "pointer_move") {
      const name = String(event.pointer ?? event.name ?? "ptr");
      const to = event.to ?? event.index;
      if (typeof to === "number") {
        pointers[name] = to;
        activeIndices = [to];
      }
    }

    if (type === "window_expand" || type === "window_shrink" || type === "range_highlight") {
      const left = event.left;
      const right = event.right;
      if (typeof left === "number" && typeof right === "number") {
        windowRange = { left, right };
      }
    }

    if (type === "element_finalize") {
      const index = event.index;
      if (typeof index === "number" && !finalized.includes(index)) {
        finalized.push(index);
        activeIndices = [index];
      }
    }

    pushStep(type === "done" ? `Result: ${String(execution.result)}` : type, event, {
      activeIndices,
    });

    if (type === "done") {
      const choreography = execution.passed
        ? visualPlan.resultChoreography.success
        : visualPlan.resultChoreography.failure;
      steps.push({
        day: 0,
        label: execution.passed ? "Success" : "Failure",
        durationMs: 1200,
        state: {
          structureType: "array",
          values: cloneValues(values),
          pointers: { ...pointers },
          window: windowRange,
          finalized: [...finalized],
          effect: choreography.effect,
          effectColor: null,
          targetReaction: choreography.entityReaction,
          cameraCue: "wide",
          passed: execution.passed,
          resultOverlay: true,
          resultExplanation: choreography.explanation,
        },
      });
    }
  }

  return {
    problemId,
    metadata: {
      title: theme.name,
      verdict: execution.passed ? "correct" : "wrong",
      expectedAnswer:
        typeof execution.expected === "number" ||
        typeof execution.expected === "string"
          ? execution.expected
          : String(execution.expected),
      userAnswer:
        typeof execution.result === "number" ||
        typeof execution.result === "string"
          ? execution.result
          : String(execution.result),
      note: execution.passed ? "Passed" : "Failed",
    },
    initialInput: execution.initialState,
    steps,
  };
}

export function readArrayFromState(
  state: Record<string, unknown>,
): number[] | null {
  return asNumberArray(state.values);
}
