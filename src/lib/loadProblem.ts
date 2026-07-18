/**
 * Dynamic problem loader.
 *
 * Add a new LeetCode problem by:
 * 1. Creating src/problems/<id>/ with problem.md, config.json, solution.py, assets/
 * 2. Appending "<id>" to registry.json
 *
 * The UI only knows about scene.type + events — never hardcode per-problem logic.
 */

import type { LoadedProblem, ProblemConfig } from "./problemTypes";
import registry from "../problems/registry.json";

const problemModules = import.meta.glob("../problems/*/config.json", {
  eager: true,
  import: "default",
}) as Record<string, ProblemConfig>;

const markdownModules = import.meta.glob("../problems/*/problem.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function packagePath(id: string, file: string): string {
  return `../problems/${id}/${file}`;
}

export function listProblemIds(): string[] {
  return registry.problems;
}

export function loadProblem(id: string): LoadedProblem {
  const configKey = packagePath(id, "config.json");
  const mdKey = packagePath(id, "problem.md");
  const config = problemModules[configKey];
  const markdown = markdownModules[mdKey];

  if (!config || !markdown) {
    throw new Error(`Problem package not found: ${id}`);
  }

  return {
    config,
    markdown,
    assetsBase: `/src/problems/${id}/assets`,
  };
}

export function loadAllProblems(): LoadedProblem[] {
  return listProblemIds().map(loadProblem);
}

/** Input used when the user presses Start (canonical demo). */
export function getStartExample(config: ProblemConfig) {
  const example = config.examples[config.defaultExample];
  if (!example) {
    throw new Error(`No default example for ${config.id}`);
  }
  return example;
}
