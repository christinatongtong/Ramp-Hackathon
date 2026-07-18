import type { AnimationStep, SceneScript } from "@/lib/animation-engine/types";
import type { CellValue, ExecutionResult, Grid, VisualPlan } from "@/lib/api/types";

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function asGrid(value: unknown): Grid | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!Array.isArray(value[0])) return null;
  return value as Grid;
}

function isCellValue(value: unknown): value is CellValue {
  return typeof value === "number" || typeof value === "string";
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function parseCells(value: unknown): Array<[number, number]> {
  if (!Array.isArray(value)) return [];
  const cells: Array<[number, number]> = [];
  for (const item of value) {
    if (
      Array.isArray(item) &&
      typeof item[0] === "number" &&
      typeof item[1] === "number"
    ) {
      cells.push([item[0], item[1]]);
    }
  }
  return cells;
}

function timelineClock(
  event: Record<string, unknown>,
  advanceOn: string,
  previous: number,
  eventIndex: number,
): number {
  if (advanceOn === "none") return previous;
  if (advanceOn === "minute") {
    const minute = event.minute;
    return typeof minute === "number" ? minute : previous;
  }
  if (advanceOn === "level") {
    if (String(event.type) === "level_start") {
      const level = event.level;
      return typeof level === "number" ? level : previous + 1;
    }
    return previous;
  }
  if (advanceOn === "event") {
    return eventIndex;
  }
  return previous;
}

/**
 * Compile backend execution events into AnimationEngine steps.
 * Applies shared grid-event mutations; effect metadata comes from visualPlan.eventBindings.
 */
export function compileTimeline(
  problemId: string,
  execution: ExecutionResult,
  visualPlan: VisualPlan,
): SceneScript {
  const initialGrid =
    asGrid(execution.initialState.grid) ??
    asGrid(execution.events.find((event) => event.type === "init")?.grid) ??
    [];

  let grid = cloneGrid(initialGrid);
  const steps: AnimationStep[] = [];
  const frontier = new Set<string>();
  const reachability = new Map<string, Set<string>>();
  let clock = 0;
  const advanceOn = visualPlan.world.timeSystem?.advanceOn ?? "none";

  const frontierList = () =>
    [...frontier].map((key) => {
      const [r, c] = key.split(",").map(Number);
      return [r, c] as [number, number];
    });

  const pushStep = (
    day: number,
    label: string | undefined,
    event: Record<string, unknown>,
    extraState: Record<string, unknown> = {},
  ) => {
    const eventType = String(event.type ?? "unknown");
    const binding = visualPlan.eventBindings[eventType];
    const durationMs = binding?.durationMs ?? 700;

    steps.push({
      day,
      label,
      durationMs,
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
        frontier: frontierList(),
        regionCells: extraState.regionCells ?? null,
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

  pushStep(0, "Initial state", { type: "init" });

  execution.events.forEach((event, eventIndex) => {
    const type = String(event.type ?? "");
    if (type === "init") {
      const next = asGrid(event.grid);
      if (next) grid = cloneGrid(next);
      return;
    }

    let regionCells: Array<[number, number]> | null = null;

    if (type === "cell_update" || type === "visit" || type === "path_mark") {
      const row = event.row;
      const col = event.col;
      const value = event.value;
      if (
        typeof row === "number" &&
        typeof col === "number" &&
        isCellValue(value) &&
        grid[row]?.[col] !== undefined
      ) {
        grid[row][col] = value;
      }
    }

    if (type === "frontier_add") {
      const cells = parseCells(event.cells);
      if (cells.length) {
        for (const [r, c] of cells) frontier.add(cellKey(r, c));
      } else if (typeof event.row === "number" && typeof event.col === "number") {
        frontier.add(cellKey(event.row, event.col));
      }
    }

    if (type === "frontier_remove") {
      const cells = parseCells(event.cells);
      if (cells.length) {
        for (const [r, c] of cells) frontier.delete(cellKey(r, c));
      } else if (typeof event.row === "number" && typeof event.col === "number") {
        frontier.delete(cellKey(event.row, event.col));
      }
    }

    if (type === "region_discovered") {
      regionCells = parseCells(event.cells);
      const value = event.value;
      if (isCellValue(value)) {
        for (const [r, c] of regionCells) {
          if (grid[r]?.[c] !== undefined) grid[r][c] = value;
        }
      }
    }

    if (type === "reachability_update") {
      const row = event.row;
      const col = event.col;
      const ocean = event.ocean;
      if (
        typeof row === "number" &&
        typeof col === "number" &&
        typeof ocean === "string"
      ) {
        const key = cellKey(row, col);
        const set = reachability.get(key) ?? new Set<string>();
        set.add(ocean);
        reachability.set(key, set);
      }
    }

    clock = timelineClock(event, advanceOn, clock, eventIndex);

    const label =
      type === "done"
        ? `Result: ${String(execution.result)}`
        : type === "cell_update" && advanceOn === "minute"
          ? `Minute ${clock}`
          : type === "region_discovered"
            ? `Island ${String(event.islandId ?? "")}`.trim()
            : type;

    pushStep(clock, label, event, {
      regionCells,
      reachability: Object.fromEntries(
        [...reachability.entries()].map(([k, v]) => [k, [...v]]),
      ),
    });

    if (type === "done") {
      const choreography = execution.passed
        ? visualPlan.resultChoreography.success
        : visualPlan.resultChoreography.failure;
      steps.push({
        day: clock,
        label: execution.passed ? "Success" : "Failure",
        durationMs: 1200,
        state: {
          grid: cloneGrid(grid),
          effect: choreography.effect,
          effectColor: null,
          targetReaction: choreography.entityReaction,
          cameraCue: "wide",
          passed: execution.passed,
          resultOverlay: true,
          resultExplanation: choreography.explanation,
          frontier: frontierList(),
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
  });

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

export function compileIntroTimeline(
  visualPlan: VisualPlan,
): Array<{ action: string; durationMs: number; text: string | null }> {
  return (visualPlan.intro ?? []).map((step) => ({
    action: step.action,
    durationMs: step.durationMs ?? 600,
    text: step.text ?? null,
  }));
}
