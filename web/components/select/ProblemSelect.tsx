"use client";

import { Fredoka } from "next/font/google";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import useSWR, { mutate } from "swr";
import {
  PROBLEMS_KEY,
  buildProblem,
  listProblems,
} from "@/lib/api/client";
import { toProblemEntries, type ProblemEntry } from "@/lib/problems/catalog";

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
  const {
    data: summaries,
    error,
    isLoading,
  } = useSWR(PROBLEMS_KEY, listProblems, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const problems = summaries ? toProblemEntries(summaries) : [];
  const loadError =
    error instanceof Error ? error.message : error ? "Failed to load problems" : null;

  const [transporting, setTransporting] = useState(false);
  const [target, setTarget] = useState<ProblemEntry | null>(null);
  const [nearbyProblem, setNearbyProblem] = useState<ProblemEntry | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [buildMessage, setBuildMessage] = useState<string | null>(null);

  const refreshProblems = useCallback(async () => {
    await mutate(PROBLEMS_KEY);
    router.refresh();
  }, [router]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshProblems();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshProblems]);

  const handleBuild = useCallback(
    async (problem: ProblemEntry) => {
      if (buildingId) return;
      setBuildingId(problem.id);
      setBuildMessage(`Building ${problem.title}…`);
      try {
        const result = await buildProblem(problem.id, { style: "derpy" });
        await mutate(PROBLEMS_KEY);
        router.refresh();
        if (result.status === "published") {
          setBuildMessage(`${problem.title} published — portal unlocked`);
        } else {
          setBuildMessage(
            result.errors.join("; ") || `Build failed for ${problem.title}`,
          );
        }
      } catch (err) {
        setBuildMessage(
          err instanceof Error ? err.message : "Build request failed",
        );
      } finally {
        setBuildingId(null);
      }
    },
    [buildingId, router],
  );

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
      if (event.code !== "KeyY" || transporting || !nearbyProblem?.available)
        return;
      handleEnter(nearbyProblem);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleEnter, nearbyProblem, transporting]);

  if (loadError) {
    return (
      <div className={`select-root ${fredoka.className}`}>
        <div className="select-root select-root--loading">
          <p>Could not reach the backend</p>
          <p style={{ opacity: 0.7, fontSize: 14 }}>{loadError}</p>
          <p style={{ opacity: 0.7, fontSize: 13 }}>
            Start the API on localhost:8000
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || problems.length === 0) {
    return <HubLoader />;
  }

  return (
    <div className={`select-root ${fredoka.className}`}>
      <div className="select-vignette" aria-hidden />

      <SelectScene
        problems={problems}
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
            {problems.map((problem) => (
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
                Build this world with one GPT call to unlock the portal.
              </p>
              <button
                type="button"
                className="select-prompt__action"
                style={{
                  marginTop: 12,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: nearbyProblem.color,
                  color: "#0f172a",
                  fontWeight: 700,
                  cursor: buildingId ? "wait" : "pointer",
                }}
                disabled={Boolean(buildingId)}
                onClick={() => void handleBuild(nearbyProblem)}
              >
                {buildingId === nearbyProblem.id
                  ? "Building…"
                  : "Build & publish"}
              </button>
            </>
          )}
        </div>
      )}

      {buildMessage && !transporting && (
        <p
          style={{
            position: "fixed",
            left: 24,
            bottom: 24,
            zIndex: 20,
            maxWidth: 360,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(15,23,42,0.85)",
            color: "#f8fafc",
            fontSize: 13,
          }}
        >
          {buildMessage}
        </p>
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
