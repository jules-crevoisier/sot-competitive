export function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

export function flag(country?: string | null): string {
  if (!country) return "🏴‍☠️";
  return country
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export const STATUS_LABEL: Record<string, string> = {
  AWAITING_PROOF: "En attente de preuve",
  AWAITING_VALIDATION: "À valider",
  VALIDATED: "Validé",
  DISPUTED: "Litige",
  CANCELLED: "Annulé",
};

export const STATUS_COLOR: Record<string, string> = {
  AWAITING_PROOF: "var(--color-fog)",
  AWAITING_VALIDATION: "var(--color-brass)",
  VALIDATED: "var(--color-verdigris)",
  DISPUTED: "var(--color-blood-bright)",
  CANCELLED: "var(--color-fog-deep)",
};
