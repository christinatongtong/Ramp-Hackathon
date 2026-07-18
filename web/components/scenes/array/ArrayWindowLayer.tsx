"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ARRAY_BLOCK_SIZE, ARRAY_SPACING } from "./types";

function indexX(index: number, count: number): number {
  return (index - (count - 1) / 2) * ARRAY_SPACING;
}

export function ArrayWindowLayer({
  window,
  count,
  slide = false,
}: {
  window: { left: number; right: number } | null;
  count: number;
  slide?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!mesh.current || !window || count <= 0) return;
    const leftX = indexX(window.left, count);
    const rightX = indexX(window.right, count);
    const mid = (leftX + rightX) / 2;
    const width = Math.abs(rightX - leftX) + ARRAY_BLOCK_SIZE * 1.15;
    const target = mesh.current.position;
    if (slide) {
      target.x += (mid - target.x) * 0.2;
      mesh.current.scale.x += (width - mesh.current.scale.x) * 0.2;
    } else {
      target.x = mid;
      mesh.current.scale.x = width;
    }
  });

  if (!window || count <= 0) return null;

  const leftX = indexX(window.left, count);
  const rightX = indexX(window.right, count);
  const mid = (leftX + rightX) / 2;
  const width = Math.abs(rightX - leftX) + ARRAY_BLOCK_SIZE * 1.15;

  return (
    <mesh ref={mesh} position={[mid, 0.45, -0.35]} scale={[width, 1.2, 0.2]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#FFD54F"
        transparent
        opacity={0.28}
        depthWrite={false}
      />
    </mesh>
  );
}
