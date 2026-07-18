export type AvatarId = "blue" | "orange" | "purple" | "mint" | "cherry" | "ninja";

export type AvatarHat = "none" | "beanie" | "spike";

export type AvatarDefinition = {
  id: AvatarId;
  name: string;
  bodyColor: string;
  skinColor: string;
  hat: AvatarHat;
  hatColor?: string;
  /** Swatch for UI picker */
  swatch: string;
};

export const AVATARS: AvatarDefinition[] = [
  {
    id: "blue",
    name: "Sky Runner",
    bodyColor: "#6ea8ff",
    skinColor: "#ffd6a5",
    hat: "none",
    swatch: "#6ea8ff",
  },
  {
    id: "orange",
    name: "Citrus Drop",
    bodyColor: "#ff8c42",
    skinColor: "#ffe0bd",
    hat: "beanie",
    hatColor: "#ff6b6b",
    swatch: "#ff8c42",
  },
  {
    id: "purple",
    name: "Graph Ghost",
    bodyColor: "#a78bfa",
    skinColor: "#f5d0fe",
    hat: "spike",
    hatColor: "#7c3aed",
    swatch: "#a78bfa",
  },
  {
    id: "mint",
    name: "BFS Sprout",
    bodyColor: "#4ade80",
    skinColor: "#fde68a",
    hat: "beanie",
    hatColor: "#15803d",
    swatch: "#4ade80",
  },
  {
    id: "cherry",
    name: "Stack Overflow",
    bodyColor: "#f472b6",
    skinColor: "#fecdd3",
    hat: "none",
    swatch: "#f472b6",
  },
  {
    id: "ninja",
    name: "Night Commit",
    bodyColor: "#334155",
    skinColor: "#cbd5e1",
    hat: "spike",
    hatColor: "#0f172a",
    swatch: "#334155",
  },
];

export const DEFAULT_AVATAR_ID: AvatarId = "blue";

export function getAvatar(id: AvatarId): AvatarDefinition {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}
