"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ARRAY_SPACING } from "./types";

function indexX(index: number, count: number): number {
  return (index - (count - 1) / 2) * ARRAY_SPACING;
}

function CompareFlash({
  indices,
  count,
  color,
}: {
  indices: number[];
  count: number;
  color: string;
}) {
  const group = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    if (!group.current) return;
    const opacity = Math.max(0, 0.7 - t.current * 0.9);
    group.current.children.forEach((child) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = opacity;
    });
  });
  return (
    <group ref={group}>
      {indices.map((i) => (
        <mesh key={i} position={[indexX(i, count), 0.5, 0.55]}>
          <planeGeometry args={[1.05, 1.05]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function SwapArc({
  indices,
  count,
  color,
}: {
  indices: number[];
  count: number;
  color: string;
}) {
  if (indices.length < 2) return null;
  const [a, b] = indices;
  const x1 = indexX(a, count);
  const x2 = indexX(b, count);
  const mid = (x1 + x2) / 2;
  const width = Math.abs(x2 - x1);
  const curve = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const x = x1 + (x2 - x1) * u;
      const y = 1.2 + Math.sin(u * Math.PI) * (0.6 + width * 0.08);
      points.push(new THREE.Vector3(x, y, 0.4));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [x1, x2, width]);

  return (
    <mesh position={[0, 0, 0]}>
      <tubeGeometry args={[curve, 24, 0.04, 6, false]} />
      <meshBasicMaterial color={color} />
      <mesh position={[mid, 1.9, 0.4]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </mesh>
  );
}

function ValueFlip({
  indices,
  count,
  color,
}: {
  indices: number[];
  count: number;
  color: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 8) * 0.4;
  });
  return (
    <group ref={ref}>
      {indices.map((i) => (
        <mesh key={i} position={[indexX(i, count), 0.5, 0.5]}>
          <boxGeometry args={[0.95, 0.95, 0.08]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

export function ArrayEffectLayer({
  effect,
  effectColor,
  activeIndices,
  count,
  resultOverlay = false,
}: {
  effect: string | null;
  effectColor?: string | null;
  activeIndices: number[] | null;
  count: number;
  resultOverlay?: boolean;
}) {
  const color = effectColor || "#ffffff";
  const indices = activeIndices ?? [];

  return (
    <group>
      {effect === "compare_flash" && indices.length > 0 && (
        <CompareFlash indices={indices} count={count} color={color || "#FFD54F"} />
      )}
      {effect === "swap_arc" && indices.length >= 2 && (
        <SwapArc indices={indices} count={count} color={color || "#AB47BC"} />
      )}
      {effect === "value_flip" && indices.length > 0 && (
        <ValueFlip indices={indices} count={count} color={color || "#29B6F6"} />
      )}
      {(effect === "confetti" || (resultOverlay && effect === "confetti")) && (
        <ConfettiSimple color={color || "#FFD93D"} />
      )}
    </group>
  );
}

function ConfettiSimple({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        x: (Math.random() - 0.5) * 8,
        y: 2 + Math.random() * 4,
        z: (Math.random() - 0.5) * 2,
        speed: 1 + Math.random() * 2,
      })),
    [],
  );
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      const seed = seeds[i];
      child.position.y -= delta * seed.speed;
      if (child.position.y < -1) child.position.y = 5;
    });
  });
  return (
    <group ref={group}>
      {seeds.map((seed, i) => (
        <mesh key={i} position={[seed.x, seed.y, seed.z]}>
          <boxGeometry args={[0.1, 0.1, 0.04]} />
          <meshBasicMaterial color={i % 2 ? color : "#FF8A65"} />
        </mesh>
      ))}
    </group>
  );
}
