"use client";

import type { EntityRendererProps } from "./types";

export function WallEntity({ entity, active }: EntityRendererProps) {
  const color = entity.color;
  return (
    <mesh castShadow position={[0, 0.55, 0]}>
      <boxGeometry args={[0.95, 1.1, 0.95]} />
      <meshStandardMaterial
        color={color}
        emissive={active ? color : "#000000"}
        emissiveIntensity={active ? 0.2 : 0}
        roughness={0.9}
      />
    </mesh>
  );
}
