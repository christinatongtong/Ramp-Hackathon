"use client";

import type { ProblemSemanticSpec, VisualPlan } from "@/lib/api/types";

export type GraphNodeState = {
  id: string;
  label: string | number;
  colorState?: "unvisited" | "visiting" | "visited" | "cycle" | string;
};

export type GraphEdgeState = {
  id: string;
  from: string;
  to: string;
  active?: boolean;
};

export type GraphSceneProps = {
  visualPlan: VisualPlan;
  semanticSpec?: ProblemSemanticSpec | null;
  nodes: GraphNodeState[];
  edges: GraphEdgeState[];
  activeNodeId: string | null;
  activeEdgeId: string | null;
  finalized: string[];
  indegrees: Record<string, number>;
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
