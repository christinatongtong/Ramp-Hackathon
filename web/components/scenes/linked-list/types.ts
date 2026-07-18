"use client";

import type { ProblemSemanticSpec, VisualPlan } from "@/lib/api/types";

export type ListNodeState = {
  id: string;
  value: number | string;
  next: string | null;
};

export type LinkedListSceneProps = {
  visualPlan: VisualPlan;
  semanticSpec?: ProblemSemanticSpec | null;
  nodes: ListNodeState[];
  headId: string | null;
  pointers: Record<string, string | null>;
  activeNodeId: string | null;
  finalized: string[];
  edgeHighlight: {
    nodeId: string;
    oldNext: string | null;
    newNext: string | null;
  } | null;
  layoutOrder: string[];
  pulse: boolean;
  problemOpen: boolean;
  toggleTrigger: number;
  introLanded: boolean;
  orbitEnabled: boolean;
  onIntroLand: () => void;
  onBoardHit: (open: boolean) => void;
  onToggleDone: () => void;
  statusLabel?: string | null;
  effect?: string | null;
  effectColor?: string | null;
  cameraCue?: string | null;
  resultOverlay?: boolean;
  resultPassed?: boolean;
  resultExplanation?: string | null;
  introTitle?: string | null;
};

export const LIST_SPACING = 2.4;
export const LIST_NODE_SIZE = 1.1;
