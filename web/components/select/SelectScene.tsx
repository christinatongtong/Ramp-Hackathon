"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Character } from "@/components/shared/Character";
import { useAvatar } from "@/components/providers/AvatarProvider";
import { PROBLEMS, type ProblemEntry } from "@/lib/problems/catalog";

const MOVE_SPEED = 4;
const PLATFORM_RADIUS = 8;
const ENTER_RADIUS = 2.3;

type SelectSceneProps = {
  transporting: boolean;
  target: ProblemEntry | null;
  nearbyId: string | null;
  onTransportComplete: () => void;
  onProximityChange: (problem: ProblemEntry | null) => void;
};

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

function HubPlatform() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.04, 0]}>
        <circleGeometry args={[PLATFORM_RADIUS + 1.2, 64]} />
        <meshStandardMaterial color="#5bb83a" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
        <circleGeometry args={[PLATFORM_RADIUS, 64]} />
        <meshStandardMaterial color="#6fcf4a" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[PLATFORM_RADIUS - 0.35, PLATFORM_RADIUS, 64]} />
        <meshStandardMaterial color="#4da636" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[2.2, 2.45, 48]} />
        <meshStandardMaterial color="#ffd93d" emissive="#ffd93d" emissiveIntensity={0.15} />
      </mesh>

      {PROBLEMS.map((problem) => {
        const angle = Math.atan2(problem.position[0], problem.position[2]);
        const dist = Math.hypot(problem.position[0], problem.position[2]) * 0.55;
        return (
          <mesh
            key={`path-${problem.id}`}
            rotation={[-Math.PI / 2, 0, angle]}
            position={[Math.sin(angle) * dist, 0.012, Math.cos(angle) * dist]}
          >
            <planeGeometry args={[0.35, dist * 2]} />
            <meshStandardMaterial
              color={problem.available ? "#ffe08a" : "#cbd5e1"}
              transparent
              opacity={0.55}
            />
          </mesh>
        );
      })}
    </>
  );
}

function WorldPortal({
  problem,
  highlighted,
}: {
  problem: ProblemEntry;
  highlighted: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const bobRef = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + bobRef.current;
    if (ringRef.current) {
      ringRef.current.rotation.z = t * (highlighted ? 1.4 : 0.5);
      ringRef.current.position.y = 0.85 + Math.sin(t * 2) * 0.06;
    }
    if (glowRef.current) {
      const pulse = highlighted ? 0.55 + Math.sin(t * 4) * 0.15 : 0.2;
      glowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = problem.available ? pulse : 0.05;
    }
  });

  return (
    <group position={problem.position}>
      <mesh position={[0, -0.35, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.4, 0.55, 24]} />
        <meshStandardMaterial color={problem.available ? "#ffd93d" : "#94a3b8"} />
      </mesh>

      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.95, 1.05, 0.08, 24]} />
        <meshStandardMaterial
          color={problem.color}
          emissive={problem.color}
          emissiveIntensity={highlighted ? 0.45 : 0.15}
        />
      </mesh>

      <mesh ref={glowRef} position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial
          color={problem.color}
          emissive={problem.color}
          emissiveIntensity={problem.available ? 0.35 : 0.05}
          transparent
          opacity={problem.available ? 0.75 : 0.35}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.85, 0]}>
        <torusGeometry args={[1.05, 0.14, 16, 48]} />
        <meshStandardMaterial
          color={problem.color}
          emissive={problem.color}
          emissiveIntensity={problem.available ? (highlighted ? 0.7 : 0.35) : 0.08}
          transparent
          opacity={problem.available ? 1 : 0.45}
        />
      </mesh>

      {highlighted && problem.available && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
          <ringGeometry args={[1.25, 1.45, 48]} />
          <meshStandardMaterial
            color={problem.color}
            emissive={problem.color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.45}
          />
        </mesh>
      )}

      <Text
        position={[0, 2.15, 0]}
        fontSize={0.24}
        color={problem.available ? "#ffffff" : "#cbd5e1"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#333333"
        maxWidth={3.2}
        textAlign="center"
      >
        {`${problem.number}. ${problem.title}`}
      </Text>

      {!problem.available && (
        <Text position={[0, 1.65, 0]} fontSize={0.16} color="#64748b" anchorX="center">
          Locked
        </Text>
      )}
    </group>
  );
}

function WarpTunnel({ active, color, position }: { active: boolean; color: string; position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    ref.current.rotation.y = clock.elapsedTime * 2.5;
  });

  if (!active) return null;

  return (
    <group ref={ref} position={position}>
      {Array.from({ length: 5 }).map((_, index) => (
        <mesh key={index} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.8 + index * 0.3, 0.05, 8, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.55}
            transparent
            opacity={0.75 - index * 0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function HubPlayer({
  transporting,
  target,
  nearbyId,
  onProximityChange,
  onTransportComplete,
}: Omit<SelectSceneProps, "nearbyId"> & { nearbyId: string | null }) {
  const { avatar } = useAvatar();
  const { camera } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastNearbyId = useRef<string | null>(null);

  const warpProgress = useRef(0);
  const warping = useRef(false);
  const warpComplete = useRef(false);

  const desiredCam = useRef(new THREE.Vector3());
  const lookAtTarget = useRef(new THREE.Vector3());
  const moveDir = useRef(new THREE.Vector3());

  useEffect(() => {
    if (transporting) return;

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.code] = true;
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
  }, [transporting]);

  useEffect(() => {
    if (transporting && target) {
      warping.current = true;
      warpProgress.current = 0;
      warpComplete.current = false;
    } else {
      warping.current = false;
    }
  }, [transporting, target]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 45);
    const player = playerRef.current;
    if (!player) return;

    if (warping.current && target) {
      warpProgress.current = Math.min(1, warpProgress.current + dt * 0.85);
      const t = warpProgress.current;
      player.position.y = t * 2.2;
      player.rotation.y += dt * 5;
      const scale = 1 - t * 0.3;
      player.scale.setScalar(scale);

      if (t >= 1 && !warpComplete.current) {
        warpComplete.current = true;
        window.setTimeout(onTransportComplete, 300);
      }
    } else {
      player.scale.setScalar(1);
      const keys = keysRef.current;
      moveDir.current.set(0, 0, 0);
      if (keys.KeyW || keys.ArrowUp) moveDir.current.z -= 1;
      if (keys.KeyS || keys.ArrowDown) moveDir.current.z += 1;
      if (keys.KeyA || keys.ArrowLeft) moveDir.current.x -= 1;
      if (keys.KeyD || keys.ArrowRight) moveDir.current.x += 1;

      if (moveDir.current.lengthSq() > 0) {
        moveDir.current.normalize().multiplyScalar(MOVE_SPEED * dt);
        player.position.x += moveDir.current.x;
        player.position.z += moveDir.current.z;
        player.rotation.y = Math.atan2(moveDir.current.x, moveDir.current.z);

        const dist = Math.hypot(player.position.x, player.position.z);
        if (dist > PLATFORM_RADIUS - 0.5) {
          const scale = (PLATFORM_RADIUS - 0.5) / dist;
          player.position.x *= scale;
          player.position.z *= scale;
        }
      }

      player.position.y = 0;
    }

    let closest: ProblemEntry | null = null;
    let closestDist = ENTER_RADIUS;

    for (const problem of PROBLEMS) {
      const dx = player.position.x - problem.position[0];
      const dz = player.position.z - problem.position[2];
      const dist = Math.hypot(dx, dz);
      if (dist < closestDist) {
        closestDist = dist;
        closest = problem;
      }
    }

    const nextId = closest?.id ?? null;
    if (nextId !== lastNearbyId.current) {
      lastNearbyId.current = nextId;
      onProximityChange(closest);
    }

    desiredCam.current.set(
      player.position.x + 4,
      player.position.y + 5,
      player.position.z + 9,
    );
    camera.position.lerp(desiredCam.current, 1 - Math.exp(-5 * dt));
    lookAtTarget.current.set(player.position.x, player.position.y + 1.2, player.position.z);
    camera.lookAt(lookAtTarget.current);
  });

  return (
    <>
      <Character
        avatar={avatar}
        groupRef={playerRef}
        position={[0, 0, 5]}
        rotationY={Math.PI}
      />
      {PROBLEMS.map((problem) => (
        <WorldPortal
          key={problem.id}
          problem={problem}
          highlighted={nearbyId === problem.id}
        />
      ))}
      {target && (
        <WarpTunnel
          active={transporting}
          color={target.color}
          position={[target.position[0], 1.2, target.position[2]]}
        />
      )}
    </>
  );
}

function SceneContent(props: SelectSceneProps) {
  return (
    <>
      <color attach="background" args={["#7ecbff"]} />
      <fog attach="fog" args={["#7ecbff", 16, 50]} />
      <ambientLight intensity={0.9} />
      <directionalLight castShadow intensity={1.1} position={[6, 12, 8]} />

      <GoofyCloud position={[-8, 12, -10]} scale={1.5} />
      <GoofyCloud position={[9, 15, -12]} scale={1.8} />
      <GoofyCloud position={[0, 18, -14]} scale={2} />
      <GoofyCloud position={[-5, 20, -8]} scale={1.2} />
      <GoofyCloud position={[6, 22, -9]} scale={1.4} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.05, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#5bb83a" />
      </mesh>

      <HubPlatform />
      <HubPlayer {...props} />
    </>
  );
}

export function SelectScene(props: SelectSceneProps) {
  return (
    <Canvas shadows camera={{ position: [4, 5, 14], fov: 52 }}>
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
}
