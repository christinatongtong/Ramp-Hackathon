"use client";

import type { EntityRendererProps } from "./types";

export function FallbackEntity({ entity, active }: EntityRendererProps) {
  const color = entity.color || "#888888";
  return (
    <mesh castShadow position={[0, 0.2, 0]}>
      <boxGeometry args={[0.7, 0.35, 0.7]} />
      <meshStandardMaterial
        color={color}
        emissive={active ? color : "#000000"}
        emissiveIntensity={active ? 0.2 : 0}
      />
    </mesh>
  );
}
