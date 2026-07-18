"use client";

import Link from "next/link";
import { Fredoka } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimationEngine } from "@/lib/animation-engine/AnimationEngine";
import { useAnimationPackage } from "@/lib/api/useAnimationPackage";
import type {
  GameStatus,
  Grid,
  RunResponse,
} from "@/lib/api/types";
import { getStructure, getTheme } from "@/lib/api/types";
import { resolveEffect } from "@/lib/effects/registry";
import {
  compileIntroTimeline,
  compileTimeline,
  readGridFromState,
} from "@/lib/trace/compileTimeline";
import { ProblemPanel } from "@/components/game/ProblemPanel";
import { PythonEditor } from "@/components/game/PythonEditor";
import { RunResultOverlay } from "@/components/game/RunResultOverlay";
import { SceneRenderer } from "@/components/scenes/SceneRenderer";
import type { ListNodeState } from "@/components/scenes/linked-list/types";
import type { TreeNodeState } from "@/components/scenes/tree/types";
import type {
  GraphEdgeState,
  GraphNodeState,
} from "@/components/scenes/graph/types";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });
const animationEngine = new AnimationEngine();

type AlgorithmGameProps = {
  problemId: string;
};

function emptyGrid(): Grid {
  return [];
}

function asCoordPairs(value: unknown): Array<[number, number]> | null {
  if (!Array.isArray(value)) return null;
  const pairs: Array<[number, number]> = [];
  for (const item of value) {
    if (
      Array.isArray(item) &&
      typeof item[0] === "number" &&
      typeof item[1] === "number"
    ) {
      pairs.push([item[0], item[1]]);
    }
  }
  return pairs;
}

function pickNumberArray(state: Record<string, unknown>): number[] {
  for (const key of ["values", "nums", "arr", "array"]) {
    const value = state[key];
    if (!Array.isArray(value)) continue;
    if (value.length > 0 && Array.isArray(value[0])) continue;
    return value.map((item) => Number(item));
  }
  return [];
}

function parseListNodes(raw: unknown): ListNodeState[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .filter((item) => typeof item.id === "string")
    .map((item) => ({
      id: String(item.id),
      value: (item.value as number | string) ?? 0,
      next: typeof item.next === "string" ? item.next : null,
    }));
}

function parseTreeNodes(raw: unknown): TreeNodeState[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .filter((item) => typeof item.id === "string")
    .map((item) => ({
      id: String(item.id),
      value: (item.value as number | string) ?? 0,
      left: typeof item.left === "string" ? item.left : null,
      right: typeof item.right === "string" ? item.right : null,
    }));
}

function parseGraphNodes(raw: unknown): GraphNodeState[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .filter((item) => typeof item.id === "string")
    .map((item) => ({
      id: String(item.id),
      label: (item.label as string | number) ?? item.id,
      colorState:
        typeof item.colorState === "string" ? item.colorState : "unvisited",
    }));
}

function parseGraphEdges(raw: unknown): GraphEdgeState[] {
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

function parseStringPointers(
  raw: unknown,
): Record<string, string | null> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" || value === null) out[key] = value;
  }
  return out;
}

function parseIndegrees(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "number") out[key] = value;
  }
  return out;
}

export function AlgorithmGame({ problemId }: AlgorithmGameProps) {
  const { loading, error, problem, visualPlan, semanticSpec, initialState, submit } =
    useAnimationPackage(problemId);

  const [code, setCode] = useState("");
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [values, setValues] = useState<number[]>([]);
  const [pointers, setPointers] = useState<Record<string, number>>({});
  const [windowRange, setWindowRange] = useState<{
    left: number;
    right: number;
  } | null>(null);
  const [activeIndices, setActiveIndices] = useState<number[] | null>(null);
  const [finalized, setFinalized] = useState<number[]>([]);
  const [listNodes, setListNodes] = useState<ListNodeState[]>([]);
  const [listHeadId, setListHeadId] = useState<string | null>(null);
  const [listPointers, setListPointers] = useState<Record<string, string | null>>(
    {},
  );
  const [listActiveNodeId, setListActiveNodeId] = useState<string | null>(null);
  const [listFinalized, setListFinalized] = useState<string[]>([]);
  const [listEdgeHighlight, setListEdgeHighlight] = useState<{
    nodeId: string;
    oldNext: string | null;
    newNext: string | null;
  } | null>(null);
  const [listLayoutOrder, setListLayoutOrder] = useState<string[]>([]);
  const [treeNodes, setTreeNodes] = useState<TreeNodeState[]>([]);
  const [treeRootId, setTreeRootId] = useState<string | null>(null);
  const [treeActiveNodeId, setTreeActiveNodeId] = useState<string | null>(null);
  const [treeFinalized, setTreeFinalized] = useState<string[]>([]);
  const [treeSwapHighlight, setTreeSwapHighlight] = useState<{
    nodeId: string;
  } | null>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNodeState[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdgeState[]>([]);
  const [graphActiveNodeId, setGraphActiveNodeId] = useState<string | null>(null);
  const [graphActiveEdgeId, setGraphActiveEdgeId] = useState<string | null>(null);
  const [graphFinalized, setGraphFinalized] = useState<string[]>([]);
  const [graphIndegrees, setGraphIndegrees] = useState<Record<string, number>>(
    {},
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [activeCell, setActiveCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [effect, setEffect] = useState<string | null>(null);
  const [effectColor, setEffectColor] = useState<string | null>(null);
  const [regionCells, setRegionCells] = useState<Array<[number, number]> | null>(
    null,
  );
  const [frontierCells, setFrontierCells] = useState<Array<
    [number, number]
  > | null>(null);
  const [cameraCue, setCameraCue] = useState<string | null>(null);
  const [resultOverlay, setResultOverlay] = useState(false);
  const [resultPassed, setResultPassed] = useState(true);
  const [resultExplanation, setResultExplanation] = useState<string | null>(null);
  const [introTitle, setIntroTitle] = useState<string | null>(null);
  const [problemOpen, setProblemOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [introLanded, setIntroLanded] = useState(false);
  const [toggleTrigger, setToggleTrigger] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const autoOpenDone = useRef(false);
  const codeSeeded = useRef(false);
  const introPlayed = useRef(false);

  useEffect(() => () => animationEngine.cancel(), []);

  useEffect(() => {
    if (problem && !codeSeeded.current) {
      setCode(problem.starterCode || "");
      codeSeeded.current = true;
    }
  }, [problem]);

  const applyStructureInitial = useCallback(
    (state: Record<string, unknown>, structureType: string) => {
      if (structureType === "array") {
        setValues(pickNumberArray(state));
        setPointers({});
        setWindowRange(null);
        setActiveIndices(null);
        setFinalized([]);
        return;
      }
      if (structureType === "linked_list") {
        const nodes = parseListNodes(state.nodes);
        const headId =
          typeof state.headId === "string" || state.headId === null
            ? (state.headId as string | null)
            : null;
        setListNodes(nodes);
        setListHeadId(headId);
        setListPointers({});
        setListActiveNodeId(null);
        setListFinalized([]);
        setListEdgeHighlight(null);
        setListLayoutOrder(nodes.map((n) => n.id));
        return;
      }
      if (structureType === "binary_tree") {
        const nodes = parseTreeNodes(state.nodes);
        setTreeNodes(nodes);
        setTreeRootId(
          typeof state.rootId === "string" ? state.rootId : null,
        );
        setTreeActiveNodeId(null);
        setTreeFinalized([]);
        setTreeSwapHighlight(null);
        return;
      }
      if (structureType === "graph") {
        setGraphNodes(parseGraphNodes(state.nodes));
        setGraphEdges(parseGraphEdges(state.edges));
        setGraphIndegrees(parseIndegrees(state.indegrees));
        setGraphActiveNodeId(null);
        setGraphActiveEdgeId(null);
        setGraphFinalized([]);
        return;
      }
      const initial = readGridFromState(state);
      if (initial) setGrid(initial);
    },
    [],
  );

  useEffect(() => {
    if (!initialState || !visualPlan) return;
    const structure = getStructure(visualPlan);
    applyStructureInitial(initialState, structure.type);
    setGameStatus("idle");
  }, [initialState, visualPlan, applyStructureInitial]);

  const playIntroActions = useCallback(async () => {
    if (!visualPlan || introPlayed.current) return;
    introPlayed.current = true;
    const intro = compileIntroTimeline(visualPlan);
    for (const step of intro) {
      if (step.action === "show_title" || step.action === "show_structure") {
        setIntroTitle(step.text ?? getTheme(visualPlan).name);
      } else if (step.action === "show_grid") {
        setStatusLabel(step.text);
      } else if (step.action === "highlight_sources") {
        setStatusLabel(step.text);
        setPulse(true);
      }
      await new Promise((resolve) => window.setTimeout(resolve, step.durationMs));
    }
    setIntroTitle(null);
    setPulse(false);
  }, [visualPlan]);

  const requestToggle = useCallback(() => {
    if (!introLanded || isToggling) return;
    setIsToggling(true);
    setToggleTrigger((count) => count + 1);
  }, [introLanded, isToggling]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "p" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        requestToggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestToggle]);

  const handleIntroLand = useCallback(() => {
    setIntroLanded(true);
    void playIntroActions();
    if (!autoOpenDone.current) {
      autoOpenDone.current = true;
      window.setTimeout(() => {
        setIsToggling(true);
        setToggleTrigger((count) => count + 1);
      }, 800);
    }
  }, [playIntroActions]);

  const handleBoardHit = useCallback((open: boolean) => {
    setProblemOpen(open);
    setModalVisible(open);
  }, []);

  const handleToggleDone = useCallback(() => {
    setIsToggling(false);
  }, []);

  const restoreInitialState = useCallback(() => {
    if (!initialState || !visualPlan) return;
    const structure = getStructure(visualPlan);
    applyStructureInitial(initialState, structure.type);
  }, [initialState, visualPlan, applyStructureInitial]);

  const clearPlaybackState = () => {
    setDayIndex(null);
    setPulse(false);
    setActiveCell(null);
    setActiveIndices(null);
    setStatusLabel(null);
    setEffect(null);
    setEffectColor(null);
    setRegionCells(null);
    setFrontierCells(null);
    setCameraCue(null);
    setResultOverlay(false);
    setResultExplanation(null);
    setIntroTitle(null);
    setListEdgeHighlight(null);
    setTreeSwapHighlight(null);
  };

  const handleReset = () => {
    animationEngine.cancel();
    restoreInitialState();
    clearPlaybackState();
    setStatusMessage(null);
    setGameStatus("idle");
    setRunResult(null);
  };

  const handleCodeChange = (next: string) => {
    setCode(next);
    if (gameStatus === "failed") {
      setGameStatus("idle");
      setRunResult(null);
      setStatusMessage(null);
    }
  };

  const handleRun = async () => {
    if (!visualPlan || !problem) return;

    animationEngine.cancel();
    setGameStatus("checking");
    setRunResult(null);
    clearPlaybackState();
    setStatusMessage("Checking your solution…");
    restoreInitialState();

    try {
      const result = await submit({
        code,
        exampleIndex: problem.defaultExample,
      });
      setRunResult(result);

      if (!result.passed || !result.execution) {
        setGameStatus("failed");
        setStatusMessage(`✗ ${result.message}`);
        return;
      }

      setGameStatus("passed");
      setStatusMessage(`✓ ${result.message}`);

      await new Promise((resolve) => window.setTimeout(resolve, 700));

      const script = compileTimeline(problemId, result.execution, visualPlan);
      setGameStatus("animating");
      setStatusMessage(`Playing ${script.steps.length} step(s)…`);

      animationEngine.play(script, {
        msPerStep: 700,
        onStep: (step, index) => {
          const stepGrid = readGridFromState(step.state);
          if (stepGrid) setGrid(stepGrid);

          if (Array.isArray(step.state.values)) {
            setValues(
              (step.state.values as unknown[]).map((item) => Number(item)),
            );
          }
          if (
            step.state.pointers &&
            typeof step.state.pointers === "object" &&
            !Array.isArray(step.state.pointers)
          ) {
            const ptrs = step.state.pointers as Record<string, unknown>;
            const numeric: Record<string, number> = {};
            let hasNumeric = false;
            for (const [key, value] of Object.entries(ptrs)) {
              if (typeof value === "number") {
                numeric[key] = value;
                hasNumeric = true;
              }
            }
            if (hasNumeric) setPointers(numeric);
            else setListPointers(parseStringPointers(ptrs));
          }
          if (
            step.state.window &&
            typeof step.state.window === "object" &&
            !Array.isArray(step.state.window)
          ) {
            const w = step.state.window as { left?: number; right?: number };
            if (typeof w.left === "number" && typeof w.right === "number") {
              setWindowRange({ left: w.left, right: w.right });
            }
          } else if (step.state.window === null) {
            setWindowRange(null);
          }
          if (Array.isArray(step.state.activeIndices)) {
            setActiveIndices(
              step.state.activeIndices.filter(
                (i): i is number => typeof i === "number",
              ),
            );
          } else {
            setActiveIndices(null);
          }
          if (Array.isArray(step.state.finalized)) {
            const nums = step.state.finalized.filter(
              (i): i is number => typeof i === "number",
            );
            const ids = step.state.finalized.filter(
              (i): i is string => typeof i === "string",
            );
            if (nums.length) setFinalized(nums);
            if (ids.length) {
              setListFinalized(ids);
              setTreeFinalized(ids);
              setGraphFinalized(ids);
            }
          }

          if (Array.isArray(step.state.nodes)) {
            const structureType = step.state.structureType;
            if (structureType === "linked_list") {
              setListNodes(parseListNodes(step.state.nodes));
            } else if (structureType === "binary_tree") {
              setTreeNodes(parseTreeNodes(step.state.nodes));
            } else if (structureType === "graph") {
              setGraphNodes(parseGraphNodes(step.state.nodes));
            }
          }
          if ("headId" in step.state) {
            setListHeadId(
              typeof step.state.headId === "string" || step.state.headId === null
                ? (step.state.headId as string | null)
                : null,
            );
          }
          if ("rootId" in step.state) {
            setTreeRootId(
              typeof step.state.rootId === "string" ? step.state.rootId : null,
            );
          }
          if (typeof step.state.activeNodeId === "string" || step.state.activeNodeId === null) {
            const id = step.state.activeNodeId as string | null;
            setListActiveNodeId(id);
            setTreeActiveNodeId(id);
            setGraphActiveNodeId(id);
          }
          if (Array.isArray(step.state.layoutOrder)) {
            setListLayoutOrder(
              step.state.layoutOrder.filter(
                (id): id is string => typeof id === "string",
              ),
            );
          }
          if (
            step.state.edgeHighlight &&
            typeof step.state.edgeHighlight === "object"
          ) {
            const eh = step.state.edgeHighlight as Record<string, unknown>;
            if (typeof eh.nodeId === "string") {
              setListEdgeHighlight({
                nodeId: eh.nodeId,
                oldNext:
                  typeof eh.oldNext === "string" || eh.oldNext === null
                    ? (eh.oldNext as string | null)
                    : null,
                newNext:
                  typeof eh.newNext === "string" || eh.newNext === null
                    ? (eh.newNext as string | null)
                    : null,
              });
            }
          } else if (step.state.edgeHighlight === null) {
            setListEdgeHighlight(null);
          }
          if (
            step.state.swapHighlight &&
            typeof step.state.swapHighlight === "object"
          ) {
            const sh = step.state.swapHighlight as { nodeId?: string };
            if (typeof sh.nodeId === "string") {
              setTreeSwapHighlight({ nodeId: sh.nodeId });
            }
          } else if (step.state.swapHighlight === null) {
            setTreeSwapHighlight(null);
          }
          if (Array.isArray(step.state.edges)) {
            setGraphEdges(parseGraphEdges(step.state.edges));
          }
          if (typeof step.state.activeEdgeId === "string" || step.state.activeEdgeId === null) {
            setGraphActiveEdgeId(step.state.activeEdgeId as string | null);
          }
          if (step.state.indegrees && typeof step.state.indegrees === "object") {
            setGraphIndegrees(parseIndegrees(step.state.indegrees));
          }

          setDayIndex(step.day);

          const effectName =
            typeof step.state.effect === "string" ? step.state.effect : null;
          const resolved = resolveEffect(effectName);
          setEffect(effectName);
          setEffectColor(
            typeof step.state.effectColor === "string"
              ? step.state.effectColor
              : null,
          );
          setPulse(resolved.pulse && index > 0);
          setStatusLabel(resolved.label ?? step.label ?? null);
          setCameraCue(
            typeof step.state.cameraCue === "string" ? step.state.cameraCue : null,
          );
          setRegionCells(asCoordPairs(step.state.regionCells));
          setFrontierCells(asCoordPairs(step.state.frontier));
          setResultOverlay(Boolean(step.state.resultOverlay));
          setResultPassed(Boolean(step.state.passed));
          setResultExplanation(
            typeof step.state.resultExplanation === "string"
              ? step.state.resultExplanation
              : null,
          );

          const cell = step.state.activeCell as
            | { row: number; col: number }
            | null
            | undefined;
          setActiveCell(cell ?? null);
        },
        onComplete: () => {
          setGameStatus("complete");
          setStatusMessage(
            `✓ Animation complete — result ${String(result.execution?.result)}`,
          );
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Run failed";
      setGameStatus("failed");
      setRunResult({
        passed: false,
        verdict: "runtime_error",
        message,
        testsPassed: 0,
        testsTotal: 0,
        execution: null,
      });
      setStatusMessage(`✗ ${message}`);
    }
  };

  if (loading) {
    return (
      <div className={`farm-layout ${fredoka.className}`}>
        <div className="flex h-full items-center justify-center bg-[#7ecbff] text-slate-800">
          Loading animation package…
        </div>
      </div>
    );
  }

  if (error || !problem || !visualPlan) {
    return (
      <div className={`farm-layout ${fredoka.className}`}>
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#7ecbff] p-8 text-center text-slate-800">
          <p className="text-lg font-semibold">Could not load this world</p>
          <p className="max-w-md text-sm opacity-80">{error ?? "Missing package"}</p>
          <Link href="/select" className="farm-back-link relative static">
            ← Worlds
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`farm-layout ${fredoka.className}`}>
      <div className="farm-layout__world">
        <SceneRenderer
          visualPlan={visualPlan}
          semanticSpec={semanticSpec}
          grid={grid.length ? grid : [["0"]]}
          values={values}
          pointers={pointers}
          window={windowRange}
          activeIndices={activeIndices}
          finalized={finalized}
          listNodes={listNodes}
          listHeadId={listHeadId}
          listPointers={listPointers}
          listActiveNodeId={listActiveNodeId}
          listFinalized={listFinalized}
          listEdgeHighlight={listEdgeHighlight}
          listLayoutOrder={listLayoutOrder}
          treeNodes={treeNodes}
          treeRootId={treeRootId}
          treeActiveNodeId={treeActiveNodeId}
          treeFinalized={treeFinalized}
          treeSwapHighlight={treeSwapHighlight}
          graphNodes={graphNodes}
          graphEdges={graphEdges}
          graphActiveNodeId={graphActiveNodeId}
          graphActiveEdgeId={graphActiveEdgeId}
          graphFinalized={graphFinalized}
          graphIndegrees={graphIndegrees}
          pulse={pulse}
          activeCell={activeCell}
          dayIndex={dayIndex}
          problemOpen={problemOpen}
          toggleTrigger={toggleTrigger}
          introLanded={introLanded}
          orbitEnabled={introLanded && !isToggling}
          onIntroLand={handleIntroLand}
          onBoardHit={handleBoardHit}
          onToggleDone={handleToggleDone}
          statusLabel={statusLabel}
          effect={effect}
          effectColor={effectColor}
          regionCells={regionCells}
          frontierCells={frontierCells}
          cameraCue={cameraCue}
          resultOverlay={resultOverlay}
          resultPassed={resultPassed}
          resultExplanation={resultExplanation}
          introTitle={introTitle}
        />

        <ProblemPanel problem={problem} visible={modalVisible} />

        <RunResultOverlay
          status={gameStatus}
          verdict={runResult?.verdict}
          message={runResult?.message}
          testsPassed={runResult?.testsPassed}
          testsTotal={runResult?.testsTotal}
          onDismiss={() => {
            setGameStatus("idle");
            setRunResult(null);
            setStatusMessage(null);
          }}
        />

        {introLanded && (
          <div className="farm-hud">
            <p className="farm-hud__title">{problem.title}</p>
            <div className="farm-hud__row">
              <span className="farm-key">P</span>
              <span>toggle problem</span>
            </div>
            <div className="farm-hud__row">
              <span>drag</span>
              <span>look around</span>
            </div>
          </div>
        )}

        <Link href="/select" className="farm-back-link">
          ← Worlds
        </Link>
      </div>

      <PythonEditor
        problem={problem}
        code={code}
        onChange={handleCodeChange}
        onRun={handleRun}
        onReset={handleReset}
        statusMessage={statusMessage}
        gameStatus={gameStatus}
        minute={dayIndex}
      />
    </div>
  );
}
