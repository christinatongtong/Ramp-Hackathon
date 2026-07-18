"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { resolveEffect } from "@/lib/effects/registry";
import { DEFAULT_CELL_SIZE } from "@/components/entities/renderers/types";

export type EffectLayerProps = {
  effect: string | null;
  effectColor?: string | null;
  activeCell?: { row: number; col: number } | null;
  regionCells?: Array<[number, number]> | null;
  gridRows: number;
  gridCols: number;
  resultOverlay?: boolean;
};

function cellWorldPos(
  row: number,
  col: number,
  rows: number,
  cols: number,
): [number, number, number] {
  const originX = -((cols - 1) * DEFAULT_CELL_SIZE) / 2;
  const originZ = -((rows - 1) * DEFAULT_CELL_SIZE) / 2;
  return [originX + col * DEFAULT_CELL_SIZE, 0.3, originZ + row * DEFAULT_CELL_SIZE - 1];
}

function ParticleBurst({
  position,
  color,
  count = 12,
}: {
  position: [number, number, number];
  color: string;
  count?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const velocities = useMemo(() => {
    return Array.from({ length: count }, () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 2.2,
        1.2 + Math.random() * 2.4,
        (Math.random() - 0.5) * 2.2,
      ),
    );
  }, [count]);
  const age = useRef(0);

  useFrame((_, delta) => {
    age.current += delta;
    const g = group.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      const v = velocities[i];
      const t = age.current;
      child.position.set(
        position[0] + v.x * t,
        position[1] + v.y * t - 2.5 * t * t,
        position[2] + v.z * t,
      );
      child.scale.setScalar(Math.max(0.05, 1 - t * 1.4));
    });
  });

  return (
    <group ref={group}>
      {velocities.map((_, i) => (
        <mesh key={i} position={position}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function ExpandingRing({
  position,
  color,
  speed = 1.8,
}: {
  position: [number, number, number];
  color: string;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta * speed;
    if (!ref.current) return;
    const s = 0.4 + t.current * 1.6;
    ref.current.scale.set(s, s, s);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, 0.7 - t.current * 0.55);
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.35, 0.48, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

function GlowRing({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 6) * 0.08;
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} position={[position[0], 0.08, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.72, 28]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

function RegionWash({
  cells,
  rows,
  cols,
  color,
}: {
  cells: Array<[number, number]>;
  rows: number;
  cols: number;
  color: string;
}) {
  const ref = useRef(0);
  useFrame((_, delta) => {
    ref.current = Math.min(1, ref.current + delta * 1.4);
  });
  return (
    <group>
      {cells.map(([r, c]) => {
        const [x, , z] = cellWorldPos(r, c, rows, cols);
        return (
          <mesh
            key={`${r}-${c}`}
            position={[x, 0.12, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[DEFAULT_CELL_SIZE * 0.9, DEFAULT_CELL_SIZE * 0.9]} />
            <meshBasicMaterial color={color} transparent opacity={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

function ConfettiRain({ color }: { color: string }) {
  const count = 28;
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (Math.random() - 0.5) * 10,
        y: 4 + Math.random() * 6,
        z: (Math.random() - 0.5) * 8 - 1,
        speed: 1.5 + (i % 5) * 0.3,
      })),
    [],
  );
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      const seed = seeds[i];
      child.position.y -= delta * seed.speed;
      child.position.x += Math.sin(i + child.position.y) * delta * 0.4;
      if (child.position.y < -1) child.position.y = 8;
    });
  });

  return (
    <group ref={group}>
      {seeds.map((seed, i) => (
        <mesh key={i} position={[seed.x, seed.y, seed.z]}>
          <boxGeometry args={[0.12, 0.12, 0.04]} />
          <meshBasicMaterial color={i % 2 ? color : "#FF8A65"} />
        </mesh>
      ))}
    </group>
  );
}

function FailureDeflate({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    if (!ref.current) return;
    const s = Math.max(0.15, 1 - t.current * 0.9);
    ref.current.scale.set(1.2, s, 1.2);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, 0.55 - t.current * 0.35);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.55, 12, 12]} />
      <meshBasicMaterial color="#ef5350" transparent opacity={0.55} />
    </mesh>
  );
}

export function EffectLayer({
  effect,
  effectColor,
  activeCell,
  regionCells,
  gridRows,
  gridCols,
  resultOverlay = false,
}: EffectLayerProps) {
  const resolved = resolveEffect(effect);
  const color = effectColor || "#ffffff";
  const activePos =
    activeCell && gridRows > 0 && gridCols > 0
      ? cellWorldPos(activeCell.row, activeCell.col, gridRows, gridCols)
      : null;

  return (
    <group>
      {resolved.overlay === "queue_glow" && activePos && (
        <GlowRing position={activePos} color={color || "#29B6F6"} />
      )}
      {(resolved.overlay === "infection_poof" ||
        resolved.overlay === "cell_pulse" ||
        resolved.overlay === "bounce") &&
        activePos && (
          <>
            {resolved.overlay === "infection_poof" && (
              <ParticleBurst position={activePos} color={color || "#8E24AA"} />
            )}
            {resolved.overlay === "bounce" && (
              <ExpandingRing position={activePos} color={color || "#AB47BC"} speed={2.4} />
            )}
          </>
        )}
      {resolved.overlay === "frontier_wave" && activePos && (
        <ExpandingRing position={activePos} color={color || "#42A5F5"} />
      )}
      {resolved.overlay === "island_discovery" && regionCells && regionCells.length > 0 && (
        <RegionWash
          cells={regionCells}
          rows={gridRows}
          cols={gridCols}
          color={color || "#66BB6A"}
        />
      )}
      {resolved.overlay === "path_reveal" && activePos && (
        <GlowRing position={activePos} color={color || "#FFD54F"} />
      )}
      {resolved.overlay === "result_reveal" && activePos && (
        <GlowRing position={activePos} color={color || "#66BB6A"} />
      )}
      {(resolved.overlay === "confetti" || (resultOverlay && effect === "confetti")) && (
        <ConfettiRain color={color || "#FFD93D"} />
      )}
      {(resolved.overlay === "failure_deflate" ||
        (resultOverlay && effect === "failure_deflate")) &&
        (activePos ? (
          <FailureDeflate position={activePos} />
        ) : (
          <FailureDeflate position={[0, 0.8, -1]} />
        ))}
    </group>
  );
}
