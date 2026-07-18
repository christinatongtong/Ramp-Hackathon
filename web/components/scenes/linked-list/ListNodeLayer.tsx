"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { EntityDefinition, ProblemSemanticSpec } from "@/lib/api/types";
import { LIST_NODE_SIZE, LIST_SPACING, type ListNodeState } from "./types";

function resolveColor(
  value: number | string,
  entities: Record<string, EntityDefinition>,
  semanticSpec?: ProblemSemanticSpec | null,
): string {
  const key = String(value);
  if (semanticSpec?.bindings?.length) {
    const binding = semanticSpec.bindings.find((b) => b.value === key);
    if (binding && entities[binding.semanticKey]) {
      return entities[binding.semanticKey].color;
    }
  }
  return entities[key]?.color ?? entities.list_node?.color ?? "#90CAF9";
}

function nodePosition(
  nodeId: string,
  layoutOrder: string[],
): [number, number, number] {
  const index = layoutOrder.indexOf(nodeId);
  const i = index >= 0 ? index : 0;
  const count = Math.max(1, layoutOrder.length);
  return [(i - (count - 1) / 2) * LIST_SPACING, 0.55, 0];
}

function ListCar({
  node,
  layoutOrder,
  color,
  active,
  finalized,
  pulse,
  completeGlow,
}: {
  node: ListNodeState;
  layoutOrder: string[];
  color: string;
  active: boolean;
  finalized: boolean;
  pulse: boolean;
  completeGlow: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const pos = nodePosition(node.id, layoutOrder);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    let y = pos[1];
    if (pulse && active) y += Math.sin(t * 9) * 0.08;
    if (completeGlow || finalized) y += Math.sin(t * 3 + pos[0]) * 0.03;
    ref.current.position.y = y;
    const s = active && pulse ? 1.08 : 1;
    ref.current.scale.setScalar(s);
  });

  return (
    <group ref={ref} position={[pos[0], pos[1], pos[2]]}>
      {/* Train-car body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[LIST_NODE_SIZE * 1.15, LIST_NODE_SIZE * 0.75, LIST_NODE_SIZE]} />
        <meshStandardMaterial
          color={color}
          emissive={active || completeGlow ? color : "#000000"}
          emissiveIntensity={active || completeGlow ? 0.28 : 0}
        />
      </mesh>
      {/* Coupler stubs */}
      <mesh position={[LIST_NODE_SIZE * 0.62, -0.05, 0]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#546E7A" />
      </mesh>
      <mesh position={[-LIST_NODE_SIZE * 0.62, -0.05, 0]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color="#546E7A" />
      </mesh>
      {/* Wheels */}
      {([-0.28, 0.28] as const).map((z) =>
        ([-0.28, 0.28] as const).map((x) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, -LIST_NODE_SIZE * 0.42, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
            <meshStandardMaterial color="#37474F" />
          </mesh>
        )),
      )}
      <Text
        position={[0, 0.08, LIST_NODE_SIZE * 0.52]}
        fontSize={0.38}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
      >
        {String(node.value)}
      </Text>
      <Text
        position={[0, -0.85, 0]}
        fontSize={0.18}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
      >
        {node.id}
      </Text>
    </group>
  );
}

export function ListNodeLayer({
  nodes,
  layoutOrder,
  entities,
  semanticSpec,
  activeNodeId,
  finalized,
  pulse,
  completeGlow = false,
}: {
  nodes: ListNodeState[];
  layoutOrder: string[];
  entities: Record<string, EntityDefinition>;
  semanticSpec?: ProblemSemanticSpec | null;
  activeNodeId: string | null;
  finalized: string[];
  pulse: boolean;
  completeGlow?: boolean;
}) {
  const finalizedSet = useMemo(() => new Set(finalized), [finalized]);

  return (
    <group>
      {nodes.map((node) => (
        <ListCar
          key={node.id}
          node={node}
          layoutOrder={layoutOrder}
          color={resolveColor(node.value, entities, semanticSpec)}
          active={activeNodeId === node.id}
          finalized={finalizedSet.has(node.id)}
          pulse={pulse}
          completeGlow={completeGlow && finalizedSet.has(node.id)}
        />
      ))}
    </group>
  );
}

export { nodePosition };
