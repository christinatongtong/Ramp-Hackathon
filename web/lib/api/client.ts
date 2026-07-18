import type {
  ClientAnimationPackage,
  ProblemSummary,
  RunResponse,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function listProblems(): Promise<ProblemSummary[]> {
  return apiFetch<ProblemSummary[]>("/api/problems");
}

export function getPackage(
  problemId: string,
  options?: { exampleIndex?: number },
): Promise<ClientAnimationPackage> {
  const params = new URLSearchParams();
  if (options?.exampleIndex != null) {
    params.set("exampleIndex", String(options.exampleIndex));
  }
  const query = params.toString();
  return apiFetch<ClientAnimationPackage>(
    `/api/problems/${encodeURIComponent(problemId)}/package${query ? `?${query}` : ""}`,
  );
}

export function runProblem(
  problemId: string,
  body: { code: string; exampleIndex?: number },
): Promise<RunResponse> {
  return apiFetch<RunResponse>(
    `/api/problems/${encodeURIComponent(problemId)}/run`,
    {
      method: "POST",
      body: JSON.stringify({
        code: body.code,
        exampleIndex: body.exampleIndex ?? 0,
      }),
    },
  );
}

export { API_BASE };
