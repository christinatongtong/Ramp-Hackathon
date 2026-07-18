"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { DEFAULT_CELL_SIZE } from "@/components/entities/renderers/types";

type CameraControllerProps = {
  cue: string | null | undefined;
  activeCell: { row: number; col: number } | null;
  gridRows: number;
  gridCols: number;
  homePosition: [number, number, number];
  homeTarget: [number, number, number];
  enabled?: boolean;
};

function cellFocusPoint(
  row: number,
  col: number,
  rows: number,
  cols: number,
): THREE.Vector3 {
  const originX = -((cols - 1) * DEFAULT_CELL_SIZE) / 2;
  const originZ = -((rows - 1) * DEFAULT_CELL_SIZE) / 2;
  return new THREE.Vector3(
    originX + col * DEFAULT_CELL_SIZE,
    0.6,
    originZ + row * DEFAULT_CELL_SIZE - 1,
  );
}

export function CameraController({
  cue,
  activeCell,
  gridRows,
  gridCols,
  homePosition,
  homeTarget,
  enabled = true,
}: CameraControllerProps) {
  const { camera } = useThree();
  const mode = useRef<"idle" | "focus" | "shake" | "wide" | "reset">("idle");
  const timer = useRef(0);
  const shakeAmp = useRef(0);
  const focusPoint = useRef(new THREE.Vector3(...homeTarget));
  const desiredPos = useRef(new THREE.Vector3(...homePosition));

  useEffect(() => {
    if (!enabled || !cue || cue === "none") {
      mode.current = "idle";
      return;
    }
    timer.current = 0;
    if (cue === "brief_focus" && activeCell && gridRows > 0) {
      mode.current = "focus";
      focusPoint.current = cellFocusPoint(
        activeCell.row,
        activeCell.col,
        gridRows,
        gridCols,
      );
      desiredPos.current.set(
        focusPoint.current.x + 2.5,
        focusPoint.current.y + 5.5,
        focusPoint.current.z + 6,
      );
    } else if (cue === "shake") {
      mode.current = "shake";
      shakeAmp.current = 0.18;
    } else if (cue === "wide") {
      mode.current = "wide";
      desiredPos.current.set(homePosition[0] * 1.25, homePosition[1] * 1.2, homePosition[2] * 1.25);
    } else if (cue === "follow" && activeCell) {
      mode.current = "focus";
      focusPoint.current = cellFocusPoint(
        activeCell.row,
        activeCell.col,
        gridRows,
        gridCols,
      );
      desiredPos.current.set(
        focusPoint.current.x + 3,
        homePosition[1],
        focusPoint.current.z + 8,
      );
    } else if (cue === "reset") {
      mode.current = "reset";
      desiredPos.current.set(...homePosition);
      focusPoint.current.set(...homeTarget);
    }
  }, [cue, activeCell, gridRows, gridCols, homePosition, homeTarget, enabled]);

  useFrame((_, delta) => {
    if (!enabled) return;
    timer.current += delta;

    if (mode.current === "shake") {
      camera.position.x += (Math.random() - 0.5) * shakeAmp.current;
      camera.position.y += (Math.random() - 0.5) * shakeAmp.current * 0.5;
      shakeAmp.current *= 0.9;
      if (shakeAmp.current < 0.01 || timer.current > 0.45) {
        mode.current = "reset";
      }
      return;
    }

    if (mode.current === "focus" || mode.current === "wide" || mode.current === "reset") {
      camera.position.lerp(desiredPos.current, 1 - Math.pow(0.001, delta));
      const look = focusPoint.current;
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      // Soft look-at via position only; OrbitControls owns target after cue ends.
      if (mode.current === "focus" && timer.current > 0.85) {
        mode.current = "reset";
        desiredPos.current.set(...homePosition);
        focusPoint.current.set(...homeTarget);
        timer.current = 0;
      }
      if (mode.current === "reset" && timer.current > 0.9) {
        mode.current = "idle";
      }
      if (mode.current === "wide" && timer.current > 1.1) {
        mode.current = "reset";
        desiredPos.current.set(...homePosition);
        timer.current = 0;
      }
      void look;
    }
  });

  return null;
}
