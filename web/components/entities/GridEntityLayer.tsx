"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";
import type { EntityDefinition, Grid } from "@/lib/api/types";
import { resolveEntityRenderer } from "./entityRegistry";
import { DEFAULT_CELL_SIZE } from "./renderers/types";

export { DEFAULT_CELL_SIZE as CELL_SIZE };

type GridEntityLayerProps = {
  grid: Grid;
  entities: Record<string, EntityDefinition>;
  pulse?: boolean;
  activeCell?: { row: number; col: number } | null;
  title?: string;
  regionCells?: Array<[number, number]> | null;
  frontierCells?: Array<[number, number]> | null;
};

function isWaterLike(primitive: string) {
  return primitive === "water" || primitive === "empty_tile";
}

export function GridEntityLayer({
  grid,
  entities,
  pulse = false,
  activeCell = null,
  title = "Grid",
  regionCells = null,
  frontierCells = null,
}: GridEntityLayerProps) {
  const origin = useMemo(() => {
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    return {
      x: -((cols - 1) * DEFAULT_CELL_SIZE) / 2,
      z: -((rows - 1) * DEFAULT_CELL_SIZE) / 2,
    };
  }, [grid]);

  const regionSet = useMemo(() => {
    const set = new Set<string>();
    for (const cell of regionCells ?? []) {
      set.add(`${cell[0]},${cell[1]}`);
    }
    return set;
  }, [regionCells]);

  const frontierSet = useMemo(() => {
    const set = new Set<string>();
    for (const cell of frontierCells ?? []) {
      set.add(`${cell[0]},${cell[1]}`);
    }
    return set;
  }, [frontierCells]);

  return (
    <group position={[0, 0.05, -1]}>
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const entity = entities[String(cell)] ?? {
            primitive: "empty_tile",
            variant: "fallback",
            color: "#888888",
            label: String(cell),
            idleAnimation: "none",
            expression: null,
          };
          const primitive = entity.primitive ?? "empty_tile";
          const isActive =
            activeCell?.row === rowIndex && activeCell?.col === colIndex;
          const key = `${rowIndex},${colIndex}`;
          const inRegion = regionSet.has(key);
          const inFrontier = frontierSet.has(key);
          const x = origin.x + colIndex * DEFAULT_CELL_SIZE;
          const z = origin.z + rowIndex * DEFAULT_CELL_SIZE;
          const EntityComponent = resolveEntityRenderer(primitive);
          const floorColor = isWaterLike(primitive)
            ? entity.color
            : "#7cb342";

          return (
            <group key={key} position={[x, 0, z]}>
              {!isWaterLike(primitive) && (
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry
                    args={[DEFAULT_CELL_SIZE * 0.95, DEFAULT_CELL_SIZE * 0.95]}
                  />
                  <meshStandardMaterial
                    color={inRegion ? entity.color : floorColor}
                    emissive={inFrontier ? "#29B6F6" : "#000000"}
                    emissiveIntensity={inFrontier ? 0.25 : 0}
                  />
                </mesh>
              )}

              <EntityComponent
                entity={entity}
                value={cell}
                active={isActive || inRegion}
                pulse={pulse}
              />
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
