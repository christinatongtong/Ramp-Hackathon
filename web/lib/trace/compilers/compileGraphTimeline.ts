import type { AnimationStep, SceneScript } from "@/lib/animation-engine/types";
import type { ExecutionResult, VisualPlan } from "@/lib/api/types";
import { getTheme } from "@/lib/api/types";

export type GraphNodeState = {
  id: string;
  label: string | number;
  colorState?: string;
};

export type GraphEdgeState = {
  id: string;
  from: string;
  to: string;
  active?: boolean;
};

function parseNodes(raw: unknown): GraphNodeState[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .filter((item) => typeof item.id === "string")
    .map((item) => ({
      id: String(item.id),
      label: (item.label as string | number) ?? item.id,
      colorState: typeof item.colorState === "string" ? item.colorState : "unvisited",
    }));
}

function parseEdges(raw: unknown): GraphEdgeState[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .filter(
      (item) =>
        typeof item.id === "string" &&
        typeof item.from === "string" &&
        typeof item.to === "string",
    )
    .map((item) => ({
      id: String(item.id),
      from: String(item.from),
      to: String(item.to),
      active: Boolean(item.active),
    }));
}

export function compileGraphTimeline(
  problemId: string,
  execution: ExecutionResult,
  visualPlan: VisualPlan,
): SceneScript {
  const initEvent = execution.events.find((e) => e.type === "init");
  let nodes = parseNodes(initEvent?.nodes ?? execution.initialState.nodes);
  let edges = parseEdges(initEvent?.edges ?? execution.initialState.edges);
  let activeNodeId: string | null = null;
  let activeEdgeId: string | null = null;
  let finalized: string[] = [];
  let indegrees: Record<string, number> = {};
  if (initEvent?.indegrees && typeof initEvent.indegrees === "object") {
    indegrees = { ...(initEvent.indegrees as Record<string, number>) };
  }
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
      durationMs: binding?.durationMs ?? 650,
      state: {
        structureType: "graph",
        nodes: nodes.map((n) => ({ ...n })),
        edges: edges.map((e) => ({ ...e })),
        activeNodeId,
        activeEdgeId,
        finalized: [...finalized],
        indegrees: { ...indegrees },
        effect: binding?.effect ?? null,
        effectColor: binding?.color ?? null,
        cameraCue: binding?.camera ?? null,
        passed: execution.passed,
      },
    });
  };

  pushStep("Initial graph", { type: "init" });

  for (const event of execution.events) {
    const type = String(event.type ?? "");
    if (type === "init") {
      nodes = parseNodes(event.nodes);
      edges = parseEdges(event.edges);
      if (event.indegrees && typeof event.indegrees === "object") {
        indegrees = { ...(event.indegrees as Record<string, number>) };
      }
      continue;
    }

    activeEdgeId = null;

    if (type === "node_visit" || type === "node_enqueue") {
      if (typeof event.nodeId === "string") {
        activeNodeId = event.nodeId;
        nodes = nodes.map((n) =>
          n.id === event.nodeId ? { ...n, colorState: "visiting" } : n,
        );
      }
    }

    if (type === "edge_examine") {
      if (typeof event.edgeId === "string") activeEdgeId = event.edgeId;
      else {
        const from =
          typeof event.from === "string"
            ? event.from
            : typeof event.fromNodeId === "string"
              ? event.fromNodeId
              : null;
        const to =
          typeof event.to === "string"
            ? event.to
            : typeof event.toNodeId === "string"
              ? event.toNodeId
              : null;
        if (from && to) {
          const found = edges.find((e) => e.from === from && e.to === to);
          activeEdgeId = found?.id ?? null;
        }
      }
      edges = edges.map((e) => ({
        ...e,
        active: e.id === activeEdgeId,
      }));
    }

    if (type === "indegree_update") {
      const nodeId = event.nodeId;
      const value = event.value ?? event.indegree;
      if (typeof nodeId === "string" && typeof value === "number") {
        indegrees[nodeId] = value;
        activeNodeId = nodeId;
      }
    }

    if (type === "node_finalize") {
      const nodeId = event.nodeId;
      if (typeof nodeId === "string") {
        if (!finalized.includes(nodeId)) finalized.push(nodeId);
        activeNodeId = nodeId;
        nodes = nodes.map((n) =>
          n.id === nodeId ? { ...n, colorState: "visited" } : n,
        );
      }
    }

    if (type === "cycle_detected") {
      const ids = Array.isArray(event.nodeIds)
        ? event.nodeIds.filter((id): id is string => typeof id === "string")
        : typeof event.nodeId === "string"
          ? [event.nodeId]
          : [];
      if (ids.length) {
        activeNodeId = ids[0];
        nodes = nodes.map((n) =>
          ids.includes(n.id) ? { ...n, colorState: "cycle" } : n,
        );
      }
    }

    pushStep(type === "done" ? `Result: ${String(execution.result)}` : type, event);

    if (type === "done") {
      const choreography = execution.passed
        ? visualPlan.resultChoreography.success
        : visualPlan.resultChoreography.failure;
      steps.push({
        day: 0,
        label: execution.passed ? "Complete" : "Failure",
        durationMs: 1200,
        state: {
          structureType: "graph",
          nodes: nodes.map((n) => ({ ...n })),
          edges: edges.map((e) => ({ ...e, active: false })),
          activeNodeId,
          activeEdgeId: null,
          finalized: [...finalized],
          indegrees: { ...indegrees },
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
