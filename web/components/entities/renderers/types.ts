import type { EntityDefinition } from "@/lib/api/types";

export type EntityRendererProps = {
  entity: EntityDefinition;
  value: string | number;
  active: boolean;
  pulse?: boolean;
  cellSize?: number;
};

export const DEFAULT_CELL_SIZE = 1.35;
