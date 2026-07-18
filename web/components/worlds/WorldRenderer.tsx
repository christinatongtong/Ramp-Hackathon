"use client";

import dynamic from "next/dynamic";
import type { FarmWorldProps } from "./FarmWorld";
import type { VisualPlan } from "@/lib/api/types";

const FarmWorld = dynamic(
  () => import("./FarmWorld").then((mod) => mod.FarmWorld),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#7ecbff] text-slate-800">
        Loading world…
      </div>
    ),
  },
);

const GenericGridWorld = dynamic(
  () => import("./FarmWorld").then((mod) => mod.FarmWorld),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#7ecbff] text-slate-800">
        Loading world…
      </div>
    ),
  },
);

export type WorldRendererProps = Omit<FarmWorldProps, "visualPlan"> & {
  visualPlan: VisualPlan;
};

/**
 * Selects a hardcoded world preset from visualPlan.world.preset.
 * Only farm is fully implemented; other presets fall back to FarmWorld
 * until dedicated scenes exist.
 */
export function WorldRenderer({ visualPlan, ...rest }: WorldRendererProps) {
  const preset = visualPlan.world.preset;

  switch (preset) {
    case "farm":
      return <FarmWorld visualPlan={visualPlan} {...rest} />;
    case "island":
    case "mountain":
    case "maze":
    case "generic_grid":
    default:
      return <GenericGridWorld visualPlan={visualPlan} {...rest} />;
  }
}
