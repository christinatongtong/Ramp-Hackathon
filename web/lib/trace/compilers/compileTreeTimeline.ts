import type { AnimationStep, SceneScript } from "@/lib/animation-engine/types";
import type { ExecutionResult, VisualPlan } from "@/lib/api/types";
import { getTheme } from "@/lib/api/types";

export type TreeNodeState = {
  id: string;
  value: number | string;
  left: string | null;
  right: string | null;
};

function parseNodes(raw: unknown): TreeNodeState[] {
  if (!Array.isArray(raw)) return [];
  const nodes: TreeNodeState[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.id !== "string") continue;
    nodes.push({
      id: rec.id,
      value: (rec.value as number | string) ?? 0,
      left: typeof rec.left === "string" ? rec.left : null,
      right: typeof rec.right === "string" ? rec.right : null,
    });
  }
  return nodes;
}

function cloneNodes(nodes: TreeNodeState[]): TreeNodeState[] {
  return nodes.map((n) => ({ ...n }));
}

export function compileTreeTimeline(
  problemId: string,
  execution: ExecutionResult,
  visualPlan: VisualPlan,
): SceneScript {
  const initEvent = execution.events.find((e) => e.type === "init");
  let nodes = parseNodes(initEvent?.nodes ?? execution.initialState.nodes);
  let rootId =
    (typeof initEvent?.rootId === "string" ? initEvent.rootId : null) ??
    (typeof execution.initialState.rootId === "string"
      ? execution.initialState.rootId
      : null);
  let activeNodeId: string | null = null;
  let finalized: string[] = [];
  let swapHighlight: { nodeId: string } | null = null;
  const steps: AnimationStep[] = [];
  const theme = getTheme(visualPlan);

  const pushStep = (
    label: string | undefined,
    event: Record<string, unknown>,
  ) => {
    const eventType = String(event.type ?? "unknown");
    const binding = visualPlan.eventBindings[eventType];
    steps.push({
      day: 0,
      label,
      durationMs: binding?.durationMs ?? 700,
      state: {
        structureType: "binary_tree",
        nodes: cloneNodes(nodes),
        rootId,
        activeNodeId,
        finalized: [...finalized],
        swapHighlight: swapHighlight ? { ...swapHighlight } : null,
        effect: binding?.effect ?? null,
        effectColor: binding?.color ?? null,
        cameraCue: binding?.camera ?? null,
        passed: execution.passed,
      },
    });
  };

  pushStep("Initial tree", { type: "init" });

  for (const event of execution.events) {
    const type = String(event.type ?? "");
    if (type === "init") {
      nodes = parseNodes(event.nodes);
      rootId = typeof event.rootId === "string" ? event.rootId : rootId;
      continue;
    }
    swapHighlight = null;

    if (type === "node_visit" || type === "move_left" || type === "move_right") {
      if (typeof event.nodeId === "string") activeNodeId = event.nodeId;
    }

    if (type === "child_swap") {
      const nodeId = event.nodeId;
      if (typeof nodeId === "string") {
        swapHighlight = { nodeId };
        nodes = nodes.map((n) =>
          n.id === nodeId ? { ...n, left: n.right, right: n.left } : n,
        );
        activeNodeId = nodeId;
      }
    }

    if (type === "subtree_complete" || type === "node_finalize") {
      const nodeId = event.nodeId;
      if (typeof nodeId === "string" && !finalized.includes(nodeId)) {
        finalized.push(nodeId);
        activeNodeId = nodeId;
      }
    }

    pushStep(type === "done" ? `Result: ${String(execution.result)}` : type, event);

    if (type === "done") {
      const choreography = execution.passed
        ? visualPlan.resultChoreography.success
        : visualPlan.resultChoreography.failure;
      steps.push({
        day: 0,
        label: execution.passed ? "Inverted" : "Failure",
        durationMs: 1200,
        state: {
          structureType: "binary_tree",
          nodes: cloneNodes(nodes),
          rootId,
          activeNodeId: rootId,
          finalized: nodes.map((n) => n.id),
          swapHighlight: null,
          effect: choreography.effect,
          cameraCue: "wide",
          passed: execution.passed,
          resultOverlay: true,
          resultExplanation: choreography.explanation,
        },
      });
    }
  }

  return {
    problemId,
    metadata: {
      title: theme.name,
      verdict: execution.passed ? "correct" : "wrong",
      expectedAnswer: String(execution.expected),
      userAnswer: String(execution.result),
      note: execution.passed ? "Passed" : "Failed",
    },
    initialInput: execution.initialState,
    steps,
  };
}
