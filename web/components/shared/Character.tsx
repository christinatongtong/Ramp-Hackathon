"use client";

import type { RefObject } from "react";
import type { Group } from "three";
import type { AvatarDefinition } from "@/lib/avatar/presets";

type CharacterProps = {
  avatar: AvatarDefinition;
  position?: [number, number, number];
  rotationY?: number;
  groupRef?: RefObject<Group | null>;
};

export function Character({
  avatar,
  position = [0, 0, 0],
  rotationY = 0,
  groupRef,
}: CharacterProps) {
  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.35, 0.8, 8, 16]} />
        <meshStandardMaterial color={avatar.bodyColor} />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color={avatar.skinColor} />
      </mesh>
      <mesh position={[0.18, 1.58, 0.22]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {avatar.hat === "beanie" && (
        <mesh castShadow position={[0, 1.82, 0]}>
          <sphereGeometry args={[0.3, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={avatar.hatColor ?? avatar.bodyColor} />
        </mesh>
      )}

      {avatar.hat === "spike" && (
        <mesh castShadow position={[0, 1.95, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.22, 0.45, 8]} />
          <meshStandardMaterial color={avatar.hatColor ?? "#333"} />
        </mesh>
      )}
    </group>
  );
}
