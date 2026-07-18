"use client";

import type { LoadedProblem } from "@/lib/problemTypes";

/** Client shell for description + interactive animation playback. */
export function ProblemExperience({ problem }: { problem: LoadedProblem }) {
  return (
    <main>
      <h1>{problem.config.title}</h1>
      {/* ProblemDescription, SolutionViewer, EventPlayer go here */}
    </main>
  );
}
