"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Cloud, OrbitControls, Text } from "@react-three/drei";
import type { Grid } from "@/lib/rotting-oranges/types";
import { DayNightSky, dayLabel } from "./DayNightSky";
import { FarmPlayer } from "./FarmPlayer";
import { OrangeGrid } from "./OrangeGrid";
import { ProblemBoard3D } from "./ProblemBoard3D";

type FarmSceneProps = {
  grid: Grid;
  pulseRotten: boolean;
  minute: number | null;
  /** Same as minute — each simulation step advances the day/night cycle */
  dayIndex: number | null;
  problemOpen: boolean;
  toggleTrigger: number;
  introLanded: boolean;
  orbitEnabled: boolean;
  onIntroLand: () => void;
  onBoardHit: (open: boolean) => void;
  onToggleDone: () => void;
};

function Tree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.14, 0.2, 1.6, 8]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      <mesh castShadow position={[0, 2.0, 0]}>
        <sphereGeometry args={[0.75, 10, 10]} />
        <meshStandardMaterial color="#43a047" />
      </mesh>
      <mesh castShadow position={[-0.35, 2.3, 0.2]} scale={0.7}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshStandardMaterial color="#66bb6a" />
      </mesh>
      <mesh castShadow position={[0.3, 2.15, -0.25]} scale={0.65}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
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

function FarmEnvironment({ nightFactor }: { nightFactor: number }) {
  const treePositions: [number, number, number][] = [
    [-5.5, 0, -3],
    [-6, 0, 2],
    [-4.5, 0, 5],
    [5.5, 0, -4],
    [6.5, 0, 0],
    [5, 0, 4.5],
    [-2, 0, -5.5],
    [2.5, 0, -5.5],
    [-5, 0, -5],
    [6, 0, -6],
  ];

  const grassColor = nightFactor > 0.5 ? "#3a5a2e" : nightFactor > 0.2 ? "#5a8a45" : "#6fcf4a";
  const plotColor = nightFactor > 0.5 ? "#354f2f" : nightFactor > 0.2 ? "#6a9e52" : "#8bc34a";

  return (
    <>
      <GoofyCloud position={[-8, 11, -10]} scale={1.3} />
      <GoofyCloud position={[9, 13, -8]} scale={1.6} />
      <Cloud position={[-6, 10, -12]} speed={0.08} opacity={0.35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={grassColor} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color={plotColor} />
      </mesh>

      {treePositions.map((pos, i) => (
        <Tree key={i} position={pos} scale={0.85 + (i % 3) * 0.15} />
      ))}

      <mesh castShadow position={[0, 0.35, -3.8]}>
        <boxGeometry args={[5.5, 0.12, 0.12]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
    </>
  );
}

function SceneContent({
  grid,
  pulseRotten,
  dayIndex,
  problemOpen,
  toggleTrigger,
  introLanded,
  orbitEnabled,
  onIntroLand,
  onBoardHit,
  onToggleDone,
}: FarmSceneProps) {
  const boardOpenAmount = useRef(0);
  const nightFactor =
    dayIndex === null ? 0 : dayIndex % 4 === 3 ? 0.85 : dayIndex % 4 === 2 ? 0.35 : 0;
  const label = dayLabel(dayIndex);

  return (
    <>
      <DayNightSky dayIndex={dayIndex} />
      <directionalLight
        castShadow
        intensity={1.3 - nightFactor * 0.6}
        position={[8, 14, 6]}
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight intensity={0.3 - nightFactor * 0.15} position={[-5, 4, 3]} color="#ffd699" />

      <FarmEnvironment nightFactor={nightFactor} />
      <OrangeGrid grid={grid} pulse={pulseRotten} />

      <ProblemBoard3D open={problemOpen} openAmountRef={boardOpenAmount} />

      <FarmPlayer
        toggleTrigger={toggleTrigger}
        problemOpen={problemOpen}
        onIntroLand={() => {
          onIntroLand();
        }}
        onBoardHit={onBoardHit}
        onToggleDone={onToggleDone}
      />

      {label && (
        <Text
          position={[0, 3.2, 0]}
          fontSize={0.32}
          color="#fff7e6"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#1f2937"
        >
          {label}
        </Text>
      )}

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 5.5}
        maxPolarAngle={Math.PI / 2.35}
        minAzimuthAngle={-Math.PI / 2.8}
        maxAzimuthAngle={Math.PI / 2.8}
        minDistance={8}
        maxDistance={17}
        target={[0, 0.6, -0.5]}
        rotateSpeed={0.45}
        enabled={orbitEnabled}
      />
    </>
  );
}

export function FarmScene(props: FarmSceneProps) {
  return (
    <Canvas shadows camera={{ position: [3.5, 8, 14], fov: 48 }}>
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
}
