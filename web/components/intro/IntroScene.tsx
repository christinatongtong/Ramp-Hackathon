"use client";

import dynamic from "next/dynamic";
import { Fredoka } from "next/font/google";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { IntroPhase } from "./IntroCanvas";
import { AvatarPicker } from "./AvatarPicker";

const IntroCanvas = dynamic(
  () => import("./IntroCanvas").then((mod) => mod.IntroCanvas),
  { ssr: false },
);

const fredoka = Fredoka({ subsets: ["latin"], weight: ["600", "700"] });

export function IntroScene() {
  const router = useRouter();
  const [phase, setPhase] = useState<IntroPhase>("loading");
  const [showTitle, setShowTitle] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [oof, setOof] = useState(false);
  const [emoteTrigger, setEmoteTrigger] = useState(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const handleReady = useCallback(() => {
    schedule(() => setPhase("falling"), 400);
  }, [schedule]);

  const handleLand = useCallback(() => {
    setPhase("landed");
    setOof(true);
    schedule(() => setOof(false), 900);
    schedule(() => setShowTitle(true), 600);
    schedule(() => setShowButton(true), 1100);
  }, [schedule]);

  return (
    <div className={`intro-derp ${fredoka.className}`}>
      <div className={`intro-derp__canvas ${phase !== "loading" ? "intro-derp__canvas--visible" : ""}`}>
        <IntroCanvas
          phase={phase}
          emoteTrigger={emoteTrigger}
          onReady={handleReady}
          onLand={handleLand}
        />
      </div>

      {phase === "loading" && (
        <div className="intro-derp__loading">
          <div className="intro-derp__loading-bounce" />
          <p>summoning the fall guy...</p>
        </div>
      )}

      {oof && <div className="intro-derp__oof">OOF</div>}

      {phase === "landed" && (
        <>
          <AvatarPicker visible={phase === "landed"} />
          <div className="intro-derp__controls">
          <p className="intro-derp__controls-title">He&apos;s alive!</p>
          <div className="intro-derp__controls-row">
            <span className="intro-derp__key">WASD</span>
            <span>move</span>
          </div>
          <div className="intro-derp__controls-row">
            <span className="intro-derp__key">E</span>
            <span>emote</span>
          </div>
          <button
            type="button"
            className="intro-derp__emote-btn"
            onClick={() => setEmoteTrigger((count) => count + 1)}
          >
            Emote
          </button>
        </div>
        </>
      )}

      <div className={`intro-derp__title-wrap ${showTitle ? "intro-derp__title-wrap--in" : ""}`}>
        <h1 className="intro-derp__title">
          Leetcode
          <span className="intro-derp__title-3d">3D</span>
        </h1>
      </div>

      {showButton && (
        <button
          type="button"
          className="intro-derp__begin"
          onClick={() => {
            clearTimers();
            router.push("/select");
          }}
        >
          Begin
        </button>
      )}
    </div>
  );
}
