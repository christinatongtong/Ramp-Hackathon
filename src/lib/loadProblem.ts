import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import type {
  LoadedProblem,
  ProblemConfig,
  ProblemSummary,
} from "./problemTypes";

function problemsRoot(): string {
  return path.join(process.cwd(), "src", "problems");
}

function problemDirectory(problemId: string): string {
  return path.join(problemsRoot(), problemId);
}

export async function listProblemIds(): Promise<string[]> {
  const raw = await fs.readFile(
    path.join(problemsRoot(), "registry.json"),
    "utf8"
  );
  const registry = JSON.parse(raw) as { problems: string[] };
  return registry.problems;
}

export async function loadProblem(problemId: string): Promise<LoadedProblem> {
  const dir = problemDirectory(problemId);

  const [markdown, configRaw, animationRaw] = await Promise.all([
    fs.readFile(path.join(dir, "problem.md"), "utf8"),
    fs.readFile(path.join(dir, "config.json"), "utf8"),
    fs.readFile(path.join(dir, "animation.json"), "utf8"),
  ]);

  const config = JSON.parse(configRaw) as ProblemConfig;

  return {
    markdown,
    config,
    animation: JSON.parse(animationRaw),
    assetsBase: `/problems/${problemId}`,
  };
}

export async function loadProblemSummary(
  problemId: string
): Promise<ProblemSummary> {
  const raw = await fs.readFile(
    path.join(problemDirectory(problemId), "config.json"),
    "utf8"
  );
  const config = JSON.parse(raw) as ProblemConfig;
  return {
    id: config.id,
    number: config.number,
    title: config.title,
    difficulty: config.difficulty,
  };
}

/** Input used when the user presses Start (canonical demo). */
export function getStartExample(config: ProblemConfig) {
  const example = config.examples[config.defaultExample];
  if (!example) {
    throw new Error(`No default example for ${config.id}`);
  }
  return example;
}
