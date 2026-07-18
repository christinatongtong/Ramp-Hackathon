"use client";

import dynamic from "next/dynamic";
import type { GridWorldProps } from "./types";
import type { VisualPlan } from "@/lib/api/types";
import { getTheme } from "@/lib/api/types";

const loading = (
  <div className="flex h-full items-center justify-center bg-[#7ecbff] text-slate-800">
    Loading world…
  </div>
);

const FarmWorld = dynamic(
  () => import("./FarmWorld").then((mod) => mod.FarmWorld),
  { ssr: false, loading: () => loading },
);

const IslandWorld = dynamic(
  () => import("./IslandWorld").then((mod) => mod.IslandWorld),
  { ssr: false, loading: () => loading },
);

const GenericGridWorld = dynamic(
  () => import("./GenericGridWorld").then((mod) => mod.GenericGridWorld),
  { ssr: false, loading: () => loading },
);

export type WorldRendererProps = Omit<GridWorldProps, "visualPlan"> & {
  visualPlan: VisualPlan;
};

/**
 * Selects a theme preset skin for grid structure scenes.
 * Unsupported / future presets fall back to GenericGridWorld.
 */
export function WorldRenderer({ visualPlan, ...rest }: WorldRendererProps) {
  const preset = getTheme(visualPlan).preset;

  switch (preset) {
    case "farm":
      return <FarmWorld visualPlan={visualPlan} {...rest} />;
    case "island":
      return <IslandWorld visualPlan={visualPlan} {...rest} />;
    case "generic_grid":
    case "mountain":
    case "maze":
    default:
      return <GenericGridWorld visualPlan={visualPlan} {...rest} />;
  }
}
