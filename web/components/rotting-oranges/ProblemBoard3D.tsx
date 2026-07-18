"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

type ProblemBoard3DProps = {
  open: boolean;
  openAmountRef: React.MutableRefObject<number>;
};

export function ProblemBoard3D({ open, openAmountRef }: ProblemBoard3DProps) {
  const hingeRef = useRef<THREE.Group>(null);
  const targetOpen = useRef(open ? 1 : 0);

  useFrame((_, delta) => {
    targetOpen.current = open ? 1 : 0;
    openAmountRef.current = THREE.MathUtils.lerp(
      openAmountRef.current,
      targetOpen.current,
      1 - Math.exp(-10 * delta),
    );
    if (hingeRef.current) {
      hingeRef.current.rotation.x = THREE.MathUtils.lerp(0.15, -1.05, openAmountRef.current);
    }
  });

  return (
    <group position={[4.8, 0, 0.3]} rotation={[0, -Math.PI / 2.2, 0]}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.18, 1.3, 0.18]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>

      <group ref={hingeRef} position={[0, 1.25, 0]}>
        <mesh position={[0, 0.55, 0.04]} castShadow>
          <boxGeometry args={[2.2, 1.15, 0.1]} />
          <meshStandardMaterial color="#ffd93d" />
        </mesh>
        <mesh position={[0, 0.55, 0.1]}>
          <boxGeometry args={[2.05, 1.0, 0.06]} />
          <meshStandardMaterial color="#fff8e1" />
        </mesh>

        <Text
          position={[0, 0.75, 0.12]}
          fontSize={0.16}
          color="#333"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.85}
          textAlign="center"
          fontWeight="bold"
        >
          {open ? "994 · Rotting Oranges" : "?"}
        </Text>
      </group>

      <Text position={[0, 0.2, 0.35]} fontSize={0.09} color="#333" anchorX="center">
        Press P
      </Text>
    </group>
  );
}
