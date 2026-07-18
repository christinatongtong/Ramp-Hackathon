"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LIST_NODE_SIZE, LIST_SPACING, type ListNodeState } from "./types";
import { nodePosition } from "./ListNodeLayer";

function NullEndpoint({
  layoutOrder,
}: {
  layoutOrder: string[];
}) {
  const count = Math.max(1, layoutOrder.length);
  const x = ((count - 1) / 2 + 1.05) * LIST_SPACING;
  return (
    <group position={[x, 0.55, 0]}>
      <mesh>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.55} />
      </mesh>
      <Text
        position={[0, 0.55, 0]}
        fontSize={0.22}
        color="#64748b"
        anchorX="center"
      >
        null
      </Text>
    </group>
  );
}

function ArrowEdge({
  from,
  to,
  breaking,
  connecting,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  breaking: boolean;
  connecting: boolean;
  color: string;
}) {
  const group = useRef<THREE.Group>(null);
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const mid = useMemo(() => {
    const m = start.clone().lerp(end, 0.5);
    m.y += 0.15;
    return m;
  }, [start, end]);

  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(start, mid, end),
    [start, mid, end],
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    if (breaking) {
      group.current.position.y = Math.sin(t * 14) * 0.08;
      group.current.rotation.z = Math.sin(t * 10) * 0.12;
    } else if (connecting) {
      const s = 0.7 + Math.abs(Math.sin(t * 8)) * 0.35;
      group.current.scale.set(s, 1, 1);
    } else {
      group.current.position.y = 0;
      group.current.rotation.z = 0;
      group.current.scale.set(1, 1, 1);
    }
  });

  const dir = end.clone().sub(start);
  const len = Math.max(0.2, dir.length() - LIST_NODE_SIZE * 0.7);

  return (
    <group ref={group}>
      <mesh>
        <tubeGeometry args={[curve, 16, breaking ? 0.03 : 0.05, 8, false]} />
        <meshStandardMaterial
          color={color}
          emissive={breaking || connecting ? color : "#000000"}
          emissiveIntensity={breaking || connecting ? 0.4 : 0}
        />
      </mesh>
      <mesh
        position={[
          start.x + (dir.x / dir.length()) * (dir.length() - 0.35),
          start.y + 0.12,
          start.z,
        ]}
        rotation={[0, 0, Math.atan2(dir.y, dir.x)]}
      >
        <coneGeometry args={[0.12, 0.28, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* shaft length used for cone placement */}
      <mesh visible={false} position={[0, -10, 0]}>
        <boxGeometry args={[len, 0.01, 0.01]} />
      </mesh>
    </group>
  );
}

export function ListEdgeLayer({
  nodes,
  layoutOrder,
  edgeHighlight,
  effect,
}: {
  nodes: ListNodeState[];
  layoutOrder: string[];
  edgeHighlight: {
    nodeId: string;
    oldNext: string | null;
    newNext: string | null;
  } | null;
  effect?: string | null;
}) {
  const byId = useMemo(() => {
    const map = new Map<string, ListNodeState>();
    for (const node of nodes) map.set(node.id, node);
    return map;
  }, [nodes]);

  const nullPos = useMemo((): [number, number, number] => {
    const count = Math.max(1, layoutOrder.length);
    return [((count - 1) / 2 + 1.05) * LIST_SPACING, 0.55, 0];
  }, [layoutOrder]);

  return (
    <group>
      <NullEndpoint layoutOrder={layoutOrder} />
      {nodes.map((node) => {
        if (!node.next && node.next !== null) return null;
        const from = nodePosition(node.id, layoutOrder);
        const to =
          node.next && byId.has(node.next)
            ? nodePosition(node.next, layoutOrder)
            : nullPos;
        // Shrink toward coupler points
        const fromAdj: [number, number, number] = [
          from[0] + LIST_NODE_SIZE * 0.55,
          from[1],
          from[2],
        ];
        const toAdj: [number, number, number] = [
          to[0] - (node.next ? LIST_NODE_SIZE * 0.55 : 0.2),
          to[1],
          to[2],
        ];
        const isHighlight = edgeHighlight?.nodeId === node.id;
        const breaking =
          isHighlight &&
          (effect === "edge_break" ||
            (edgeHighlight?.oldNext !== edgeHighlight?.newNext &&
              edgeHighlight?.newNext === null));
        const connecting =
          isHighlight &&
          (effect === "edge_connect" ||
            (edgeHighlight?.oldNext !== edgeHighlight?.newNext &&
              edgeHighlight?.newNext != null));
        return (
          <ArrowEdge
            key={`${node.id}->${node.next ?? "null"}`}
            from={fromAdj}
            to={toAdj}
            breaking={Boolean(breaking)}
            connecting={Boolean(connecting)}
            color={isHighlight ? "#FF7043" : "#78909C"}
          />
        );
      })}
    </group>
  );
}
