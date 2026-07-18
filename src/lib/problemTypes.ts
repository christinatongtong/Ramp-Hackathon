/**
 * Shared types for problem packages under src/problems/<id>/.
 *
 * Dynamic loading flow (Start button v1):
 * 1. Read registry.json → list of problem ids
 * 2. Load config.json + problem.md for the selected id
 * 3. POST example input to a runner that executes solution.py
 * 4. Replay returned events with the scene renderer for config.scene.type
 */

export type SceneType = "grid";

export interface SceneConfig {
  type: SceneType;
  theme: string;
  dimensions: 2;
  cellMapping?: Record<string, string>;
  overlays?: string[];
  pathOverlay?: boolean;
}

export interface ProblemExample {
  name: string;
  input: unknown;
  expected: unknown;
}

export interface ProblemConfig {
  id: string;
  number: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  algorithm: string[];
  scene: SceneConfig;
  examples: ProblemExample[];
  solutionFile: string;
  /** Index into examples used when the user presses Start */
  defaultExample: number;
}

export interface AnimationEvent {
  type: string;
  row?: number;
  col?: number;
  [key: string]: unknown;
}

export interface SolutionResult {
  result: unknown;
  events: AnimationEvent[];
  finalGrid?: unknown;
  path?: number[][];
}

export interface LoadedProblem {
  config: ProblemConfig;
  markdown: string;
  /** Vite/public URL base for assets inside the package */
  assetsBase: string;
}
