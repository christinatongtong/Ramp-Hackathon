import type { CodeRunResult } from "./types";

const INFINITE_LOOP_PATTERNS = [
  /while\s*\(\s*true\s*\)/i,
  /for\s*\(\s*;\s*;\s*\)/i,
];

/**
 * MVP guardrails before a real sandbox (QuickJS worker / isolated-vm).
 * Returns heuristic failures; a backend LLM + tracer replaces this for
 * wrong-but-runnable solutions.
 */
export function analyzeCodeSafety(code: string): CodeRunResult | null {
  if (INFINITE_LOOP_PATTERNS.some((re) => re.test(code))) {
    return {
      ok: false,
      reason: "infinite_loop",
      message: "Static analysis detected a likely infinite loop.",
    };
  }
  return null;
}

/** Placeholder for sandbox execution with instruction budget + step trace capture */
export async function runUserCodeInSandbox(
  _code: string,
  _input: Record<string, unknown>,
  _options?: { maxSteps?: number; timeoutMs?: number },
): Promise<CodeRunResult> {
  return {
    ok: false,
    reason: "runtime_error",
    message: "Sandbox execution not wired yet — use reference adapter or /api/animate.",
  };
}
