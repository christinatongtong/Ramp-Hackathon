import type { AnimationStep, SceneScript } from "@/lib/animation-engine/types";
import type { ExecutionResult, Grid, VisualPlan } from "@/lib/api/types";

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function asGrid(value: unknown): Grid | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!Array.isArray(value[0])) return null;
  return value as Grid;
}

function eventMinute(event: Record<string, unknown>): number {
  const minute = event.minute;
  if (typeof minute === "number") return minute;
  return 0;
}

/**
 * Compile backend execution events into AnimationEngine steps.
 * Applies cell_update mutations onto the initial grid; effect metadata
 * comes from visualPlan.eventBindings.
 */
export function compileTimeline(
  problemId: string,
  execution: ExecutionResult,
  visualPlan: VisualPlan,
): SceneScript {
  const initialGrid =
    asGrid(execution.initialState.grid) ??
    asGrid(
      execution.events.find((event) => event.type === "init")?.grid,
    ) ??
    [];

  let grid = cloneGrid(initialGrid);
  const steps: AnimationStep[] = [];

  const pushStep = (
    day: number,
    label: string | undefined,
    event: Record<string, unknown>,
    extraState: Record<string, unknown> = {},
  ) => {
    const eventType = String(event.type ?? "unknown");
    const binding = visualPlan.eventBindings[eventType];

    steps.push({
      day,
      label,
      state: {
        grid: cloneGrid(grid),
        activeCell:
          typeof event.row === "number" && typeof event.col === "number"
            ? { row: event.row, col: event.col }
            : null,
        effect: binding?.effect ?? null,
        effectColor: binding?.color ?? null,
        targetReaction: binding?.targetReaction ?? null,
        cameraCue: binding?.camera ?? null,
        passed: execution.passed,
        ...extraState,
      },
      events: binding
        ? [
            {
              type: "custom",
              name: binding.effect,
              payload: {
                color: binding.color,
                explanation: binding.explanation,
              },
            },
          ]
        : undefined,
    });
  };

  // Initial frame
  pushStep(0, "Initial state", { type: "init" });

  for (const event of execution.events) {
    const type = String(event.type ?? "");
    if (type === "init") {
      const next = asGrid(event.grid);
      if (next) grid = cloneGrid(next);
      continue;
    }

    if (type === "cell_update") {
      const row = event.row;
      const col = event.col;
      const value = event.value;
      if (
        typeof row === "number" &&
        typeof col === "number" &&
        typeof value === "number" &&
        grid[row]?.[col] !== undefined
      ) {
        grid[row][col] = value;
      }
    }

    const day = eventMinute(event);
    const label =
      type === "done"
        ? `Result: ${String(execution.result)}`
        : type === "cell_update"
          ? `Minute ${day}`
          : type;

    pushStep(day, label, event);

    if (type === "done") {
      const choreography = execution.passed
        ? visualPlan.resultChoreography.success
        : visualPlan.resultChoreography.failure;
      steps.push({
        day,
        label: execution.passed ? "Success" : "Failure",
        state: {
          grid: cloneGrid(grid),
          effect: choreography.effect,
          effectColor: null,
          targetReaction: choreography.entityReaction,
          cameraCue: null,
          passed: execution.passed,
          resultOverlay: true,
        },
        events: [
          {
            type: "custom",
            name: choreography.effect,
            payload: { explanation: choreography.explanation },
          },
        ],
      });
    }
  }

  return {
    problemId,
    metadata: {
      title: visualPlan.world.theme,
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

export function readGridFromState(state: Record<string, unknown>): Grid | null {
  return asGrid(state.grid);
}
