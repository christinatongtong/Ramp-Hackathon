"use client";

import type { ReactNode } from "react";
import type { EntityRendererProps } from "./renderers/types";
import { DestinationEntity } from "./renderers/DestinationEntity";
import { FallbackEntity } from "./renderers/FallbackEntity";
import { FruitEntity } from "./renderers/FruitEntity";
import { HeightBlockEntity } from "./renderers/HeightBlockEntity";
import { LandEntity } from "./renderers/LandEntity";
import { WallEntity } from "./renderers/WallEntity";
import { WaterEntity } from "./renderers/WaterEntity";

export type EntityRenderer = (props: EntityRendererProps) => ReactNode;

const ALIASES: Record<string, string> = {
  orange: "fruit",
  floor_tile: "land",
};

export const ENTITY_RENDERERS: Record<string, EntityRenderer> = {
  fruit: FruitEntity,
  orange: FruitEntity,
  land: LandEntity,
  floor_tile: LandEntity,
  water: WaterEntity,
  wall: WallEntity,
  destination: DestinationEntity,
  height_block: HeightBlockEntity,
  empty_tile: FallbackEntity,
};

export function resolveEntityRenderer(primitive: string): EntityRenderer {
  const key = ALIASES[primitive] ?? primitive;
  return ENTITY_RENDERERS[key] ?? ENTITY_RENDERERS[primitive] ?? FallbackEntity;
}

export {
  DestinationEntity,
  FallbackEntity,
  FruitEntity,
  HeightBlockEntity,
  LandEntity,
  WallEntity,
  WaterEntity,
};
