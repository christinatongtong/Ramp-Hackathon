"use client";

import type { ProblemFacts } from "@/lib/api/types";

type ProblemPanelProps = {
  problem: ProblemFacts;
  visible: boolean;
};

function formatValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function ProblemPanel({ problem, visible }: ProblemPanelProps) {
  const tag =
    problem.number != null
      ? `${problem.number} · ${problem.difficulty}`
      : problem.difficulty;

  return (
    <div
      className={`problem-modal ${visible ? "problem-modal--visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="problem-modal__panel">
        <div className="problem-modal__header">
          <p className="problem-modal__tag">{tag}</p>
          <h2 className="problem-modal__title">{problem.title}</h2>
        </div>

        <div className="problem-modal__body">
          <p className="problem-modal__statement">{problem.description}</p>

          <div className="problem-modal__examples">
            <p className="problem-modal__examples-label">Examples</p>
            {problem.examples.map((example, index) => (
              <div
                key={`${example.name ?? "ex"}-${index}`}
                className="problem-modal__example"
              >
                <p className="problem-modal__example-title">
                  Example {index + 1}
                  {example.name ? ` — ${example.name}` : ""}
                </p>
                <p>
                  <span className="problem-modal__muted">Input: </span>
                  <code>{formatValue(example.input)}</code>
                </p>
                <p>
                  <span className="problem-modal__muted">Output: </span>
                  <code className="problem-modal__output">
                    {formatValue(example.expected)}
                  </code>
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="problem-modal__hint">Press P to close</p>
      </div>
    </div>
  );
}
