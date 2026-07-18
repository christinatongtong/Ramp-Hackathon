"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { FarmPlayer } from "@/components/rotting-oranges/FarmPlayer";
import { ProblemBoard3D } from "@/components/rotting-oranges/ProblemBoard3D";
import { ResultChoreography } from "@/components/effects/ResultChoreography";
import { CameraController } from "@/components/camera/CameraController";
import { getTheme } from "@/lib/api/types";
import type { GraphSceneProps } from "./types";

function layoutCircle(count: number): Array<[number, number, number]> {
  if (count <= 0) return [];
  const radius = Math.max(2.5, count * 0.55);
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(a) * radius, 0.6, Math.sin(a) * radius];
  });
}

const STATE_COLORS: Record<string, string> = {
  unvisited: "#90CAF9",
  visiting: "#FFD54F",
  visited: "#81C784",
  cycle: "#EF5350",
};

function GraphContent(props: GraphSceneProps) {
  const {
    visualPlan,
    nodes,
    edges,
    activeNodeId,
    activeEdgeId,
    finalized,
    indegrees,
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
  const positions = useMemo(() => {
    const coords = layoutCircle(nodes.length);
    const map = new Map<string, [number, number, number]>();
    nodes.forEach((node, i) => map.set(node.id, coords[i] ?? [0, 0.6, 0]));
    return map;
  }, [nodes]);
  const finalizedSet = useMemo(() => new Set(finalized), [finalized]);
  const homePosition: [number, number, number] = [0, 10, 14];
  const homeTarget: [number, number, number] = [0, 0.5, 0];

  return (
    <>
      <color attach="background" args={[theme.palette.sky || "#d1c4e9"]} />
      <fog attach="fog" args={[theme.palette.sky || "#d1c4e9", 26, 75]} />
      <ambientLight intensity={0.75} />
      <directionalLight castShadow intensity={1.1} position={[6, 14, 8]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={theme.palette.ground || "#b0bec5"} />
      </mesh>

      {edges.map((edge) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;
        const active = activeEdgeId === edge.id || edge.active;
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(...from),
          new THREE.Vector3(
            (from[0] + to[0]) / 2,
            1.4,
            (from[2] + to[2]) / 2,
          ),
          new THREE.Vector3(...to),
        );
        return (
          <mesh key={edge.id}>
            <tubeGeometry args={[curve, 20, active ? 0.05 : 0.03, 6, false]} />
            <meshStandardMaterial
              color={active ? "#FF7043" : "#78909C"}
              emissive={active ? "#FF7043" : "#000000"}
              emissiveIntensity={active ? 0.3 : 0}
            />
          </mesh>
        );
      })}

      {nodes.map((node) => {
        const p = positions.get(node.id);
        if (!p) return null;
        const active = activeNodeId === node.id;
        const color =
          STATE_COLORS[node.colorState ?? "unvisited"] ??
          visualPlan.entities.graph_node?.color ??
          "#90CAF9";
        return (
          <GraphNodeMesh
            key={node.id}
            position={p}
            label={node.label}
            indegree={indegrees[node.id]}
            active={active}
            finalized={finalizedSet.has(node.id)}
            pulse={pulse}
            color={color}
          />
        );
      })}

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
        <Text position={[0, 4.8, 0]} fontSize={0.36} color="#0f172a" anchorX="center">
          {introTitle}
        </Text>
      )}
      {statusLabel && (
        <Text position={[0, 4.1, 0]} fontSize={0.28} color="#1e293b" anchorX="center">
          {statusLabel}
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
      <CameraController
        cue={cameraCue}
        activeCell={null}
        gridRows={1}
        gridCols={3}
        homePosition={homePosition}
        homeTarget={homeTarget}
        enabled={orbitEnabled}
      />
      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={26}
        target={homeTarget}
        enabled={orbitEnabled}
      />
    </>
  );
}

function GraphNodeMesh({
  position,
  label,
  indegree,
  active,
  finalized,
  pulse,
  color,
}: {
  position: [number, number, number];
  label: string | number;
  indegree?: number;
  active: boolean;
  finalized: boolean;
  pulse: boolean;
  color: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const bob =
      pulse && active ? Math.sin(state.clock.elapsedTime * 9) * 0.08 : 0;
    ref.current.position.y = position[1] + bob;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.7, 1.0]} />
        <meshStandardMaterial
          color={color}
          emissive={active || finalized ? color : "#000000"}
          emissiveIntensity={active || finalized ? 0.25 : 0}
        />
      </mesh>
      <Text position={[0, 0.1, 0.52]} fontSize={0.28} color="#0f172a" anchorX="center">
        {String(label)}
      </Text>
      {typeof indegree === "number" && (
        <Text position={[0, 0.7, 0]} fontSize={0.18} color="#455a64" anchorX="center">
          {`in:${indegree}`}
        </Text>
      )}
    </group>
  );
}

export function GraphScene(props: GraphSceneProps) {
  return (
    <Canvas shadows camera={{ position: [0, 10, 14], fov: 46 }}>
      <Suspense fallback={null}>
        <GraphContent {...props} />
      </Suspense>
    </Canvas>
  );
}
