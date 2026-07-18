import type { AnimationStep, SceneScript } from "./types";

export type StepListener = (step: AnimationStep, index: number, total: number) => void;

export type PlayOptions = {
  msPerStep?: number;
  onStep?: StepListener;
  onComplete?: (script: SceneScript) => void;
  onError?: (error: Error) => void;
};

/**
 * Problem-agnostic timeline player. Worlds register a renderer that reads
 * step.state; this class only handles pacing and lifecycle.
 */
export class AnimationEngine {
  private timers: number[] = [];

  cancel() {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
  }

  play(script: SceneScript, options: PlayOptions = {}) {
    this.cancel();
    const { msPerStep = 900, onStep, onComplete } = options;

    if (script.steps.length === 0) {
      onComplete?.(script);
      return;
    }

    let delay = 0;
    script.steps.forEach((step, index) => {
      const duration = step.durationMs ?? msPerStep;
      const timer = window.setTimeout(() => {
        onStep?.(step, index, script.steps.length);
        if (index === script.steps.length - 1) {
          onComplete?.(script);
        }
      }, delay);
      this.timers.push(timer);
      delay += duration;
    });
  }
}
