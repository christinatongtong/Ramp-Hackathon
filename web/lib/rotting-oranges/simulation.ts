import type { Grid, SimulationResult } from "./types";

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
] as const;

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function simulateRotting(grid: Grid): SimulationResult {
  const steps: Grid[] = [cloneGrid(grid)];
  const working = cloneGrid(grid);
  const rows = working.length;
  const cols = working[0]?.length ?? 0;

  let minutes = 0;
  let changed = true;

  while (changed) {
    changed = false;
    const next = cloneGrid(working);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (working[row][col] !== 2) continue;

        for (const [dr, dc] of DIRECTIONS) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
          if (working[nr][nc] === 1) {
            next[nr][nc] = 2;
            changed = true;
          }
        }
      }
    }

    if (!changed) break;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        working[row][col] = next[row][col];
      }
    }

    minutes += 1;
    steps.push(cloneGrid(working));
  }

  const freshRemaining = working.some((row) => row.some((cell) => cell === 1));

  return {
    steps,
    minutes: freshRemaining ? -1 : minutes,
  };
}

export const DEFAULT_GRID: Grid = [
  [2, 1, 1],
  [1, 1, 0],
  [0, 1, 1],
];

export const TEST_CASES: { grid: Grid; expected: number; label: string }[] = [
  {
    grid: DEFAULT_GRID,
    expected: 4,
    label: "Example 1 — Sunny Grove",
  },
  {
    grid: [
      [2, 1, 1],
      [0, 1, 1],
      [1, 0, 1],
    ],
    expected: -1,
    label: "Example 2 — Trapped Orange",
  },
  {
    grid: [[0, 2]],
    expected: 0,
    label: "Example 3 — Already Done",
  },
];
