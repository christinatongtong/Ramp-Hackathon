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
import { resolveEffect } from "@/lib/effects/registry";
import {
  compileIntroTimeline,
  compileTimeline,
  readGridFromState,
} from "@/lib/trace/compileTimeline";
import { ProblemPanel } from "@/components/game/ProblemPanel";
import { PythonEditor } from "@/components/game/PythonEditor";
import { RunResultOverlay } from "@/components/game/RunResultOverlay";
import { WorldRenderer } from "@/components/worlds/WorldRenderer";

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

export function AlgorithmGame({ problemId }: AlgorithmGameProps) {
  const { loading, error, problem, visualPlan, semanticSpec, initialState, submit } =
    useAnimationPackage(problemId);

  const [code, setCode] = useState("");
  const [grid, setGrid] = useState<Grid>(emptyGrid);
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

  useEffect(() => {
    if (!initialState) return;
    const initial = readGridFromState(initialState);
    if (initial) setGrid(initial);
    setGameStatus("idle");
  }, [initialState]);

  const playIntroActions = useCallback(async () => {
    if (!visualPlan || introPlayed.current) return;
    introPlayed.current = true;
    const intro = compileIntroTimeline(visualPlan);
    for (const step of intro) {
      if (step.action === "show_title") {
        setIntroTitle(step.text ?? visualPlan.world.theme);
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

  const restoreInitialGrid = useCallback(() => {
    const initial = initialState ? readGridFromState(initialState) : null;
    setGrid(initial ?? emptyGrid());
  }, [initialState]);

  const clearPlaybackState = () => {
    setDayIndex(null);
    setPulse(false);
    setActiveCell(null);
    setStatusLabel(null);
    setEffect(null);
    setEffectColor(null);
    setRegionCells(null);
    setFrontierCells(null);
    setCameraCue(null);
    setResultOverlay(false);
    setResultExplanation(null);
    setIntroTitle(null);
  };

  const handleReset = () => {
    animationEngine.cancel();
    restoreInitialGrid();
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
    restoreInitialGrid();

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
        <WorldRenderer
          visualPlan={visualPlan}
          semanticSpec={semanticSpec}
          grid={grid.length ? grid : [["0"]]}
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
