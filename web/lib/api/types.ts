/** Types mirroring the FastAPI ClientAnimationPackage / RunResponse contracts. */

export type EntrypointSpec = {
  language: string;
  className: string;
  methodName: string;
  arguments: string[];
};

export type ProblemExample = {
  name: string | null;
  input: unknown;
  expected: unknown;
};

export type ProblemFacts = {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  algorithm: string[];
  number: number | null;
  description: string;
  examples: ProblemExample[];
  entrypoint: EntrypointSpec;
  starterCode: string;
  defaultExample: number;
};

export type ProblemSummary = {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  algorithm: string[];
  number: number | null;
  hasVisualPlan: boolean;
};

export type WorldPreset = "farm" | "island" | "generic_grid" | string;

export type EntityDefinition = {
  primitive: string;
  variant: string;
  color: string;
  label: string;
  idleAnimation: string;
  expression: string | null;
};

export type EventAnimation = {
  effect: string;
  durationMs: number;
  color: string | null;
  explanation: string;
  targetReaction: string | null;
  camera: string | null;
};

export type ResultReaction = {
  effect: string;
  entityReaction: string;
  explanation: string;
};

export type StateBinding = {
  value: string;
  semanticKey: string;
  label: string;
  entityType: string;
};

export type ProblemSemanticSpec = {
  sceneType: string;
  inputKey: string;
  bindings: StateBinding[];
};

export type VisualPlan = {
  world: {
    preset: WorldPreset;
    theme: string;
    sceneType: string;
    palette: { sky: string; ground: string; accent: string };
    camera: {
      mode: string;
      position: [number, number, number] | number[];
      target: [number, number, number] | number[];
    };
    props: Array<{
      primitive: string;
      placement: string;
      count: number;
    }>;
    timeSystem: {
      mode: string;
      advanceOn: string;
    };
  };
  /** Entities keyed by semanticKey when semanticSpec is present, else by cell value. */
  entities: Record<string, EntityDefinition>;
  eventBindings: Record<string, EventAnimation>;
  resultChoreography: {
    success: ResultReaction;
    failure: ResultReaction;
  };
  intro: Array<{
    action: string;
    durationMs: number;
    text: string | null;
  }>;
};

export type ExecutionResult = {
  result: unknown;
  expected: unknown;
  passed: boolean;
  initialState: Record<string, unknown>;
  finalState: Record<string, unknown>;
  events: Array<Record<string, unknown>>;
};

export type Verdict =
  | "accepted"
  | "wrong_answer"
  | "syntax_error"
  | "runtime_error"
  | "time_limit_exceeded";

export type RunResponse = {
  passed: boolean;
  verdict: Verdict;
  message: string;
  testsPassed: number;
  testsTotal: number;
  execution: ExecutionResult | null;
};

export type ClientAnimationPackage = {
  problem: ProblemFacts;
  visualPlan: VisualPlan;
  semanticSpec: ProblemSemanticSpec | null;
  initialState: Record<string, unknown>;
};

export type GameStatus =
  | "idle"
  | "checking"
  | "failed"
  | "passed"
  | "animating"
  | "complete";

export type CellValue = string | number;
export type Grid = CellValue[][];
