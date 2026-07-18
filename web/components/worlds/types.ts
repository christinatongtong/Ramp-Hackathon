"use client";

import type { Grid, VisualPlan } from "@/lib/api/types";

export type GridWorldProps = {
  grid: Grid;
  visualPlan: VisualPlan;
  pulse: boolean;
  activeCell: { row: number; col: number } | null;
  dayIndex: number | null;
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
  regionCells?: Array<[number, number]> | null;
  frontierCells?: Array<[number, number]> | null;
  cameraCue?: string | null;
  resultOverlay?: boolean;
  resultPassed?: boolean;
  resultExplanation?: string | null;
  introTitle?: string | null;
};
