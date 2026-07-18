"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";
import type { Grid } from "@/lib/rotting-oranges/types";

const CELL_SIZE = 1.35;

type OrangeGridProps = {
  grid: Grid;
  pulse?: boolean;
};

function cellColor(value: number, pulse: boolean) {
  if (value === 2) return pulse ? "#5c2f0a" : "#3d2314";
  if (value === 1) return pulse ? "#ffb347" : "#ff8c00";
  return "#4a7c59";
}

export function OrangeGrid({ grid, pulse = false }: OrangeGridProps) {
  const origin = useMemo(() => {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    return {
      x: -((cols - 1) * CELL_SIZE) / 2,
      z: -((rows - 1) * CELL_SIZE) / 2,
    };
  }, [grid]);

  return (
    <group position={[0, 0.05, -1]}>
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const x = origin.x + colIndex * CELL_SIZE;
          const z = origin.z + rowIndex * CELL_SIZE;

          return (
            <group key={`${rowIndex}-${colIndex}`} position={[x, 0, z]}>
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[CELL_SIZE * 0.95, CELL_SIZE * 0.95]} />
                <meshStandardMaterial color={cell === 0 ? "#6b5344" : "#7cb342"} />
              </mesh>

              {cell !== 0 && (
                <mesh castShadow position={[0, 0.45, 0]}>
                  <sphereGeometry args={[0.38, 20, 20]} />
                  <meshStandardMaterial
                    color={cellColor(cell, pulse && cell === 2)}
                    emissive={cell === 2 ? "#2a1204" : "#000000"}
                    emissiveIntensity={cell === 2 ? 0.35 : 0}
                  />
                </mesh>
              )}

              {cell === 2 && (
                <mesh position={[0, 0.9, 0]}>
                  <sphereGeometry args={[0.08, 8, 8]} />
                  <meshStandardMaterial color="#1a1a1a" emissive="#111111" />
                </mesh>
              )}
            </group>
          );
        }),
      )}

      <Text
        position={[0, 2.8, -2.2]}
        fontSize={0.35}
        color="#fff7e6"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#1f2937"
      >
        Orange Grove Grid
      </Text>
    </group>
  );
}

export { CELL_SIZE };
