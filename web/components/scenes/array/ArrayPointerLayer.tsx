"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ARRAY_SPACING } from "./types";

const POINTER_COLORS: Record<string, string> = {
  left: "#42A5F5",
  right: "#EF5350",
  mid: "#FFD54F",
  lo: "#42A5F5",
  hi: "#EF5350",
};

function indexX(index: number, count: number): number {
  return (index - (count - 1) / 2) * ARRAY_SPACING;
}

function PointerMarker({
  name,
  index,
  count,
  hop,
}: {
  name: string;
  index: number;
  count: number;
  hop: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const color = POINTER_COLORS[name] ?? "#AB47BC";

  useFrame((state) => {
    if (!ref.current) return;
    const targetX = indexX(index, count);
    ref.current.position.x += (targetX - ref.current.position.x) * 0.18;
    const bob = hop ? Math.sin(state.clock.elapsedTime * 10) * 0.12 : 0;
    ref.current.position.y = 1.55 + bob;
  });

  return (
    <group ref={ref} position={[indexX(index, count), 1.55, 0]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.22, 0.4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.45, 0]}
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
}

export function ArrayPointerLayer({
  pointers,
  count,
  hop = false,
}: {
  pointers: Record<string, number>;
  count: number;
  hop?: boolean;
}) {
  if (count <= 0) return null;
  return (
    <group>
      {Object.entries(pointers).map(([name, index]) => (
        <PointerMarker
          key={name}
          name={name}
          index={index}
          count={count}
          hop={hop}
        />
      ))}
    </group>
  );
}
