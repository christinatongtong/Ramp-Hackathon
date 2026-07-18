"use client";

import { PROBLEM_EXAMPLES, PROBLEM_STATEMENT } from "@/lib/rotting-oranges/problemText";

type ProblemModalProps = {
  visible: boolean;
};

export function ProblemModal({ visible }: ProblemModalProps) {
  return (
    <div
      className={`problem-modal ${visible ? "problem-modal--visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="problem-modal__panel">
        <div className="problem-modal__header">
          <p className="problem-modal__tag">994 · Medium</p>
          <h2 className="problem-modal__title">Rotting Oranges</h2>
        </div>

        <div className="problem-modal__body">
          <p className="problem-modal__statement">{PROBLEM_STATEMENT}</p>

          <div className="problem-modal__examples">
            <p className="problem-modal__examples-label">Examples</p>
            {PROBLEM_EXAMPLES.map((example, index) => (
              <div key={example.label} className="problem-modal__example">
                <p className="problem-modal__example-title">
                  Example {index + 1} — {example.label}
                </p>
                <p>
                  <span className="problem-modal__muted">Input: </span>
                  <code>{example.input}</code>
                </p>
                <p>
                  <span className="problem-modal__muted">Output: </span>
                  <code className="problem-modal__output">{example.output}</code>
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
