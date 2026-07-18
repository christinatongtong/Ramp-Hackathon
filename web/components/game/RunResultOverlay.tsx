"use client";

import type { GameStatus, Verdict } from "@/lib/api/types";

type RunResultOverlayProps = {
  status: GameStatus;
  verdict?: Verdict | null;
  message?: string | null;
  testsPassed?: number;
  testsTotal?: number;
  onDismiss?: () => void;
};

function verdictLabel(verdict: Verdict | null | undefined): string {
  switch (verdict) {
    case "wrong_answer":
      return "Wrong Answer";
    case "syntax_error":
      return "Syntax Error";
    case "runtime_error":
      return "Runtime Error";
    case "time_limit_exceeded":
      return "Time Limit Exceeded";
    case "accepted":
      return "Accepted";
    default:
      return "Not quite";
  }
}

export function RunResultOverlay({
  status,
  verdict,
  message,
  testsPassed,
  testsTotal,
  onDismiss,
}: RunResultOverlayProps) {
  if (status === "checking") {
    return (
      <div className="run-result run-result--checking" role="status">
        <div className="run-result__spinner" />
        <h2>Checking your solution…</h2>
        <p>Running against the test suite</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="run-result run-result--failed" role="alert">
        <div className="run-result__x" aria-hidden>
          ✕
        </div>
        <h2>{verdictLabel(verdict)}</h2>
        <p>{message ?? "Your solution did not pass the tests."}</p>
        {typeof testsPassed === "number" && typeof testsTotal === "number" && (
          <p className="run-result__meta">
            {testsPassed} / {testsTotal} tests passed
          </p>
        )}
        {onDismiss && (
          <button type="button" className="run-result__dismiss" onClick={onDismiss}>
            Keep coding
          </button>
        )}
      </div>
    );
  }

  if (status === "passed") {
    return (
      <div className="run-result run-result--passed" role="status">
        <div className="run-result__check" aria-hidden>
          ✓
        </div>
        <h2>Accepted</h2>
        <p>{message ?? "All tests passed — unlocking the solution animation"}</p>
      </div>
    );
  }

  return null;
}
