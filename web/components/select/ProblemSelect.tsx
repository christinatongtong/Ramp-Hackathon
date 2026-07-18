"use client";

import { Fredoka } from "next/font/google";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { PROBLEMS, type ProblemEntry } from "@/lib/problems/catalog";

const SelectScene = dynamic(
  () => import("./SelectScene").then((mod) => mod.SelectScene),
  { ssr: false, loading: () => <HubLoader /> },
);

const fredoka = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

function HubLoader() {
  return (
    <div className="select-root select-root--loading">
      <div className="select-loading-bounce" />
      <p>building the world map...</p>
    </div>
  );
}

function WorldRosterCard({
  problem,
  active,
}: {
  problem: ProblemEntry;
  active: boolean;
}) {
  return (
    <article
      className={`select-roster__card ${
        active ? "select-roster__card--near" : ""
      } ${problem.available ? "" : "select-roster__card--locked"}`}
      style={{ "--portal-color": problem.color } as CSSProperties}
    >
      <div className="select-roster__accent" />
      <div className="select-roster__body">
        <div className="select-roster__top">
          <span className="select-roster__number">#{problem.number}</span>
          <span
            className={`select-roster__badge ${
              problem.available
                ? "select-roster__badge--open"
                : "select-roster__badge--locked"
            }`}
          >
            {problem.available ? "Open" : "Locked"}
          </span>
        </div>
        <h3 className="select-roster__title">{problem.title}</h3>
        <p className="select-roster__theme">{problem.theme}</p>
      </div>
    </article>
  );
}

export function ProblemSelect() {
  const router = useRouter();
  const [transporting, setTransporting] = useState(false);
  const [target, setTarget] = useState<ProblemEntry | null>(null);
  const [nearbyProblem, setNearbyProblem] = useState<ProblemEntry | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  const handleEnter = useCallback(
    (problem: ProblemEntry) => {
      if (!problem.available || !problem.slug || transporting) return;
      setTarget(problem);
      setTransporting(true);
    },
    [transporting],
  );

  const handleTransportComplete = useCallback(() => {
    if (!target?.slug) return;
    setFadeOut(true);
    window.setTimeout(() => router.push(target.slug!), 700);
  }, [router, target]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "KeyY" || transporting || !nearbyProblem?.available) return;
      handleEnter(nearbyProblem);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleEnter, nearbyProblem, transporting]);

  return (
    <div className={`select-root ${fredoka.className}`}>
      <div className="select-vignette" aria-hidden />

      <SelectScene
        transporting={transporting}
        target={target}
        nearbyId={nearbyProblem?.id ?? null}
        onTransportComplete={handleTransportComplete}
        onProximityChange={setNearbyProblem}
      />

      <div
        className={`select-fade ${fadeOut ? "select-fade--out" : ""}`}
        aria-hidden
      />

      {!transporting && (
        <>
          <header className="select-header">
            <div className="select-header__pill">LeetCode 3D</div>
            <h1 className="select-header__title">Choose your world</h1>
            <p className="select-header__subtitle">
              Walk to a glowing portal and press{" "}
              <span className="select-key select-key--inline">Y</span> to enter
            </p>
          </header>

          <aside className="select-roster">
            <p className="select-roster__label">World roster</p>
            {PROBLEMS.map((problem) => (
              <WorldRosterCard
                key={problem.id}
                problem={problem}
                active={nearbyProblem?.id === problem.id}
              />
            ))}
          </aside>

          <div className="select-controls">
            <p className="select-controls__title">Controls</p>
            <div className="select-controls__row">
              <span className="select-key">WASD</span>
              <span>move around the hub</span>
            </div>
            <div className="select-controls__row">
              <span className="select-key">Y</span>
              <span>enter nearby portal</span>
            </div>
          </div>
        </>
      )}

      {nearbyProblem && !transporting && (
        <div
          className="select-prompt"
          style={{ "--portal-color": nearbyProblem.color } as CSSProperties}
        >
          <div className="select-prompt__accent" />
          {nearbyProblem.available ? (
            <>
              <p className="select-prompt__label">Portal detected</p>
              <h2 className="select-prompt__title">{nearbyProblem.title}</h2>
              <p className="select-prompt__theme">{nearbyProblem.theme}</p>
              <p className="select-prompt__action">
                Press <span className="select-key">Y</span> to warp in
              </p>
            </>
          ) : (
            <>
              <p className="select-prompt__label">Portal sealed</p>
              <h2 className="select-prompt__title">{nearbyProblem.title}</h2>
              <p className="select-prompt__theme">
                This world is still under construction. Try Rotting Oranges for now.
              </p>
            </>
          )}
        </div>
      )}

      {transporting && target && (
        <div className="select-transport">
          <div className="select-transport__ring" />
          <p className="select-transport__label">Entering world</p>
          <p className="select-transport__title">{target.title}</p>
        </div>
      )}
    </div>
  );
}
