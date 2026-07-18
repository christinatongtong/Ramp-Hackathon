"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { LIST_SPACING } from "./types";
import { nodePosition } from "./ListNodeLayer";

const POINTER_COLORS: Record<string, string> = {
  prev: "#42A5F5",
  curr: "#FFD54F",
  next: "#EF5350",
  head: "#AB47BC",
};

function NullSlot({ layoutOrder }: { layoutOrder: string[] }) {
  const count = Math.max(1, layoutOrder.length);
  return [((count - 1) / 2 + 1.05) * LIST_SPACING, 1.7, 0] as [
    number,
    number,
    number,
  ];
}

function NamedPointer({
  name,
  nodeId,
  layoutOrder,
  hop,
}: {
  name: string;
  nodeId: string | null;
  layoutOrder: string[];
  hop: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const color = POINTER_COLORS[name] ?? "#AB47BC";
  const target =
    nodeId == null
      ? NullSlot({ layoutOrder })
      : (() => {
          const p = nodePosition(nodeId, layoutOrder);
          return [p[0], 1.7, p[2]] as [number, number, number];
        })();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.x += (target[0] - ref.current.position.x) * 0.18;
    ref.current.position.z += (target[2] - ref.current.position.z) * 0.18;
    const bob = hop ? Math.sin(state.clock.elapsedTime * 10) * 0.12 : 0;
    ref.current.position.y = target[1] + bob;
  });

  return (
    <group ref={ref} position={target}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.2, 0.38, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.42, 0]}
        fontSize={0.2}
        color={color}
        anchorX="center"
      >
        {name}
        {nodeId == null ? "→null" : ""}
      </Text>
    </group>
  );
}

export function ListPointerLayer({
  pointers,
  layoutOrder,
  hop = false,
}: {
  pointers: Record<string, string | null>;
  layoutOrder: string[];
  hop?: boolean;
}) {
  return (
    <group>
      {Object.entries(pointers).map(([name, nodeId]) => (
        <NamedPointer
          key={name}
          name={name}
          nodeId={nodeId}
          layoutOrder={layoutOrder}
          hop={hop}
        />
      ))}
    </group>
  );
}
