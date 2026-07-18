"use client";

import type { EntityRendererProps } from "./types";

export function LandEntity({ entity, active }: EntityRendererProps) {
  const color = entity.color;
  return (
    <mesh castShadow position={[0, 0.22, 0]}>
      <boxGeometry args={[0.95, 0.4, 0.95]} />
      <meshStandardMaterial
        color={color}
        emissive={active ? color : "#000000"}
        emissiveIntensity={active ? 0.28 : 0}
        roughness={0.85}
      />
    </mesh>
  );
}
