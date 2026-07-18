"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";

type FloatingCodeTextProps = {
  code: string;
};

export function FloatingCodeText({ code }: FloatingCodeTextProps) {
  const preview = useMemo(() => {
    return code
      .split("\n")
      .slice(0, 8)
      .map((line) => (line.length > 42 ? `${line.slice(0, 42)}…` : line))
      .join("\n");
  }, [code]);

  return (
    <group position={[-4.5, 0, -2]}>
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[3.2, 2.4, 0.25]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 1.2, 0.14]}>
        <planeGeometry args={[2.9, 2.1]} />
        <meshStandardMaterial color="#0f172a" emissive="#0b1220" emissiveIntensity={0.4} />
      </mesh>
      <Text
        position={[-1.25, 2.05, 0.16]}
        fontSize={0.11}
        color="#22c55e"
        anchorX="left"
        anchorY="top"
        maxWidth={2.7}
        lineHeight={1.25}
      >
        {preview}
      </Text>
      <Text
        position={[0, 0.35, 0.16]}
        fontSize={0.12}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        Sacred Terminal
      </Text>
    </group>
  );
}
