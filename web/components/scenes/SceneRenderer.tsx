"use client";

import dynamic from "next/dynamic";
import type { ProblemSemanticSpec, VisualPlan } from "@/lib/api/types";
import { getStructure } from "@/lib/api/types";
import type { Grid } from "@/lib/api/types";
import { UnsupportedScene } from "./UnsupportedScene";
import type { ArraySceneProps } from "./array/types";
import type { LinkedListSceneProps, ListNodeState } from "./linked-list/types";
import type { TreeNodeState, TreeSceneProps } from "./tree/types";
import type { GraphEdgeState, GraphNodeState, GraphSceneProps } from "./graph/types";
import type { GridWorldProps } from "@/components/worlds/types";

const loading = (
  <div className="flex h-full items-center justify-center bg-[#7ecbff] text-slate-800">
    Loading scene…
  </div>
);

const GridScene = dynamic(
  () => import("./grid/GridScene").then((mod) => mod.GridScene),
  { ssr: false, loading: () => loading },
);

const ArrayScene = dynamic(
  () => import("./array/ArrayScene").then((mod) => mod.ArrayScene),
  { ssr: false, loading: () => loading },
);

const LinkedListScene = dynamic(
  () => import("./linked-list/LinkedListScene").then((mod) => mod.LinkedListScene),
  { ssr: false, loading: () => loading },
);

const TreeScene = dynamic(
  () => import("./tree/TreeScene").then((mod) => mod.TreeScene),
  { ssr: false, loading: () => loading },
);

const GraphScene = dynamic(
  () => import("./graph/GraphScene").then((mod) => mod.GraphScene),
  { ssr: false, loading: () => loading },
);

export type SceneRendererProps = {
  visualPlan: VisualPlan;
  semanticSpec?: ProblemSemanticSpec | null;
  grid?: Grid;
  values?: number[];
  pointers?: Record<string, number>;
  window?: { left: number; right: number } | null;
  activeIndices?: number[] | null;
  finalized?: number[];
  listNodes?: ListNodeState[];
  listHeadId?: string | null;
  listPointers?: Record<string, string | null>;
  listActiveNodeId?: string | null;
  listFinalized?: string[];
  listEdgeHighlight?: {
    nodeId: string;
    oldNext: string | null;
    newNext: string | null;
  } | null;
  listLayoutOrder?: string[];
  treeNodes?: TreeNodeState[];
  treeRootId?: string | null;
  treeActiveNodeId?: string | null;
  treeFinalized?: string[];
  treeSwapHighlight?: { nodeId: string } | null;
  graphNodes?: GraphNodeState[];
  graphEdges?: GraphEdgeState[];
  graphActiveNodeId?: string | null;
  graphActiveEdgeId?: string | null;
  graphFinalized?: string[];
  graphIndegrees?: Record<string, number>;
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

/**
 * Dispatches on visualPlan.structure.type only — never on problemId.
 */
export function SceneRenderer(props: SceneRendererProps) {
  const structure = getStructure(props.visualPlan);
  const sharedShell = {
    visualPlan: props.visualPlan,
    semanticSpec: props.semanticSpec,
    pulse: props.pulse,
    problemOpen: props.problemOpen,
    toggleTrigger: props.toggleTrigger,
    introLanded: props.introLanded,
    orbitEnabled: props.orbitEnabled,
    onIntroLand: props.onIntroLand,
    onBoardHit: props.onBoardHit,
    onToggleDone: props.onToggleDone,
    statusLabel: props.statusLabel,
    effect: props.effect,
    effectColor: props.effectColor,
    cameraCue: props.cameraCue,
    resultOverlay: props.resultOverlay,
    resultPassed: props.resultPassed,
    resultExplanation: props.resultExplanation,
    introTitle: props.introTitle,
  };

  if (structure.type === "array") {
    const arrayProps: ArraySceneProps = {
      ...sharedShell,
      values: props.values ?? [],
      pointers: props.pointers ?? {},
      window: props.window ?? null,
      activeIndices: props.activeIndices ?? null,
      finalized: props.finalized ?? [],
    };
    return <ArrayScene {...arrayProps} />;
  }

  if (structure.type === "linked_list") {
    const listProps: LinkedListSceneProps = {
      ...sharedShell,
      nodes: props.listNodes ?? [],
      headId: props.listHeadId ?? null,
      pointers: props.listPointers ?? {},
      activeNodeId: props.listActiveNodeId ?? null,
      finalized: props.listFinalized ?? [],
      edgeHighlight: props.listEdgeHighlight ?? null,
      layoutOrder: props.listLayoutOrder ?? (props.listNodes ?? []).map((n) => n.id),
    };
    return <LinkedListScene {...listProps} />;
  }

  if (structure.type === "binary_tree") {
    const treeProps: TreeSceneProps = {
      ...sharedShell,
      nodes: props.treeNodes ?? [],
      rootId: props.treeRootId ?? null,
      activeNodeId: props.treeActiveNodeId ?? null,
      finalized: props.treeFinalized ?? [],
      swapHighlight: props.treeSwapHighlight ?? null,
    };
    return <TreeScene {...treeProps} />;
  }

  if (structure.type === "graph") {
    const graphProps: GraphSceneProps = {
      ...sharedShell,
      nodes: props.graphNodes ?? [],
      edges: props.graphEdges ?? [],
      activeNodeId: props.graphActiveNodeId ?? null,
      activeEdgeId: props.graphActiveEdgeId ?? null,
      finalized: props.graphFinalized ?? [],
      indegrees: props.graphIndegrees ?? {},
    };
    return <GraphScene {...graphProps} />;
  }

  if (structure.type === "grid") {
    const gridProps: GridWorldProps = {
      visualPlan: props.visualPlan,
      semanticSpec: props.semanticSpec,
      grid: props.grid?.length ? props.grid : [["0"]],
      pulse: props.pulse,
      activeCell: props.activeCell,
      dayIndex: props.dayIndex,
      problemOpen: props.problemOpen,
      toggleTrigger: props.toggleTrigger,
      introLanded: props.introLanded,
      orbitEnabled: props.orbitEnabled,
      onIntroLand: props.onIntroLand,
      onBoardHit: props.onBoardHit,
      onToggleDone: props.onToggleDone,
      statusLabel: props.statusLabel,
      effect: props.effect,
      effectColor: props.effectColor,
      regionCells: props.regionCells,
      frontierCells: props.frontierCells,
      cameraCue: props.cameraCue,
      resultOverlay: props.resultOverlay,
      resultPassed: props.resultPassed,
      resultExplanation: props.resultExplanation,
      introTitle: props.introTitle,
    };
    return <GridScene {...gridProps} />;
  }

  return <UnsupportedScene structureType={structure.type} />;
}
