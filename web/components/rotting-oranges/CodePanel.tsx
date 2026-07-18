"use client";

import { useMemo, useRef } from "react";

type CodePanelProps = {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  onReset: () => void;
  status: string | null;
  isRunning: boolean;
  minute: number | null;
};

export function CodePanel({
  code,
  onChange,
  onRun,
  onReset,
  status,
  isRunning,
  minute,
}: CodePanelProps) {
  const lines = useMemo(() => code.split("\n"), [code]);
  const lineCount = lines.length;
  const gutterRef = useRef<HTMLDivElement>(null);

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
          <h2 className="code-dock__title">orangesRotting.js</h2>
        </div>
        <span className="code-dock__badge">BFS</span>
      </div>

      <div className="code-dock__toolbar">
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="code-dock__run"
        >
          {isRunning ? "Running…" : "▶ Run Code"}
        </button>
        <button type="button" onClick={onReset} className="code-dock__reset">
          Reset Grove
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
            status?.startsWith("✓")
              ? "code-dock__status--ok"
              : status?.startsWith("✗")
                ? "code-dock__status--err"
                : ""
          }`}
        >
          {status ?? "Write your BFS, then run it to animate the grove."}
        </p>
      </div>
    </aside>
  );
}
