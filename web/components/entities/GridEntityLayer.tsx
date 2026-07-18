"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";
import type { EntityDefinition, Grid } from "@/lib/api/types";

const CELL_SIZE = 1.35;

type GridEntityLayerProps = {
  grid: Grid;
  entities: Record<string, EntityDefinition>;
  pulse?: boolean;
  activeCell?: { row: number; col: number } | null;
  title?: string;
};

function isFruitPrimitive(primitive: string) {
  return primitive === "fruit" || primitive === "orange";
}

export function GridEntityLayer({
  grid,
  entities,
  pulse = false,
  activeCell = null,
  title = "Grid",
}: GridEntityLayerProps) {
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
          const entity = entities[String(cell)];
          const color = entity?.color ?? "#888888";
          const primitive = entity?.primitive ?? "empty_tile";
          const isActive =
            activeCell?.row === rowIndex && activeCell?.col === colIndex;
          const x = origin.x + colIndex * CELL_SIZE;
          const z = origin.z + rowIndex * CELL_SIZE;
          const showFruit = isFruitPrimitive(primitive);
          const showLand =
            primitive === "land" ||
            primitive === "floor_tile" ||
            primitive === "wall" ||
            primitive === "destination" ||
            primitive === "height_block";

          return (
            <group key={`${rowIndex}-${colIndex}`} position={[x, 0, z]}>
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[CELL_SIZE * 0.95, CELL_SIZE * 0.95]} />
                <meshStandardMaterial
                  color={
                    primitive === "empty_tile" || primitive === "water"
                      ? color
                      : "#7cb342"
                  }
                />
              </mesh>

              {showFruit && (
                <mesh
                  castShadow
                  position={[0, 0.45 + (pulse && isActive ? 0.08 : 0), 0]}
                  scale={pulse && isActive ? 1.12 : 1}
                >
                  <sphereGeometry args={[0.38, 20, 20]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={isActive ? color : "#000000"}
                    emissiveIntensity={isActive ? 0.35 : 0}
                  />
                </mesh>
              )}

              {showLand && (
                <mesh castShadow position={[0, 0.2, 0]}>
                  <boxGeometry args={[0.9, 0.35, 0.9]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={isActive ? color : "#000000"}
                    emissiveIntensity={isActive ? 0.25 : 0}
                  />
                </mesh>
              )}

              {entity?.idleAnimation === "sick_wobble" && showFruit && (
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
        {title}
      </Text>
    </group>
  );
}

export { CELL_SIZE };
