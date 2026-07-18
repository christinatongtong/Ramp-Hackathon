"use client";

import { Suspense, useMemo, useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { DayNightSky, dayLabel } from "@/components/rotting-oranges/DayNightSky";
import { FarmPlayer } from "@/components/rotting-oranges/FarmPlayer";
import { ProblemBoard3D } from "@/components/rotting-oranges/ProblemBoard3D";
import { GridEntityLayer } from "@/components/entities/GridEntityLayer";
import { EffectLayer } from "@/components/effects/EffectLayer";
import { ResultChoreography } from "@/components/effects/ResultChoreography";
import { CameraController } from "@/components/camera/CameraController";
import { getTheme } from "@/lib/api/types";
import type { GridWorldProps } from "./types";

type BaseGridWorldProps = GridWorldProps & {
  environment: ReactNode;
  nightFactor?: number;
};

function StaticSky({ color }: { color: string }) {
  return (
    <>
      <color attach="background" args={[color]} />
      <fog attach="fog" args={[color, 18, 60]} />
      <ambientLight intensity={0.7} />
    </>
  );
}

function SceneContent({
  environment,
  nightFactor = 0,
  ...props
}: BaseGridWorldProps) {
  const {
    grid,
    visualPlan,
    pulse,
    activeCell,
    dayIndex,
    problemOpen,
    toggleTrigger,
    orbitEnabled,
    onIntroLand,
    onBoardHit,
    onToggleDone,
    statusLabel,
    effect = null,
    effectColor = null,
    regionCells = null,
    frontierCells = null,
    cameraCue = null,
    resultOverlay = false,
    resultPassed = true,
    resultExplanation = null,
    introTitle = null,
    semanticSpec = null,
  } = props;

  const boardOpenAmount = useRef(0);
  const theme = getTheme(visualPlan);
  const timeMode = theme.timeSystem?.mode ?? "static";
  const label = statusLabel ?? (timeMode === "day_night" ? dayLabel(dayIndex) : null);
  const cameraTarget = theme.camera.target;
  const cam = theme.camera.position;
  const homePosition: [number, number, number] = Array.isArray(cam)
    ? [cam[0] ?? 3.5, cam[1] ?? 8, cam[2] ?? 14]
    : [3.5, 8, 14];
  const homeTarget: [number, number, number] = Array.isArray(cameraTarget)
    ? [cameraTarget[0] ?? 0, cameraTarget[1] ?? 0.6, cameraTarget[2] ?? -0.5]
    : [0, 0.6, -0.5];

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  return (
    <>
      {timeMode === "day_night" ? (
        <DayNightSky dayIndex={dayIndex} />
      ) : (
        <StaticSky color={theme.palette.sky || "#7ecbff"} />
      )}

      <directionalLight
        castShadow
        intensity={1.3 - nightFactor * 0.6}
        position={[8, 14, 6]}
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight
        intensity={0.3 - nightFactor * 0.15}
        position={[-5, 4, 3]}
        color={theme.palette.accent}
      />

      {environment}

      <GridEntityLayer
        grid={grid}
        entities={visualPlan.entities}
        semanticSpec={semanticSpec}
        pulse={pulse}
        activeCell={activeCell}
        title={theme.name}
        regionCells={regionCells}
        frontierCells={frontierCells}
      />

      <EffectLayer
        effect={effect}
        effectColor={effectColor}
        activeCell={activeCell}
        regionCells={regionCells}
        gridRows={rows}
        gridCols={cols}
        resultOverlay={false}
      />

      <ResultChoreography
        active={Boolean(resultOverlay)}
        effect={effect}
        effectColor={effectColor}
        explanation={resultExplanation}
        passed={resultPassed}
        gridRows={rows}
        gridCols={cols}
      />

      {introTitle && (
        <Text
          position={[0, 4.6, 0]}
          fontSize={0.38}
          color="#fff7e6"
          anchorX="center"
          outlineWidth={0.025}
          outlineColor="#1f2937"
        >
          {introTitle}
        </Text>
      )}

      <ProblemBoard3D open={problemOpen} openAmountRef={boardOpenAmount} />

      <FarmPlayer
        toggleTrigger={toggleTrigger}
        problemOpen={problemOpen}
        onIntroLand={onIntroLand}
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

      <CameraController
        cue={cameraCue}
        activeCell={activeCell}
        gridRows={rows}
        gridCols={cols}
        homePosition={homePosition}
        homeTarget={homeTarget}
        enabled={orbitEnabled}
      />

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 5.5}
        maxPolarAngle={Math.PI / 2.35}
        minAzimuthAngle={-Math.PI / 2.8}
        maxAzimuthAngle={Math.PI / 2.8}
        minDistance={8}
        maxDistance={17}
        target={homeTarget}
        rotateSpeed={0.45}
        enabled={orbitEnabled}
      />
    </>
  );
}

export function BaseGridWorld(props: BaseGridWorldProps) {
  const cam = getTheme(props.visualPlan).camera.position;
  const cameraPosition = useMemo(
    (): [number, number, number] =>
      Array.isArray(cam)
        ? [cam[0] ?? 3.5, cam[1] ?? 8, cam[2] ?? 14]
        : [3.5, 8, 14],
    [cam],
  );

  return (
    <Canvas shadows camera={{ position: cameraPosition, fov: 48 }}>
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
}
