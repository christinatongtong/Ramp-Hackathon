"use client";

import type { EntityRendererProps } from "./types";

export function FruitEntity({
  entity,
  active,
  pulse = false,
}: EntityRendererProps) {
  const color = entity.color;
  const lift = pulse && active ? 0.08 : 0;
  const scale = pulse && active ? 1.12 : 1;
  const sick = entity.idleAnimation === "sick_wobble";

  return (
    <group position={[0, 0.45 + lift, 0]} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.38, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={active ? color : "#000000"}
          emissiveIntensity={active ? 0.35 : 0}
        />
      </mesh>
      {sick && (
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#111111" />
        </mesh>
      )}
    </group>
  );
}
