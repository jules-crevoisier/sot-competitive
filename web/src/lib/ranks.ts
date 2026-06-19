// Échelle de rangs façon "Lounge" : seuils de MMR -> rang pirate thématique.

export type Rank = {
  name: string;
  short: string;
  min: number;
  color: string; // couleur d'accent (hex)
  emblem: "bilge" | "deckhand" | "sailor" | "bosun" | "corsair" | "captain" | "legend";
};

// Du plus bas au plus haut. `min` = MMR plancher.
export const RANKS: Rank[] = [
  { name: "Fond de cale", short: "Cale", min: 0, color: "#6b7b80", emblem: "bilge" },
  { name: "Mousse", short: "Mousse", min: 1300, color: "#9c7b46", emblem: "deckhand" },
  { name: "Matelot", short: "Matelot", min: 1500, color: "#b9c2c4", emblem: "sailor" },
  { name: "Maître d'équipage", short: "Bosco", min: 1750, color: "#3fa796", emblem: "bosun" },
  { name: "Corsaire", short: "Corsaire", min: 2000, color: "#c8a24b", emblem: "corsair" },
  { name: "Capitaine", short: "Capitaine", min: 2300, color: "#e6c168", emblem: "captain" },
  { name: "Légende des Mers", short: "Légende", min: 2600, color: "#c9463c", emblem: "legend" },
];

export function rankForMmr(mmr: number): Rank {
  let result = RANKS[0];
  for (const r of RANKS) if (mmr >= r.min) result = r;
  return result;
}

/** Progression (0..1) vers le rang suivant, et le rang cible. */
export function rankProgress(mmr: number): { pct: number; next?: Rank } {
  const idx = RANKS.findLastIndex((r) => mmr >= r.min);
  const current = RANKS[idx];
  const next = RANKS[idx + 1];
  if (!next) return { pct: 1 };
  const pct = (mmr - current.min) / (next.min - current.min);
  return { pct: Math.max(0, Math.min(1, pct)), next };
}
