/** Types mirroring the FastAPI ClientAnimationPackage / RunResponse contracts. */

export type EntrypointSpec = {
  language: string;
  className: string;
  methodName: string;
  arguments: string[];
  argumentCodecs?: Record<string, string>;
  returnCodec?: string | null;
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

export type StructureSpec = {
  type: "grid" | "array" | string;
  inputKey: string;
  layout?: string;
  showIndices?: boolean;
};

export type ThemeSpec = {
  preset: WorldPreset;
  name: string;
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

/** Legacy world block — still present on older packages / compat views. */
export type WorldSpec = {
  preset: WorldPreset;
  theme: string;
  sceneType: string;
  palette: ThemeSpec["palette"];
  camera: ThemeSpec["camera"];
  props: ThemeSpec["props"];
  timeSystem: ThemeSpec["timeSystem"];
};

export type VisualPlan = {
  structure: StructureSpec;
  theme: ThemeSpec;
  /** Compat: some loaders may still expose world */
  world?: WorldSpec;
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

export type BuildProblemRequest = {
  style?: string;
  force?: boolean;
  exampleIndex?: number | null;
};

export type BuildProblemResponse = {
  problemId: string;
  status: "published" | "validation_failed" | "draft";
  package: ClientAnimationPackage | null;
  errors: string[];
};

export type CellValue = string | number;
export type Grid = CellValue[][];

/** Normalize theme from new or legacy visual plans. */
export function getTheme(plan: VisualPlan): ThemeSpec {
  if (plan.theme) return plan.theme;
  const world = plan.world;
  if (!world) {
    return {
      preset: "generic_grid",
      name: "untitled",
      palette: { sky: "#7ecbff", ground: "#94a3b8", accent: "#fbbf24" },
      camera: { mode: "isometric", position: [3.5, 8, 14], target: [0, 0.6, -0.5] },
      props: [],
      timeSystem: { mode: "static", advanceOn: "none" },
    };
  }
  return {
    preset: world.preset,
    name: world.theme,
    palette: world.palette,
    camera: world.camera,
    props: world.props,
    timeSystem: world.timeSystem,
  };
}

export function getStructure(plan: VisualPlan): StructureSpec {
  if (plan.structure) return plan.structure;
  return {
    type: plan.world?.sceneType === "array" ? "array" : "grid",
    inputKey: "grid",
    layout: "isometric",
  };
}

/** Ensure structure + theme + legacy world compat are always present. */
export function normalizeVisualPlan(
  plan: VisualPlan | (Partial<VisualPlan> & { world?: WorldSpec }),
): VisualPlan {
  const asPlan = plan as VisualPlan;
  const structure = getStructure(asPlan);
  const theme = getTheme(asPlan);
  return {
    structure,
    theme,
    world: {
      preset: theme.preset,
      theme: theme.name,
      sceneType: structure.type,
      palette: theme.palette,
      camera: theme.camera,
      props: theme.props,
      timeSystem: theme.timeSystem,
    },
    entities: asPlan.entities ?? {},
    eventBindings: asPlan.eventBindings ?? {},
    resultChoreography: asPlan.resultChoreography ?? {
      success: {
        effect: "confetti",
        entityReaction: "none",
        explanation: "Correct!",
      },
      failure: {
        effect: "failure_deflate",
        entityReaction: "none",
        explanation: "Not quite.",
      },
    },
    intro: asPlan.intro ?? [],
  };
}
