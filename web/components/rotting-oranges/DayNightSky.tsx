"use client";

import { useMemo } from "react";
import { Sky, Stars } from "@react-three/drei";

type DayNightSkyProps = {
  /** 0-based day from simulation loop; null = default daytime (intro) */
  dayIndex: number | null;
};

const DAY_PRESETS = [
  { sunY: 25, turbidity: 4, rayleigh: 0.45, ambient: 0.65, stars: false, fog: "#9fd4f8" },
  { sunY: 40, turbidity: 6, rayleigh: 0.5, ambient: 0.75, stars: false, fog: "#87ceeb" },
  { sunY: 8, turbidity: 8, rayleigh: 0.8, ambient: 0.45, stars: false, fog: "#f0a060" },
  { sunY: -15, turbidity: 10, rayleigh: 1.2, ambient: 0.22, stars: true, fog: "#1a2744" },
] as const;

export function DayNightSky({ dayIndex }: DayNightSkyProps) {
  const preset = useMemo(() => {
    if (dayIndex === null) return DAY_PRESETS[1];
    return DAY_PRESETS[dayIndex % DAY_PRESETS.length];
  }, [dayIndex]);

  return (
    <>
      <color attach="background" args={[preset.fog]} />
      <fog attach="fog" args={[preset.fog, 14, 55]} />
      <Sky
        sunPosition={[80, preset.sunY, 40]}
        turbidity={preset.turbidity}
        rayleigh={preset.rayleigh}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      {preset.stars && (
        <Stars radius={70} depth={40} count={1400} factor={3} fade speed={0.3} />
      )}
      <ambientLight intensity={preset.ambient} />
    </>
  );
}

export function dayLabel(dayIndex: number | null): string | null {
  if (dayIndex === null) return null;
  return `Day ${dayIndex + 1}`;
}
