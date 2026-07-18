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
import type { TreeNodeState, TreeSceneProps } from "./types";

function layoutTree(
  nodes: TreeNodeState[],
  rootId: string | null,
): Map<string, [number, number, number]> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const pos = new Map<string, [number, number, number]>();
  if (!rootId || !byId.has(rootId)) return pos;

  const place = (id: string | null, x: number, y: number, spread: number) => {
    if (!id || !byId.has(id) || pos.has(id)) return;
    pos.set(id, [x, y, 0]);
    const node = byId.get(id)!;
    place(node.left, x - spread, y - 1.8, spread * 0.55);
    place(node.right, x + spread, y - 1.8, spread * 0.55);
  };
  place(rootId, 0, 3.2, 3.2);
  return pos;
}

function TreeNodeMesh({
  position,
  value,
  active,
  finalized,
  pulse,
  color,
}: {
  position: [number, number, number];
  value: number | string;
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
    ref.current.scale.setScalar(active && pulse ? 1.1 : 1);
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.45, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={active || finalized ? color : "#000000"}
          emissiveIntensity={active || finalized ? 0.25 : 0}
        />
      </mesh>
      <Text position={[0, 0, 0.48]} fontSize={0.32} color="#0f172a" anchorX="center">
        {String(value)}
      </Text>
    </group>
  );
}

function TreeContent(props: TreeSceneProps) {
  const {
    visualPlan,
    nodes,
    rootId,
    activeNodeId,
    finalized,
    swapHighlight,
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
  const positions = useMemo(() => layoutTree(nodes, rootId), [nodes, rootId]);
  const finalizedSet = useMemo(() => new Set(finalized), [finalized]);
  const cam = theme.camera.position;
  const homePosition: [number, number, number] = Array.isArray(cam)
    ? [cam[0] ?? 0, cam[1] ?? 8, cam[2] ?? 14]
    : [0, 8, 14];
  const homeTarget: [number, number, number] = [0, 1.5, 0];

  const edges = useMemo(() => {
    const list: Array<{
      key: string;
      curve: THREE.LineCurve3;
      swapping: boolean;
    }> = [];
    for (const node of nodes) {
      const from = positions.get(node.id);
      if (!from) continue;
      for (const side of ["left", "right"] as const) {
        const childId = node[side];
        if (!childId) continue;
        const to = positions.get(childId);
        if (!to) continue;
        list.push({
          key: `${node.id}-${side}-${childId}`,
          curve: new THREE.LineCurve3(
            new THREE.Vector3(from[0], from[1], 0),
            new THREE.Vector3(to[0], to[1], 0),
          ),
          swapping: swapHighlight?.nodeId === node.id,
        });
      }
    }
    return list;
  }, [nodes, positions, swapHighlight]);

  return (
    <>
      <color attach="background" args={[theme.palette.sky || "#b3e5fc"]} />
      <fog attach="fog" args={[theme.palette.sky || "#b3e5fc", 24, 70]} />
      <ambientLight intensity={0.75} />
      <directionalLight castShadow intensity={1.15} position={[5, 12, 6]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={theme.palette.ground || "#a5d6a7"} />
      </mesh>

      {edges.map((edge) => (
        <mesh key={edge.key}>
          <tubeGeometry args={[edge.curve, 8, edge.swapping ? 0.05 : 0.035, 6, false]} />
          <meshStandardMaterial
            color={edge.swapping ? "#FF7043" : "#78909C"}
            emissive={edge.swapping ? "#FF7043" : "#000000"}
            emissiveIntensity={edge.swapping ? 0.35 : 0}
          />
        </mesh>
      ))}

      {nodes.map((node) => {
        const p = positions.get(node.id);
        if (!p) return null;
        return (
          <TreeNodeMesh
            key={node.id}
            position={p}
            value={node.value}
            active={activeNodeId === node.id}
            finalized={finalizedSet.has(node.id)}
            pulse={pulse}
            color={
              visualPlan.entities[String(node.value)]?.color ??
              visualPlan.entities.tree_node?.color ??
              "#81C784"
            }
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
        <Text position={[0, 5.2, 0]} fontSize={0.36} color="#0f172a" anchorX="center">
          {introTitle}
        </Text>
      )}
      {statusLabel && (
        <Text position={[0, 4.5, 0]} fontSize={0.28} color="#1e293b" anchorX="center">
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
        maxDistance={24}
        target={homeTarget}
        enabled={orbitEnabled}
      />
    </>
  );
}

export function TreeScene(props: TreeSceneProps) {
  const theme = useMemo(() => getTheme(props.visualPlan), [props.visualPlan]);
  const cam = theme.camera.position;
  const position: [number, number, number] = Array.isArray(cam)
    ? [cam[0] ?? 0, cam[1] ?? 8, cam[2] ?? 14]
    : [0, 8, 14];
  return (
    <Canvas shadows camera={{ position, fov: 46 }}>
      <Suspense fallback={null}>
        <TreeContent {...props} />
      </Suspense>
    </Canvas>
  );
}
