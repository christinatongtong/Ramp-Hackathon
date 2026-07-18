/**
 * Shared types for problem packages under src/problems/<id>/.
 *
 * Next.js server pages load packages via fs (see loadProblem.ts).
 * Client components receive the loaded data as props and handle playback.
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

export interface ProblemSummary {
  id: string;
  number: number;
  title: string;
  difficulty: ProblemConfig["difficulty"];
}

export interface LoadedProblem {
  config: ProblemConfig;
  markdown: string;
  /** Hand-written or generated AnimationPlan (see animation.json) */
  animation: unknown;
  /** Public URL base — serve assets from public/problems/<id>/ */
  assetsBase: string;
}
