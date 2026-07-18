"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Character } from "@/components/shared/Character";
import { useAvatar } from "@/components/providers/AvatarProvider";

const START_HEIGHT = 22;
const GRAVITY = 22;
const VIEW_SPOT = new THREE.Vector3(0, 0, 4.6);
const BOARD_SPOT = new THREE.Vector3(3.6, 0, 0.8);

export type FarmPlayerPhase = "falling" | "landed" | "walk-to-board" | "interact" | "walk-back";

type FarmPlayerProps = {
  toggleTrigger: number;
  problemOpen: boolean;
  onIntroLand: () => void;
  onBoardHit: (open: boolean) => void;
  onToggleDone: () => void;
  onPhaseChange?: (phase: FarmPlayerPhase) => void;
};

export function FarmPlayer({
  toggleTrigger,
  problemOpen,
  onIntroLand,
  onBoardHit,
  onToggleDone,
  onPhaseChange,
}: FarmPlayerProps) {
  const { avatar } = useAvatar();
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const phase = useRef<FarmPlayerPhase>("falling");
  const velocity = useRef(0);
  const landTime = useRef(-1);
  const introLandFired = useRef(false);
  const lastToggleTrigger = useRef(0);
  const interactTime = useRef(0);
  const boardHitFired = useRef(false);
  const targetOpen = useRef(problemOpen);
  const walkProgress = useRef(0);
  const walkFrom = useRef(new THREE.Vector3());
  const walkTo = useRef(new THREE.Vector3());

  const desiredCam = useRef(new THREE.Vector3());
  const lookAtTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    targetOpen.current = problemOpen;
  }, [problemOpen]);

  useEffect(() => {
    if (toggleTrigger === 0 || toggleTrigger === lastToggleTrigger.current) return;
    if (phase.current !== "landed") return;
    lastToggleTrigger.current = toggleTrigger;
    targetOpen.current = !problemOpen;
    phase.current = "walk-to-board";
    walkProgress.current = 0;
    walkFrom.current.copy(playerRef.current?.position ?? VIEW_SPOT);
    walkTo.current.copy(BOARD_SPOT);
    onPhaseChange?.("walk-to-board");
  }, [toggleTrigger, problemOpen, onPhaseChange]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 45);
    const player = playerRef.current;
    const body = bodyRef.current;
    if (!player || !body) return;

    if (phase.current === "falling") {
      velocity.current += GRAVITY * dt;
      player.position.y -= velocity.current * dt;
      player.rotation.x += dt * 3.2;
      player.rotation.z += dt * 2;
      player.rotation.y += dt * 0.6;

      if (player.position.y <= 0) {
        player.position.y = 0;
        player.position.x = VIEW_SPOT.x;
        player.position.z = VIEW_SPOT.z;
        player.rotation.set(0, Math.PI, 0);
        landTime.current = 0;
        body.scale.set(1.35, 0.5, 1.35);
        phase.current = "landed";

        if (!introLandFired.current) {
          introLandFired.current = true;
          onIntroLand();
        }
      }
    }

    if (landTime.current >= 0 && landTime.current < 0.45) {
      landTime.current += dt;
      const recover = Math.min(1, landTime.current / 0.4);
      body.scale.set(
        THREE.MathUtils.lerp(1.35, 1, recover),
        THREE.MathUtils.lerp(0.5, 1, recover),
        THREE.MathUtils.lerp(1.35, 1, recover),
      );
    }

    if (phase.current === "walk-to-board" || phase.current === "walk-back") {
      walkProgress.current = Math.min(1, walkProgress.current + dt * 1.1);
      const t = 1 - (1 - walkProgress.current) ** 3;
      player.position.lerpVectors(walkFrom.current, walkTo.current, t);
      player.rotation.y = Math.atan2(
        walkTo.current.x - player.position.x,
        walkTo.current.z - player.position.z,
      );

      if (walkProgress.current >= 1) {
        if (phase.current === "walk-to-board") {
          phase.current = "interact";
          interactTime.current = 0;
          boardHitFired.current = false;
          onPhaseChange?.("interact");
        } else {
          phase.current = "landed";
          player.rotation.y = Math.PI;
          onPhaseChange?.("landed");
        }
        walkProgress.current = 0;
      }
    }

    if (phase.current === "interact") {
      interactTime.current += dt;
      const t = interactTime.current;

      player.rotation.y = Math.PI / 2;
      body.position.z = Math.sin(t * 12) * 0.08;
      body.rotation.x = -0.25 + Math.sin(t * 10) * 0.12;

      if (!boardHitFired.current && t >= 0.28) {
        boardHitFired.current = true;
        onBoardHit(targetOpen.current);
      }

      if (t >= 0.55) {
        onToggleDone();
        body.position.z = 0;
        body.rotation.x = 0;
        phase.current = "walk-back";
        walkFrom.current.copy(player.position);
        walkTo.current.copy(VIEW_SPOT);
        walkProgress.current = 0;
        onPhaseChange?.("walk-back");
      }
    }

    if (phase.current === "falling") {
      desiredCam.current.set(
        player.position.x + 3.5,
        player.position.y + 6,
        player.position.z + 10,
      );
      camera.position.lerp(desiredCam.current, 1 - Math.exp(-4 * dt));
      lookAtTarget.current.set(0, 0.8, -0.5);
      camera.lookAt(lookAtTarget.current);
    }
  });

  return (
    <group ref={playerRef} position={[VIEW_SPOT.x, START_HEIGHT, VIEW_SPOT.z]}>
      <group ref={bodyRef}>
        <Character avatar={avatar} />
      </group>
    </group>
  );
}
