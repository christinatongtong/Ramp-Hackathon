"use client";

import { useCallback, useEffect, useState } from "react";
import { getPackage, runProblem } from "./client";
import type {
  ClientAnimationPackage,
  ProblemFacts,
  RunResponse,
  VisualPlan,
} from "./types";

type UseAnimationPackageResult = {
  loading: boolean;
  error: string | null;
  problem: ProblemFacts | null;
  visualPlan: VisualPlan | null;
  initialState: Record<string, unknown> | null;
  reload: () => Promise<void>;
  submit: (options: {
    code: string;
    exampleIndex?: number;
  }) => Promise<RunResponse>;
};

export function useAnimationPackage(
  problemId: string,
): UseAnimationPackageResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pkg, setPkg] = useState<ClientAnimationPackage | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getPackage(problemId);
      setPkg(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load package");
      setPkg(null);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submit = useCallback(
    async (options: { code: string; exampleIndex?: number }) => {
      return runProblem(problemId, {
        code: options.code,
        exampleIndex:
          options.exampleIndex ?? pkg?.problem.defaultExample ?? 0,
      });
    },
    [problemId, pkg?.problem.defaultExample],
  );

  return {
    loading,
    error,
    problem: pkg?.problem ?? null,
    visualPlan: pkg?.visualPlan ?? null,
    initialState: pkg?.initialState ?? null,
    reload,
    submit,
  };
}
