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

export const PROBLEMS: ProblemEntry[] = [
  {
    id: "rotting-oranges",
    number: 994,
    title: "Rotting Oranges",
    slug: "/world/rotting-oranges",
    available: true,
    theme: "Orange grove farm",
    position: [0, 0, -4.5],
    color: "#ff8c00",
  },
  {
    id: "number-of-islands",
    number: 200,
    title: "Number of Islands",
    slug: null,
    available: false,
    theme: "Archipelago sea",
    position: [-4, 0, -2],
    color: "#38bdf8",
  },
  {
    id: "pacific-water",
    number: 417,
    title: "Pacific Atlantic Water Flow",
    slug: null,
    available: false,
    theme: "Coastal watershed",
    position: [4, 0, -2],
    color: "#22d3ee",
  },
  {
    id: "shortest-path",
    number: 743,
    title: "Network Delay Time",
    slug: null,
    available: false,
    theme: "Signal tower hills",
    position: [0, 0, 1.5],
    color: "#a78bfa",
  },
];
