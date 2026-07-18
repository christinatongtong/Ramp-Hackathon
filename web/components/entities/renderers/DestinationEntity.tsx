"use client";

import type { EntityRendererProps } from "./types";

export function DestinationEntity({ entity, active }: EntityRendererProps) {
  const color = entity.color;
  return (
    <group>
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.42, 0.48, 0.2, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0, 0.7, 0]}>
        <coneGeometry args={[0.22, 0.7, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={active ? color : "#222200"}
          emissiveIntensity={active ? 0.55 : 0.2}
        />
      </mesh>
    </group>
  );
}
