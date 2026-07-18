"use client";

import { Text } from "@react-three/drei";
import { EffectLayer } from "./EffectLayer";

type ResultChoreographyProps = {
  active: boolean;
  effect: string | null;
  effectColor?: string | null;
  explanation?: string | null;
  passed?: boolean;
  gridRows: number;
  gridCols: number;
};

export function ResultChoreography({
  active,
  effect,
  effectColor,
  explanation,
  passed,
  gridRows,
  gridCols,
}: ResultChoreographyProps) {
  if (!active) return null;

  return (
    <group>
      <EffectLayer
        effect={effect}
        effectColor={effectColor}
        activeCell={null}
        regionCells={null}
        gridRows={gridRows}
        gridCols={gridCols}
        resultOverlay
      />
      <Text
        position={[0, 4.2, 0]}
        fontSize={0.42}
        color={passed ? "#C8FACC" : "#FFCDD2"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#1f2937"
      >
        {passed ? "Success!" : "Not quite…"}
      </Text>
      {explanation && (
        <Text
          position={[0, 3.5, 0]}
          fontSize={0.22}
          color="#fff7e6"
          anchorX="center"
          anchorY="middle"
          maxWidth={8}
          outlineWidth={0.015}
          outlineColor="#1f2937"
        >
          {explanation}
        </Text>
      )}
    </group>
  );
}
