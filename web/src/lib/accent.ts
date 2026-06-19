export type Accent = "brass" | "verdigris" | "blood";

export const ACCENT: Record<Accent, { color: string; soft: string; deep: string }> = {
  brass: { color: "#c8a24b", soft: "rgba(200,162,75,0.12)", deep: "#7c5f25" },
  verdigris: { color: "#3fa796", soft: "rgba(63,167,150,0.12)", deep: "#1f6157" },
  blood: { color: "#c9463c", soft: "rgba(163,47,40,0.14)", deep: "#6e1f1a" },
};
