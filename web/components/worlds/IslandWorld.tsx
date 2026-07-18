"use client";

import { Cloud } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { BaseGridWorld } from "./BaseGridWorld";
import type { GridWorldProps } from "./types";
import type { VisualPlan } from "@/lib/api/types";

function Palm({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 2.2, 8]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          castShadow
          position={[
            Math.cos((i / 5) * Math.PI * 2) * 0.55,
            2.2,
            Math.sin((i / 5) * Math.PI * 2) * 0.55,
          ]}
          rotation={[0.55, (i / 5) * Math.PI * 2, 0]}
        >
          <boxGeometry args={[0.12, 0.02, 1.1]} />
          <meshStandardMaterial color="#43a047" />
        </mesh>
      ))}
    </group>
  );
}

function OceanPlane({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.06 + Math.sin(clock.elapsedTime * 0.8) * 0.03;
  });
  return (
    <mesh
      ref={ref}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      position={[0, -0.08, 0]}
    >
      <planeGeometry args={[48, 48]} />
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.12}
        emissive={color}
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}

function IslandEnvironment({ visualPlan }: { visualPlan: VisualPlan }) {
  const palette = visualPlan.world.palette;
  const ocean = "#1e88c8";
  const sandColor = palette.ground || "#e0c070";

  const palmCount =
    visualPlan.world.props.find((prop) => prop.primitive === "tree")?.count ?? 3;
  const cloudCount =
    visualPlan.world.props.find(
      (prop) => prop.primitive === "cloud" || prop.primitive === "goofy_cloud",
    )?.count ?? 2;

  const palmSlots: [number, number, number][] = [
    [-6.5, 0, -2],
    [6.2, 0, 1.5],
    [-4, 0, 5],
    [5, 0, -4.5],
  ];

  return (
    <>
      <OceanPlane color={ocean} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -1]}>
        <circleGeometry args={[5.2, 32]} />
        <meshStandardMaterial color={sandColor} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -1]}>
        <circleGeometry args={[4.2, 28]} />
        <meshStandardMaterial color="#c9a84c" roughness={0.9} />
      </mesh>

      {palmSlots.slice(0, palmCount).map((pos, i) => (
        <Palm key={`palm-${i}`} position={pos} scale={0.85 + (i % 2) * 0.15} />
      ))}

      {Array.from({ length: cloudCount }).map((_, i) => (
        <Cloud
          key={`cloud-${i}`}
          position={[-7 + i * 7, 11 + i, -10]}
          speed={0.05}
          opacity={0.4}
        />
      ))}
    </>
  );
}

export function IslandWorld(props: GridWorldProps) {
  return (
    <BaseGridWorld
      {...props}
      nightFactor={0}
      environment={<IslandEnvironment visualPlan={props.visualPlan} />}
    />
  );
}
