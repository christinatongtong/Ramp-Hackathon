"use client";

import { BaseGridWorld } from "./BaseGridWorld";
import type { GridWorldProps } from "./types";
import type { VisualPlan } from "@/lib/api/types";
import { getTheme } from "@/lib/api/types";

function GenericEnvironment({ visualPlan }: { visualPlan: VisualPlan }) {
  const ground = getTheme(visualPlan).palette.ground || "#94a3b8";
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color={ground} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <gridHelper args={[10, 10, "#cbd5e1", "#475569"]} position={[0, 0.02, -1]} />
    </>
  );
}

export function GenericGridWorld(props: GridWorldProps) {
  return (
    <BaseGridWorld
      {...props}
      nightFactor={0}
      environment={<GenericEnvironment visualPlan={props.visualPlan} />}
    />
  );
}
