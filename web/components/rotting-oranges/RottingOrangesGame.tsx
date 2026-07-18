"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Fredoka } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimationEngine } from "@/lib/animation-engine/AnimationEngine";
import { CodePanel } from "@/components/rotting-oranges/CodePanel";
import { GodScolding } from "@/components/rotting-oranges/GodScolding";
import { ProblemModal } from "@/components/rotting-oranges/ProblemModal";
import { DEFAULT_CODE } from "@/lib/rotting-oranges/defaultCode";
import { executeSolution } from "@/lib/rotting-oranges/executeSolution";
import { DEFAULT_GRID } from "@/lib/rotting-oranges/simulation";
import type { Grid } from "@/lib/rotting-oranges/types";
import { readGridFromStep, scriptSummary } from "@/problems/rotting-oranges/manifest";
import { rottingOrangesToSceneScript } from "@/problems/rotting-oranges/toSceneScript";

const FarmScene = dynamic(
  () =>
    import("@/components/rotting-oranges/FarmScene").then((mod) => mod.FarmScene),
  { ssr: false, loading: () => <SceneLoader /> },
);

const fredoka = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });
const animationEngine = new AnimationEngine();

function SceneLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-[#7ecbff] text-slate-800">
      Loading grove…
    </div>
  );
}

export function RottingOrangesGame() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [grid, setGrid] = useState<Grid>(DEFAULT_GRID);
  const [status, setStatus] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [pulseRotten, setPulseRotten] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [godMessage, setGodMessage] = useState<string | null>(null);
  const [godSubtitle, setGodSubtitle] = useState<string | undefined>();
  const [problemOpen, setProblemOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [introLanded, setIntroLanded] = useState(false);
  const [toggleTrigger, setToggleTrigger] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const autoOpenDone = useRef(false);

  useEffect(() => () => animationEngine.cancel(), []);

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
    if (!autoOpenDone.current) {
      autoOpenDone.current = true;
      window.setTimeout(() => {
        setIsToggling(true);
        setToggleTrigger((count) => count + 1);
      }, 800);
    }
  }, []);

  const handleBoardHit = useCallback((open: boolean) => {
    setProblemOpen(open);
    setModalVisible(open);
  }, []);

  const handleToggleDone = useCallback(() => {
    setIsToggling(false);
  }, []);

  const handleReset = () => {
    animationEngine.cancel();
    setGrid(DEFAULT_GRID);
    setDayIndex(null);
    setPulseRotten(false);
    setIsRunning(false);
    setStatus(null);
    setGodMessage(null);
  };

  const handleRun = async () => {
    animationEngine.cancel();
    setIsRunning(true);
    setPulseRotten(false);
    setDayIndex(0);
    setGrid(DEFAULT_GRID);

    const validation = executeSolution(code, DEFAULT_GRID);
    if (!validation.ok) {
      setIsRunning(false);
      setStatus(`✗ ${validation.error}`);
      setGodSubtitle(validation.error);
      setGodMessage(validation.scoldMessage);
      return;
    }

    let script = rottingOrangesToSceneScript({ grid: DEFAULT_GRID, verdict: "correct" });

    try {
      const response = await fetch("/api/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: "rotting-oranges",
          code,
          input: { grid: DEFAULT_GRID },
          referenceScript: script,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as { script: typeof script };
        script = data.script;
      }
    } catch {
      /* use local reference script */
    }

    setStatus(`Playing ${script.steps.length - 1} day(s)…`);

    animationEngine.play(script, {
      msPerStep: 900,
      onStep: (step, index) => {
        const stepGrid = readGridFromStep(step);
        if (stepGrid) setGrid(stepGrid as Grid);
        setDayIndex(step.day);
        setPulseRotten(index > 0);
      },
      onComplete: (finished) => {
        setIsRunning(false);
        setStatus(`✓ ${scriptSummary(finished)}`);
      },
    });
  };

  return (
    <div className={`farm-layout ${fredoka.className}`}>
      <div className="farm-layout__world">
        <FarmScene
          grid={grid}
          pulseRotten={pulseRotten}
          minute={dayIndex}
          dayIndex={dayIndex}
          problemOpen={problemOpen}
          toggleTrigger={toggleTrigger}
          introLanded={introLanded}
          orbitEnabled={introLanded && !isToggling}
          onIntroLand={handleIntroLand}
          onBoardHit={handleBoardHit}
          onToggleDone={handleToggleDone}
        />

        <ProblemModal visible={modalVisible} />

        {introLanded && (
          <div className="farm-hud">
            <p className="farm-hud__title">Rotting Oranges Farm</p>
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

      <CodePanel
        code={code}
        onChange={setCode}
        onRun={handleRun}
        onReset={handleReset}
        status={status}
        isRunning={isRunning}
        minute={dayIndex}
      />

      {godMessage && (
        <GodScolding
          message={godMessage}
          subtitle={godSubtitle}
          onDismiss={() => {
            setGodMessage(null);
            setGodSubtitle(undefined);
          }}
        />
      )}
    </div>
  );
}
