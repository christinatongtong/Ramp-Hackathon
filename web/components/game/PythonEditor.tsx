"use client";

import { useMemo, useRef } from "react";
import type { GameStatus, ProblemFacts } from "@/lib/api/types";

type PythonEditorProps = {
  problem: ProblemFacts;
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  onReset: () => void;
  statusMessage: string | null;
  gameStatus: GameStatus;
  minute: number | null;
};

export function PythonEditor({
  problem,
  code,
  onChange,
  onRun,
  onReset,
  statusMessage,
  gameStatus,
  minute,
}: PythonEditorProps) {
  const lines = useMemo(() => code.split("\n"), [code]);
  const lineCount = lines.length;
  const gutterRef = useRef<HTMLDivElement>(null);
  const isBusy = gameStatus === "checking" || gameStatus === "animating";
  const badge = problem.algorithm[0] ?? problem.category;

  const syncGutterScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  };

  return (
    <aside className="code-dock">
      <div className="code-dock__header">
        <div>
          <p className="code-dock__eyebrow">Your solution</p>
          <h2 className="code-dock__title">solution.py</h2>
        </div>
        <span className="code-dock__badge">{badge}</span>
      </div>

      <div className="code-dock__toolbar">
        <button
          type="button"
          onClick={onRun}
          disabled={isBusy}
          className="code-dock__run"
        >
          {gameStatus === "checking"
            ? "Checking…"
            : gameStatus === "animating"
              ? "Playing…"
              : "▶ Run Code"}
        </button>
        <button type="button" onClick={onReset} className="code-dock__reset">
          Reset
        </button>
      </div>

      <div className="code-dock__editor-wrap">
        <div ref={gutterRef} className="code-dock__gutter" aria-hidden>
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(event) => onChange(event.target.value)}
          onScroll={syncGutterScroll}
          spellCheck={false}
          className="code-dock__editor"
          aria-label="Solution code editor"
        />
      </div>

      <div className="code-dock__footer">
        {minute !== null && (
          <p className="code-dock__minute">
            Day {minute + 1}
            {minute === 0 ? " — dawn" : ""}
          </p>
        )}
        <p
          className={`code-dock__status ${
            statusMessage?.startsWith("✓")
              ? "code-dock__status--ok"
              : statusMessage?.startsWith("✗")
                ? "code-dock__status--err"
                : ""
          }`}
        >
          {statusMessage ??
            "Write your Python solution, then Run to unlock the animation."}
        </p>
      </div>
    </aside>
  );
}
