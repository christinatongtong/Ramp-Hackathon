"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { FarmPlayer } from "@/components/rotting-oranges/FarmPlayer";
import { ProblemBoard3D } from "@/components/rotting-oranges/ProblemBoard3D";
import { ResultChoreography } from "@/components/effects/ResultChoreography";
import { CameraController } from "@/components/camera/CameraController";
import { getStructure, getTheme } from "@/lib/api/types";
import { ArrayElementLayer } from "./ArrayElementLayer";
import { ArrayPointerLayer } from "./ArrayPointerLayer";
import { ArrayWindowLayer } from "./ArrayWindowLayer";
import { ArrayEffectLayer } from "./ArrayEffectLayer";
import type { ArraySceneProps } from "./types";

function ArrayBackdrop({ sky, ground }: { sky: string; ground: string }) {
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 22, 70]} />
      <ambientLight intensity={0.75} />
      <directionalLight castShadow intensity={1.2} position={[6, 12, 8]} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={ground} />
      </mesh>
    </>
  );
}

function ArraySceneContent(props: ArraySceneProps) {
  const {
    visualPlan,
    semanticSpec = null,
    values,
    pointers,
    window,
    activeIndices,
    finalized,
    pulse,
    problemOpen,
    toggleTrigger,
    orbitEnabled,
    onIntroLand,
    onBoardHit,
    onToggleDone,
    statusLabel,
    effect = null,
    effectColor = null,
    cameraCue = null,
    resultOverlay = false,
    resultPassed = true,
    resultExplanation = null,
    introTitle = null,
  } = props;

  const boardOpenAmount = useRef(0);
  const theme = getTheme(visualPlan);
  const structure = getStructure(visualPlan);
  const cam = theme.camera.position;
  const cameraTarget = theme.camera.target;
  const homePosition: [number, number, number] = Array.isArray(cam)
    ? [cam[0] ?? 0, cam[1] ?? 6, cam[2] ?? 12]
    : [0, 6, 12];
  const homeTarget: [number, number, number] = Array.isArray(cameraTarget)
    ? [cameraTarget[0] ?? 0, cameraTarget[1] ?? 0.5, cameraTarget[2] ?? 0]
    : [0, 0.5, 0];

  const hop = effect === "pointer_hop";
  const slide = effect === "window_slide";
  const layout = structure.layout ?? "horizontal";
  const showIndices = structure.showIndices !== false;

  return (
    <>
      <ArrayBackdrop
        sky={theme.palette.sky || "#7ecbff"}
        ground={theme.palette.ground || "#94a3b8"}
      />

      <ArrayElementLayer
        values={values}
        entities={visualPlan.entities}
        semanticSpec={semanticSpec}
        activeIndices={activeIndices}
        finalized={finalized}
        pulse={pulse}
        layout={layout}
        showIndices={showIndices}
      />
      <ArrayWindowLayer window={window} count={values.length} slide={slide} />
      <ArrayPointerLayer pointers={pointers} count={values.length} hop={hop} />
      <ArrayEffectLayer
        effect={effect}
        effectColor={effectColor}
        activeIndices={activeIndices}
        count={values.length}
        resultOverlay={resultOverlay}
      />

      <ResultChoreography
        active={Boolean(resultOverlay)}
        effect={effect}
        effectColor={effectColor}
        explanation={resultExplanation}
        passed={resultPassed}
        gridRows={1}
        gridCols={Math.max(1, values.length)}
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

      {statusLabel && (
        <Text
          position={[0, 3.2, 0]}
          fontSize={0.32}
          color="#fff7e6"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#1f2937"
        >
          {statusLabel}
        </Text>
      )}

      <CameraController
        cue={cameraCue}
        activeCell={null}
        gridRows={1}
        gridCols={Math.max(1, values.length)}
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
        minDistance={6}
        maxDistance={20}
        target={homeTarget}
        rotateSpeed={0.45}
        enabled={orbitEnabled}
      />
    </>
  );
}

export function ArrayScene(props: ArraySceneProps) {
  const theme = useMemo(() => getTheme(props.visualPlan), [props.visualPlan]);
  const cam = theme.camera.position;
  const position: [number, number, number] = Array.isArray(cam)
    ? [cam[0] ?? 0, cam[1] ?? 6, cam[2] ?? 12]
    : [0, 6, 12];

  return (
    <Canvas shadows camera={{ position, fov: 48 }}>
      <Suspense fallback={null}>
        <ArraySceneContent {...props} />
      </Suspense>
    </Canvas>
  );
}
