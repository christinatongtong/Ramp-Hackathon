"use client";

import { Cloud } from "@react-three/drei";
import { BaseGridWorld } from "./BaseGridWorld";
import type { GridWorldProps } from "./types";
import type { VisualPlan } from "@/lib/api/types";

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

function Fence({ position }: { position: [number, number, number] }) {
  return (
    <mesh castShadow position={position}>
      <boxGeometry args={[5.5, 0.12, 0.12]} />
      <meshStandardMaterial color="#795548" />
    </mesh>
  );
}

const PERIMETER_TREE_SLOTS: [number, number, number][] = [
  [-5.5, 0, -3],
  [-6, 0, 2],
  [-4.5, 0, 5],
  [5.5, 0, -4],
  [6.5, 0, 0],
  [5, 0, 4.5],
  [-2, 0, -5.5],
  [2.5, 0, -5.5],
];

const SKY_CLOUD_SLOTS: [number, number, number][] = [
  [-8, 11, -10],
  [9, 13, -8],
  [0, 14, -12],
];

function FarmEnvironment({
  visualPlan,
  nightFactor,
}: {
  visualPlan: VisualPlan;
  nightFactor: number;
}) {
  const palette = visualPlan.world.palette;
  const grassColor =
    nightFactor > 0.5
      ? "#3a5a2e"
      : nightFactor > 0.2
        ? "#5a8a45"
        : palette.ground;
  const plotColor =
    nightFactor > 0.5 ? "#354f2f" : nightFactor > 0.2 ? "#6a9e52" : "#8bc34a";

  const treeCount =
    visualPlan.world.props.find(
      (prop) =>
        prop.primitive === "tree" &&
        (prop.placement === "perimeter" || prop.placement === "scatter"),
    )?.count ?? 8;

  const cloudCount =
    visualPlan.world.props.find(
      (prop) =>
        (prop.primitive === "goofy_cloud" || prop.primitive === "cloud") &&
        prop.placement === "sky",
    )?.count ?? 2;

  const showFence = visualPlan.world.props.some(
    (prop) => prop.primitive === "fence",
  );

  return (
    <>
      {SKY_CLOUD_SLOTS.slice(0, cloudCount).map((pos, i) => (
        <GoofyCloud key={`cloud-${i}`} position={pos} scale={1.3 + i * 0.15} />
      ))}
      <Cloud position={[-6, 10, -12]} speed={0.08} opacity={0.35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={grassColor} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color={plotColor} />
      </mesh>

      {PERIMETER_TREE_SLOTS.slice(0, treeCount).map((pos, i) => (
        <Tree key={`tree-${i}`} position={pos} scale={0.85 + (i % 3) * 0.15} />
      ))}

      {showFence && <Fence position={[0, 0.35, -3.8]} />}
    </>
  );
}

/** @deprecated Prefer GridWorldProps — kept for WorldRenderer typing. */
export type FarmWorldProps = GridWorldProps;

export function FarmWorld(props: GridWorldProps) {
  const dayIndex = props.dayIndex;
  const nightFactor =
    dayIndex === null
      ? 0
      : dayIndex % 4 === 3
        ? 0.85
        : dayIndex % 4 === 2
          ? 0.35
          : 0;

  return (
    <BaseGridWorld
      {...props}
      nightFactor={nightFactor}
      environment={
        <FarmEnvironment visualPlan={props.visualPlan} nightFactor={nightFactor} />
      }
    />
  );
}
