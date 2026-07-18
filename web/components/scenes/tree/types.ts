"use client";

import type { ProblemSemanticSpec, VisualPlan } from "@/lib/api/types";

export type TreeNodeState = {
  id: string;
  value: number | string;
  left: string | null;
  right: string | null;
};

export type TreeSceneProps = {
  visualPlan: VisualPlan;
  semanticSpec?: ProblemSemanticSpec | null;
  nodes: TreeNodeState[];
  rootId: string | null;
  activeNodeId: string | null;
  finalized: string[];
  swapHighlight: { nodeId: string } | null;
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
