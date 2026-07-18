"use client";

import type { EntityRendererProps } from "./types";

export function HeightBlockEntity({
  entity,
  value,
  active,
}: EntityRendererProps) {
  const color = entity.color;
  const numeric = typeof value === "number" ? value : Number(value);
  const height = Number.isFinite(numeric)
    ? Math.max(0.25, Math.min(2.4, 0.28 + numeric * 0.22))
    : 0.45;

  return (
    <mesh castShadow position={[0, height / 2, 0]}>
      <boxGeometry args={[0.9, height, 0.9]} />
      <meshStandardMaterial
        color={color}
        emissive={active ? color : "#000000"}
        emissiveIntensity={active ? 0.25 : 0}
      />
    </mesh>
  );
}
