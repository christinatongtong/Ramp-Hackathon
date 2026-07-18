"use client";

import type { EntityRendererProps } from "./types";

export function WaterEntity({ entity, active }: EntityRendererProps) {
  const color = entity.color;
  return (
    <mesh receiveShadow position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.2, 1.2]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.82}
        emissive={active ? color : "#001a33"}
        emissiveIntensity={active ? 0.35 : 0.08}
        roughness={0.25}
        metalness={0.15}
      />
    </mesh>
  );
}
