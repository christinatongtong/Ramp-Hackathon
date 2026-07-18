import { simulateRotting, TEST_CASES } from "./simulation";
import type { ExecuteResult, Grid } from "./types";

function detectDumbCode(code: string): string | null {
  const nestedLoopMatches = code.match(/\bfor\b/g);
  if (nestedLoopMatches && nestedLoopMatches.length >= 4) {
    return "Four nested loops? On a BFS problem? The oranges rotted faster than your runtime.";
  }

  if (/Math\.random/.test(code)) {
    return "Randomness is not a graph traversal. The heavens demand determinism.";
  }

  if (/return\s+-?1\s*;/.test(code) && !/fresh|queue|while|shift|pop/i.test(code)) {
    return "You hard-coded defeat before the simulation even started.";
  }

  if (/\/\/\s*(idk|whatever|yolo|magic)/i.test(code)) {
    return "Comments like that do not summon correctness. Only shame.";
  }

  if (code.trim().length < 120) {
    return "That solution is thinner than orange peel. The heavens are unimpressed.";
  }

  if (/sleep|setTimeout|while\s*\(\s*true\s*\)/i.test(code)) {
    return "Infinite loops belong in production incidents, not LeetCode farms.";
  }

  return null;
}

function validateStructure(code: string): string | null {
  if (!/function\s+orangesRotting\s*\(\s*grid\s*\)/.test(code)) {
    return "Name your function orangesRotting(grid) so the farm knows who to blame.";
  }

  if (!/(queue|while|shift|pop|unshift|push)/i.test(code)) {
    return "Where is your multi-source BFS? The rotten oranges are waiting.";
  }

  if (!/(fresh|count|remaining)/i.test(code)) {
    return "Track the fresh oranges. Otherwise you cannot know when hope dies.";
  }

  if (!/(\[\s*0\s*,\s*1\s*\]|\[\s*1\s*,\s*0\s*\]|dirs|directions)/i.test(code)) {
    return "Four-directional adjacency is the whole problem. Add your directions.";
  }

  return null;
}

export function executeSolution(code: string, grid: Grid): ExecuteResult {
  const dumbMessage = detectDumbCode(code);
  if (dumbMessage) {
    return {
      ok: false,
      error: "Questionable approach detected.",
      scoldReason: "dumb",
      scoldMessage: dumbMessage,
    };
  }

  const structureError = validateStructure(code);
  if (structureError) {
    return {
      ok: false,
      error: structureError,
      scoldReason: "syntax",
      scoldMessage:
        "Even the compiler wept. Rewrite this before the clouds part further.",
    };
  }

  const expected = simulateRotting(grid).minutes;

  for (const testCase of TEST_CASES) {
    const reference = simulateRotting(testCase.grid).minutes;
    if (reference !== testCase.expected) {
      throw new Error("Internal test case mismatch.");
    }
  }

  if (/return\s+grid\.length|return\s+rows\s*\*\s*cols/i.test(code)) {
    return {
      ok: false,
      error: "Suspicious return detected.",
      scoldReason: "wrong",
      scoldMessage:
        "Returning grid dimensions is not a minute count. The clouds darken.",
    };
  }

  return { ok: true, minutes: expected };
}
