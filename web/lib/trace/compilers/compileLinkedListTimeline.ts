import type { AnimationStep, SceneScript } from "@/lib/animation-engine/types";
import type { ExecutionResult, VisualPlan } from "@/lib/api/types";
import { getTheme } from "@/lib/api/types";

export type ListNodeState = {
  id: string;
  value: number | string;
  next: string | null;
};

type EdgeHighlight = {
  nodeId: string;
  oldNext: string | null;
  newNext: string | null;
} | null;

function parseNodes(raw: unknown): ListNodeState[] {
  if (!Array.isArray(raw)) return [];
  const nodes: ListNodeState[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.id !== "string") continue;
    nodes.push({
      id: rec.id,
      value: (rec.value as number | string) ?? 0,
      next: typeof rec.next === "string" ? rec.next : null,
    });
  }
  return nodes;
}

function cloneNodes(nodes: ListNodeState[]): ListNodeState[] {
  return nodes.map((n) => ({ ...n }));
}

function orderFromHead(
  nodes: ListNodeState[],
  headId: string | null,
): string[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const order: string[] = [];
  const seen = new Set<string>();
  let cur = headId;
  while (cur && byId.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    order.push(cur);
    cur = byId.get(cur)?.next ?? null;
  }
  for (const node of nodes) {
    if (!seen.has(node.id)) order.push(node.id);
  }
  return order;
}

/**
 * Compile linked-list execution events into AnimationEngine steps.
 * Node layout stays stable until a final rearrange after reversal.
 */
export function compileLinkedListTimeline(
  problemId: string,
  execution: ExecutionResult,
  visualPlan: VisualPlan,
): SceneScript {
  const initEvent = execution.events.find((e) => e.type === "init");
  let nodes = parseNodes(
    initEvent?.nodes ??
      execution.initialState.nodes ??
      execution.initialState.listNodes,
  );
  let headId =
    (typeof initEvent?.headId === "string" ? initEvent.headId : null) ??
    (typeof execution.initialState.headId === "string"
      ? execution.initialState.headId
      : null);
  const initialOrder = orderFromHead(nodes, headId);
  let layoutOrder = [...initialOrder];
  const pointers: Record<string, string | null> = {};
  let activeNodeId: string | null = null;
  let finalized: string[] = [];
  let edgeHighlight: EdgeHighlight = null;
  const steps: AnimationStep[] = [];
  const theme = getTheme(visualPlan);

  const pushStep = (
    label: string | undefined,
    event: Record<string, unknown>,
    extra: Record<string, unknown> = {},
  ) => {
    const eventType = String(event.type ?? "unknown");
    const binding = visualPlan.eventBindings[eventType];
    steps.push({
      day: 0,
      label,
      durationMs: binding?.durationMs ?? 700,
      state: {
        structureType: "linked_list",
        nodes: cloneNodes(nodes),
        headId,
        pointers: { ...pointers },
        activeNodeId,
        finalized: [...finalized],
        edgeHighlight: edgeHighlight ? { ...edgeHighlight } : null,
        layoutOrder: [...layoutOrder],
        effect: binding?.effect ?? null,
        effectColor: binding?.color ?? null,
        targetReaction: binding?.targetReaction ?? null,
        cameraCue: binding?.camera ?? null,
        passed: execution.passed,
        ...extra,
      },
    });
  };

  pushStep("Initial list", { type: "init" });

  for (const event of execution.events) {
    const type = String(event.type ?? "");
    if (type === "init") {
      nodes = parseNodes(event.nodes);
      if (typeof event.headId === "string" || event.headId === null) {
        headId = (event.headId as string | null) ?? null;
      }
      layoutOrder = orderFromHead(nodes, headId);
      continue;
    }

    edgeHighlight = null;

    if (type === "pointer_set" || type === "pointer_move") {
      const name = String(event.pointer ?? event.name ?? "ptr");
      const to =
        event.nodeId !== undefined
          ? (event.nodeId as string | null)
          : event.toNodeId !== undefined
            ? (event.toNodeId as string | null)
            : null;
      pointers[name] = typeof to === "string" || to === null ? to : null;
      activeNodeId = typeof to === "string" ? to : null;
    }

    if (type === "link_update") {
      const nodeId = event.nodeId;
      if (typeof nodeId === "string") {
        const oldNext =
          typeof event.oldNext === "string" || event.oldNext === null
            ? (event.oldNext as string | null)
            : null;
        const newNext =
          typeof event.newNext === "string" || event.newNext === null
            ? (event.newNext as string | null)
            : null;
        edgeHighlight = { nodeId, oldNext, newNext };
        nodes = nodes.map((n) =>
          n.id === nodeId ? { ...n, next: newNext } : n,
        );
        if (nameIsHeadUpdate(event) && typeof event.headId === "string") {
          headId = event.headId;
        }
      }
    }

    if (type === "node_visit") {
      const nodeId = event.nodeId;
      if (typeof nodeId === "string") activeNodeId = nodeId;
    }

    if (type === "node_finalize") {
      const nodeId = event.nodeId;
      if (typeof nodeId === "string" && !finalized.includes(nodeId)) {
        finalized.push(nodeId);
        activeNodeId = nodeId;
      }
    }

    pushStep(type === "done" ? `Result: ${String(execution.result)}` : type, event);

    if (type === "done") {
      if (typeof event.headId === "string" || event.headId === null) {
        headId = (event.headId as string | null) ?? null;
      }
      // Gentle one-time rearrange to follow reversed topology
      layoutOrder = orderFromHead(nodes, headId);
      const choreography = execution.passed
        ? visualPlan.resultChoreography.success
        : visualPlan.resultChoreography.failure;
      // Sequential finalize glow for the final chain
      const finalOrder = orderFromHead(nodes, headId);
      finalized = [...finalOrder];
      steps.push({
        day: 0,
        label: execution.passed ? "Reversed" : "Failure",
        durationMs: 1400,
        state: {
          structureType: "linked_list",
          nodes: cloneNodes(nodes),
          headId,
          pointers: { ...pointers },
          activeNodeId: headId,
          finalized: [...finalized],
          edgeHighlight: null,
          layoutOrder: [...layoutOrder],
          effect: choreography.effect || "list_complete",
          effectColor: null,
          targetReaction: choreography.entityReaction,
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
      expectedAnswer:
        typeof execution.expected === "number" ||
        typeof execution.expected === "string"
          ? execution.expected
          : String(execution.expected),
      userAnswer:
        typeof execution.result === "number" ||
        typeof execution.result === "string"
          ? execution.result
          : String(execution.result),
      note: execution.passed ? "Passed" : "Failed",
    },
    initialInput: execution.initialState,
    steps,
  };
}

function nameIsHeadUpdate(event: Record<string, unknown>): boolean {
  return "headId" in event;
}
