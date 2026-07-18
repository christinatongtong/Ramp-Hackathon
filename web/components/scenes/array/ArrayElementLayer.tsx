"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { EntityDefinition, ProblemSemanticSpec } from "@/lib/api/types";
import { ARRAY_BLOCK_SIZE, ARRAY_SPACING } from "./types";

function resolveEntity(
  value: number,
  entities: Record<string, EntityDefinition>,
  semanticSpec?: ProblemSemanticSpec | null,
): EntityDefinition | null {
  const key = String(value);
  if (semanticSpec?.bindings?.length) {
    const binding = semanticSpec.bindings.find((b) => b.value === key);
    if (binding && entities[binding.semanticKey]) {
      return entities[binding.semanticKey];
    }
  }
  return entities[key] ?? entities.default ?? entities.value ?? null;
}

function indexX(index: number, count: number): number {
  return (index - (count - 1) / 2) * ARRAY_SPACING;
}

function ArrayBlock({
  value,
  index,
  count,
  entity,
  active,
  finalized,
  pulse,
  layout,
}: {
  value: number;
  index: number;
  count: number;
  entity: EntityDefinition | null;
  active: boolean;
  finalized: boolean;
  pulse: boolean;
  layout: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const color = entity?.color ?? (finalized ? "#66BB6A" : "#90CAF9");
  const isBar = layout === "bars" || entity?.primitive === "array_bar";
  const barHeight = isBar
    ? Math.max(0.4, Math.min(3.2, Math.abs(value) * 0.18 + 0.5))
    : ARRAY_BLOCK_SIZE;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    let y = 0;
    if (pulse && active) y = Math.sin(t * 8) * 0.08;
    if (entity?.idleAnimation === "gentle_bounce") {
      y += Math.sin(t * 2.5 + index) * 0.04;
    }
    ref.current.position.y = y;
    const s = active && pulse ? 1.08 : 1;
    ref.current.scale.setScalar(s);
  });

  return (
    <group ref={ref} position={[indexX(index, count), 0, 0]}>
      <mesh castShadow receiveShadow position={[0, barHeight / 2, 0]}>
        <boxGeometry
          args={
            isBar
              ? [ARRAY_BLOCK_SIZE * 0.7, barHeight, ARRAY_BLOCK_SIZE * 0.7]
              : [ARRAY_BLOCK_SIZE, ARRAY_BLOCK_SIZE, ARRAY_BLOCK_SIZE]
          }
        />
        <meshStandardMaterial
          color={color}
          emissive={active ? color : "#000000"}
          emissiveIntensity={active ? 0.25 : 0}
        />
      </mesh>
      <Text
        position={[0, barHeight + 0.35, 0]}
        fontSize={0.32}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>
    </group>
  );
}

export function ArrayElementLayer({
  values,
  entities,
  semanticSpec,
  activeIndices,
  finalized,
  pulse,
  layout = "horizontal",
  showIndices = true,
}: {
  values: number[];
  entities: Record<string, EntityDefinition>;
  semanticSpec?: ProblemSemanticSpec | null;
  activeIndices: number[] | null;
  finalized: number[];
  pulse: boolean;
  layout?: string;
  showIndices?: boolean;
}) {
  const activeSet = useMemo(
    () => new Set(activeIndices ?? []),
    [activeIndices],
  );
  const finalizedSet = useMemo(() => new Set(finalized), [finalized]);
  const count = values.length;

  return (
    <group>
      {values.map((value, index) => (
        <group key={index}>
          <ArrayBlock
            value={value}
            index={index}
            count={count}
            entity={resolveEntity(value, entities, semanticSpec)}
            active={activeSet.has(index)}
            finalized={finalizedSet.has(index)}
            pulse={pulse}
            layout={layout}
          />
          {showIndices && (
            <Text
              position={[indexX(index, count), -0.55, 0]}
              fontSize={0.22}
              color="#64748b"
              anchorX="center"
              anchorY="middle"
            >
              {String(index)}
            </Text>
          )}
        </group>
      ))}
    </group>
  );
}
