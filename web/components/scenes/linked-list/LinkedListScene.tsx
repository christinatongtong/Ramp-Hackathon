"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { FarmPlayer } from "@/components/rotting-oranges/FarmPlayer";
import { ProblemBoard3D } from "@/components/rotting-oranges/ProblemBoard3D";
import { ResultChoreography } from "@/components/effects/ResultChoreography";
import { CameraController } from "@/components/camera/CameraController";
import { getTheme } from "@/lib/api/types";
import { ListNodeLayer } from "./ListNodeLayer";
import { ListEdgeLayer } from "./ListEdgeLayer";
import { ListPointerLayer } from "./ListPointerLayer";
import type { LinkedListSceneProps } from "./types";

function ListBackdrop({ sky, ground }: { sky: string; ground: string }) {
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 24, 70]} />
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
      {/* Track rails */}
      <mesh position={[0, 0.01, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 0.08]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
      <mesh position={[0, 0.01, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 0.08]} />
        <meshStandardMaterial color="#607D8B" />
      </mesh>
    </>
  );
}

function LinkedListSceneContent(props: LinkedListSceneProps) {
  const {
    visualPlan,
    semanticSpec = null,
    nodes,
    pointers,
    activeNodeId,
    finalized,
    edgeHighlight,
    layoutOrder,
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
  const cam = theme.camera.position;
  const cameraTarget = theme.camera.target;
  const homePosition: [number, number, number] = Array.isArray(cam)
    ? [cam[0] ?? 0, cam[1] ?? 6, cam[2] ?? 14]
    : [0, 6, 14];
  const homeTarget: [number, number, number] = Array.isArray(cameraTarget)
    ? [cameraTarget[0] ?? 0, cameraTarget[1] ?? 0.6, cameraTarget[2] ?? 0]
    : [0, 0.6, 0];

  const hop = effect === "pointer_hop";
  const completeGlow = effect === "list_complete" || Boolean(resultOverlay);

  return (
    <>
      <ListBackdrop
        sky={theme.palette.sky || "#7ecbff"}
        ground={theme.palette.ground || "#cfd8dc"}
      />

      <ListEdgeLayer
        nodes={nodes}
        layoutOrder={layoutOrder}
        edgeHighlight={edgeHighlight}
        effect={effect}
      />
      <ListNodeLayer
        nodes={nodes}
        layoutOrder={layoutOrder}
        entities={visualPlan.entities}
        semanticSpec={semanticSpec}
        activeNodeId={activeNodeId}
        finalized={finalized}
        pulse={pulse}
        completeGlow={completeGlow}
      />
      <ListPointerLayer
        pointers={pointers}
        layoutOrder={layoutOrder}
        hop={hop}
      />

      <ResultChoreography
        active={Boolean(resultOverlay)}
        effect={effect}
        effectColor={effectColor}
        explanation={resultExplanation}
        passed={resultPassed}
        gridRows={1}
        gridCols={Math.max(1, nodes.length)}
      />

      {introTitle && (
        <Text
          position={[0, 4.4, 0]}
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
          position={[0, 3.1, 0]}
          fontSize={0.3}
          color="#fff7e6"
          anchorX="center"
          outlineWidth={0.02}
          outlineColor="#1f2937"
        >
          {statusLabel}
        </Text>
      )}

      <CameraController
        cue={cameraCue}
        activeCell={null}
        gridRows={1}
        gridCols={Math.max(1, nodes.length)}
        homePosition={homePosition}
        homeTarget={homeTarget}
        enabled={orbitEnabled}
      />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 5.5}
        maxPolarAngle={Math.PI / 2.35}
        minDistance={7}
        maxDistance={24}
        target={homeTarget}
        rotateSpeed={0.45}
        enabled={orbitEnabled}
      />
    </>
  );
}

export function LinkedListScene(props: LinkedListSceneProps) {
  const theme = useMemo(() => getTheme(props.visualPlan), [props.visualPlan]);
  const cam = theme.camera.position;
  const position: [number, number, number] = Array.isArray(cam)
    ? [cam[0] ?? 0, cam[1] ?? 6, cam[2] ?? 14]
    : [0, 6, 14];

  return (
    <Canvas shadows camera={{ position, fov: 46 }}>
      <Suspense fallback={null}>
        <LinkedListSceneContent {...props} />
      </Suspense>
    </Canvas>
  );
}
