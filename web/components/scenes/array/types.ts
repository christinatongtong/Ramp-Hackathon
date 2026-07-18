"use client";

import type { ProblemSemanticSpec, VisualPlan } from "@/lib/api/types";

export type ArraySceneProps = {
  visualPlan: VisualPlan;
  semanticSpec?: ProblemSemanticSpec | null;
  values: number[];
  pointers: Record<string, number>;
  window: { left: number; right: number } | null;
  activeIndices: number[] | null;
  finalized: number[];
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

export const ARRAY_SPACING = 1.35;
export const ARRAY_BLOCK_SIZE = 0.9;
