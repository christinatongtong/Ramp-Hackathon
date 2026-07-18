import type { ProblemSummary } from "@/lib/api/types";

export type ProblemEntry = {
  id: string;
  number: number;
  title: string;
  slug: string | null;
  available: boolean;
  theme: string;
  position: [number, number, number];
  color: string;
};

const HUB_LAYOUT: Array<{
  position: [number, number, number];
  color: string;
  themeFallback: string;
}> = [
  { position: [0, 0, -4.5], color: "#ff8c00", themeFallback: "Algorithm world" },
  { position: [-4, 0, -2], color: "#38bdf8", themeFallback: "Island seas" },
  { position: [4, 0, -2], color: "#22d3ee", themeFallback: "Coastal heights" },
  { position: [0, 0, 1.5], color: "#a78bfa", themeFallback: "Binary maze" },
  { position: [-3.5, 0, 2.2], color: "#f472b6", themeFallback: "Search lane" },
  { position: [3.5, 0, 2.2], color: "#facc15", themeFallback: "Two pointers" },
  { position: [-2, 0, 4.5], color: "#34d399", themeFallback: "Rewire rails" },
  { position: [2, 0, 4.5], color: "#fb7185", themeFallback: "Tree canopy" },
  { position: [-5, 0, 0.5], color: "#60a5fa", themeFallback: "Course graph" },
  { position: [5, 0, 0.5], color: "#c084fc", themeFallback: "Mystery world" },
  { position: [0, 0, 6.5], color: "#2dd4bf", themeFallback: "Mystery world" },
];

/** Map backend problem summaries into hub portal entries. */
export function toProblemEntries(summaries: ProblemSummary[]): ProblemEntry[] {
  return summaries.map((summary, index) => {
    const layout = HUB_LAYOUT[index % HUB_LAYOUT.length];
    const available = summary.hasVisualPlan;
    return {
      id: summary.id,
      number: summary.number ?? index + 1,
      title: summary.title,
      slug: available ? `/world/${summary.id}` : null,
      available,
      theme: summary.algorithm.join(" · ") || layout.themeFallback,
      position: layout.position,
      color: layout.color,
    };
  });
}
