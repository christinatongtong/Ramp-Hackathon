/**
 * Universal animation format — produced by a problem adapter (deterministic)
 * or by the backend LLM compiler (dynamic / wrong-code paths).
 */
export type AnimationVerdict = "correct" | "wrong" | "timeout" | "runtime_error" | "unknown";

export type AnimationEvent =
  | { type: "message"; text: string; tone?: "info" | "warn" | "error" }
  | { type: "particle"; at: [number, number, number]; preset: string }
  | { type: "camera_shake"; intensity?: number }
  | { type: "custom"; name: string; payload?: Record<string, unknown> };

export type AnimationStep = {
  /** 0-based day index — each loop iteration advances the world clock */
  day: number;
  label?: string;
  /** Problem-specific snapshot (e.g. grid, graph, queue state) */
  state: Record<string, unknown>;
  events?: AnimationEvent[];
};

export type SceneScript = {
  problemId: string;
  metadata: {
    title: string;
    verdict: AnimationVerdict;
    expectedAnswer?: number | string;
    userAnswer?: number | string;
    note?: string;
  };
  initialInput: Record<string, unknown>;
  steps: AnimationStep[];
};

export type CodeRunResult =
  | {
      ok: true;
      answer: number;
      trace?: Record<string, unknown>[];
    }
  | {
      ok: false;
      reason: "timeout" | "runtime_error" | "infinite_loop" | "invalid_output";
      message: string;
    };

export type CompileAnimationRequest = {
  problemId: string;
  code: string;
  input: Record<string, unknown>;
  /** Reference answer from deterministic simulator (optional hint for LLM) */
  referenceScript?: SceneScript;
};

export type CompileAnimationResponse = {
  script: SceneScript;
  source: "reference" | "sandbox" | "llm";
};
