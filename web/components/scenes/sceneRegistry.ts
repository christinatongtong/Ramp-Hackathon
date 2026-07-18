import type { ComponentType } from "react";
import type { GridWorldProps } from "@/components/worlds/types";
import type { ArraySceneProps } from "./array/types";

export type GridSceneProps = GridWorldProps;
export type { ArraySceneProps };

export type SceneComponentProps = GridSceneProps | ArraySceneProps;

export type SceneRendererEntry = {
  type: string;
  component: ComponentType<SceneComponentProps>;
};
