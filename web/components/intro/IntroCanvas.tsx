"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Character } from "@/components/shared/Character";
import { useAvatar } from "@/components/providers/AvatarProvider";

export type IntroPhase = "loading" | "falling" | "landed";

type IntroCanvasProps = {
  phase: IntroPhase;
  emoteTrigger: number;
  onReady: () => void;
  onLand: () => void;
};

const START_HEIGHT = 32;
const GRAVITY = 24;
const MOVE_SPEED = 3.8;
const MOVE_RADIUS = 2.6;

function SceneReady({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);

  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    requestAnimationFrame(() => onReady());
  });

  return null;
}

function FlailingArm({ side, skinColor }: { side: 1 | -1; skinColor: string }) {
  const armRef = useRef<THREE.Mesh>(null);
  const wiggleOffset = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (!armRef.current) return;
    const t = clock.elapsedTime + wiggleOffset.current;
    armRef.current.rotation.z = side * (1.1 + Math.sin(t * 16) * 0.7);
  });

  return (
    <mesh ref={armRef} position={[side * 0.42, 1.05, 0]} rotation={[0, 0, side * 0.5]}>
      <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
      <meshStandardMaterial color={skinColor} />
    </mesh>
  );
}

function EmoteArms({
  activeRef,
  skinColor,
}: {
  activeRef: React.RefObject<boolean>;
  skinColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.visible = activeRef.current;

    if (!activeRef.current) return;
    const wave = Math.sin(clock.elapsedTime * 14);
    if (leftRef.current) leftRef.current.rotation.z = -2.4 + wave * 0.35;
    if (rightRef.current) rightRef.current.rotation.z = 2.4 - wave * 0.35;
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={leftRef} position={[-0.42, 1.05, 0]} rotation={[0, 0, -2.4]}>
        <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh ref={rightRef} position={[0.42, 1.05, 0]} rotation={[0, 0, 2.4]}>
        <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
    </group>
  );
}

function ImpactPoof({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group ref={groupRef} visible={false} position={[0, 0.15, 0]}>
      {Array.from({ length: 6 }).map((_, index) => (
        <mesh
          key={index}
          position={[
            Math.cos((index / 6) * Math.PI * 2) * 0.35,
            0.08,
            Math.sin((index / 6) * Math.PI * 2) * 0.35,
          ]}
        >
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#c4a574" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

function GoofyCloud({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1.2, 10, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-1, -0.2, 0]}>
        <sphereGeometry args={[0.8, 10, 10]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[1, -0.15, 0.2]}>
        <sphereGeometry args={[0.9, 10, 10]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>
    </group>
  );
}

function FallController({
  phase,
  emoteTrigger,
  onLand,
}: {
  phase: IntroPhase;
  emoteTrigger: number;
  onLand: () => void;
}) {
  const { avatar } = useAvatar();
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const poofRef = useRef<THREE.Group>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  const velocity = useRef(0);
  const landTime = useRef(-1);
  const shake = useRef(0);
  const landCallbackFired = useRef(false);
  const emoteTime = useRef(-1);
  const facingCamera = useRef(false);
  const lastEmoteTrigger = useRef(0);
  const isEmotingRef = useRef(false);
  const faceCameraY = useRef(0);

  const desiredCam = useRef(new THREE.Vector3());
  const lookAtTarget = useRef(new THREE.Vector3());
  const baseLookAt = useRef(new THREE.Vector3());
  const moveDir = useRef(new THREE.Vector3());

  useEffect(() => {
    if (phase === "falling") {
      velocity.current = 0;
      landTime.current = -1;
      shake.current = 0;
      landCallbackFired.current = false;
      facingCamera.current = false;
      emoteTime.current = -1;

      if (playerRef.current) {
        playerRef.current.position.set(0, START_HEIGHT, 0);
        playerRef.current.rotation.set(0, 0, 0);
      }
      if (bodyRef.current) {
        bodyRef.current.scale.set(1, 1, 1);
      }
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "landed") return;

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.code] = true;
      if (event.code === "KeyE") {
        emoteTime.current = 0;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [phase]);

  useEffect(() => {
    if (emoteTrigger > 0 && emoteTrigger !== lastEmoteTrigger.current && phase === "landed") {
      lastEmoteTrigger.current = emoteTrigger;
      emoteTime.current = 0;
    }
  }, [emoteTrigger, phase]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 45);
    const player = playerRef.current;
    const body = bodyRef.current;
    if (!player || !body) return;

    const keys = keysRef.current;
    const isEmoting = emoteTime.current >= 0 && emoteTime.current < 1;
    isEmotingRef.current = isEmoting;

    if (phase === "loading") {
      camera.position.set(4.5, START_HEIGHT + 5.5, 12);
      camera.lookAt(0, START_HEIGHT + 1.3, 0);
      return;
    }

    if (phase === "falling") {
      velocity.current += GRAVITY * dt;
      player.position.y -= velocity.current * dt;
      player.rotation.x += dt * 3.5;
      player.rotation.z += dt * 2.2;
      player.rotation.y += dt * 0.8;

      if (player.position.y <= 0) {
        player.position.y = 0;
        player.rotation.x = 0;
        player.rotation.z = 0;
        landTime.current = 0;
        shake.current = 1;
        body.scale.set(1.4, 0.5, 1.4);

        if (!landCallbackFired.current) {
          landCallbackFired.current = true;
          onLand();
        }
      }
    }

    if (landTime.current >= 0) {
      landTime.current += dt;
      const recover = Math.min(1, landTime.current / 0.4);
      body.scale.set(
        THREE.MathUtils.lerp(1.4, 1, recover),
        THREE.MathUtils.lerp(0.5, 1, recover),
        THREE.MathUtils.lerp(1.4, 1, recover),
      );

      if (phase === "landed" && landTime.current < 1.2 && !isEmoting) {
        const damp = Math.max(0, 1 - landTime.current);
        player.rotation.x = Math.sin(landTime.current * 16) * 0.07 * damp;
        player.rotation.z = Math.sin(landTime.current * 13) * 0.05 * damp;
      }
    }

    if (phase === "landed" && landTime.current >= 1.2 && !facingCamera.current && !isEmoting) {
      facingCamera.current = true;
      player.rotation.x = 0;
      player.rotation.z = 0;
      const dx = camera.position.x - player.position.x;
      const dz = camera.position.z - player.position.z;
      faceCameraY.current = Math.atan2(dx, dz);
      player.rotation.y = faceCameraY.current;
    }

    if (phase === "landed" && landTime.current >= 1.2) {
      if (isEmoting) {
        emoteTime.current += dt;
        const t = emoteTime.current;
        player.position.y = Math.sin(Math.min(t / 0.45, 1) * Math.PI) * 0.55;
        player.rotation.y += dt * 6;

        if (t >= 1) {
          emoteTime.current = -1;
          player.position.y = 0;
          player.rotation.y = faceCameraY.current;
        }
      } else {
        moveDir.current.set(0, 0, 0);
        if (keys.KeyW || keys.ArrowUp) moveDir.current.z -= 1;
        if (keys.KeyS || keys.ArrowDown) moveDir.current.z += 1;
        if (keys.KeyA || keys.ArrowLeft) moveDir.current.x -= 1;
        if (keys.KeyD || keys.ArrowRight) moveDir.current.x += 1;

        if (moveDir.current.lengthSq() > 0) {
          moveDir.current.normalize().multiplyScalar(MOVE_SPEED * dt);
          player.position.x += moveDir.current.x;
          player.position.z += moveDir.current.z;

          const dist = Math.hypot(player.position.x, player.position.z);
          if (dist > MOVE_RADIUS) {
            const scale = MOVE_RADIUS / dist;
            player.position.x *= scale;
            player.position.z *= scale;
          }

          player.rotation.y = Math.atan2(moveDir.current.x, moveDir.current.z);
        } else if (facingCamera.current) {
          const dx = camera.position.x - player.position.x;
          const dz = camera.position.z - player.position.z;
          faceCameraY.current = Math.atan2(dx, dz);
          player.rotation.y = THREE.MathUtils.lerp(
            player.rotation.y,
            faceCameraY.current,
            1 - Math.exp(-8 * dt),
          );
        }
      }
    }

    if (shake.current > 0.01) {
      shake.current *= 0.82;
    } else {
      shake.current = 0;
    }

    desiredCam.current.set(
      player.position.x + 4.5,
      player.position.y + 5.5,
      player.position.z + 12,
    );
    camera.position.lerp(desiredCam.current, 1 - Math.exp(-5 * dt));

    baseLookAt.current.set(player.position.x, player.position.y + 1.3, player.position.z);
    lookAtTarget.current.copy(baseLookAt.current);

    if (shake.current > 0) {
      lookAtTarget.current.x += (Math.random() - 0.5) * shake.current * 0.35;
      lookAtTarget.current.y += (Math.random() - 0.5) * shake.current * 0.25;
      camera.position.x += (Math.random() - 0.5) * shake.current * 0.18;
      camera.position.y += (Math.random() - 0.5) * shake.current * 0.12;
    }

    camera.lookAt(lookAtTarget.current);

    const poof = poofRef.current;
    if (poof) {
      if (landTime.current < 0 || landTime.current > 0.8) {
        poof.visible = false;
      } else {
        poof.visible = true;
        const age = landTime.current;
        poof.children.forEach((child, index) => {
          const mesh = child as THREE.Mesh;
          const scale = 0.15 + age * (1.4 + index * 0.12);
          mesh.scale.setScalar(scale);
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.opacity = Math.max(0, 0.75 - age * 1.1);
        });
      }
    }
  });

  const showFlail = phase === "falling";

  return (
    <>
      <group ref={playerRef} position={[0, START_HEIGHT, 0]}>
        <group ref={bodyRef}>
          <Character avatar={avatar} />
          {showFlail && (
            <>
              <FlailingArm side={1} skinColor={avatar.skinColor} />
              <FlailingArm side={-1} skinColor={avatar.skinColor} />
            </>
          )}
          {phase === "landed" && (
            <EmoteArms activeRef={isEmotingRef} skinColor={avatar.skinColor} />
          )}
        </group>
      </group>
      <ImpactPoof groupRef={poofRef} />
    </>
  );
}

function IntroWorld({ phase, emoteTrigger, onReady, onLand }: IntroCanvasProps) {
  return (
    <>
      <SceneReady onReady={onReady} />
      <color attach="background" args={["#7ecbff"]} />
      <fog attach="fog" args={["#7ecbff", 20, 58]} />
      <ambientLight intensity={0.95} />
      <directionalLight intensity={1.1} position={[5, 12, 6]} castShadow />

      <GoofyCloud position={[-6, 14, -8]} scale={1.4} />
      <GoofyCloud position={[7, 18, -10]} scale={1.8} />
      <GoofyCloud position={[0, 22, -12]} scale={2} />
      <GoofyCloud position={[-3, 26, -6]} scale={1.2} />
      <GoofyCloud position={[5, 28, -9]} scale={1.5} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#6fcf4a" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#5bb83a" />
      </mesh>

      <FallController phase={phase} emoteTrigger={emoteTrigger} onLand={onLand} />
    </>
  );
}

export function IntroCanvas({ phase, emoteTrigger, onReady, onLand }: IntroCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [4.5, START_HEIGHT + 5.5, 12], fov: 50, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <IntroWorld
          phase={phase}
          emoteTrigger={emoteTrigger}
          onReady={onReady}
          onLand={onLand}
        />
      </Suspense>
    </Canvas>
  );
}
