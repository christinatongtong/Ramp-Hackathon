import { TEST_CASES } from "./simulation";

export const PROBLEM_STATEMENT = `You are given an m x n grid where each cell can have one of three values:

0 — empty cell
1 — fresh orange
2 — rotten orange

Every minute, any fresh orange 4-directionally adjacent to a rotten orange becomes rotten.

Return the minimum number of minutes until no cell has a fresh orange. If impossible, return -1.`;

export const PROBLEM_EXAMPLES = TEST_CASES.map((testCase) => ({
  label: testCase.label,
  input: JSON.stringify(testCase.grid),
  output: String(testCase.expected),
}));
