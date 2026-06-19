// Moteur MMR — ELO par équipe, adapté du modèle MK8DX Lounge.
// On calcule sur la moyenne MMR de chaque camp, puis on applique le delta à chaque
// joueur du camp. K plus élevé pendant les matchs de placement.

const BASE_K = 32;
const PLACEMENT_K = 48;
// Plancher : tout match doit bouger le MMR d'au moins ça (gain pour le vainqueur,
// perte pour le perdant), pour que chaque partie compte — convention type Lounge.
const MIN_SWING = 5;

export type Side = {
  /** MMR de chaque joueur du camp, dans l'ordre. */
  mmrs: number[];
  /** true si le camp a gagné. */
  won: boolean;
  /** nb de placements restants par joueur (parallèle à mmrs). */
  placementsLeft: number[];
};

export type MmrResult = {
  /** delta par joueur, parallèle à l'entrée mmrs. */
  deltas: number[];
};

function expectedScore(rA: number, rB: number): number {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

function avg(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
}

/**
 * Calcule les deltas MMR pour les deux camps d'un match terminé.
 * `marginBonus` (0..1) amplifie légèrement le gain selon l'écart de score (domination).
 */
export function computeMatch(
  teamA: Side,
  teamB: Side,
  marginBonus = 0,
): { a: MmrResult; b: MmrResult } {
  const ratingA = avg(teamA.mmrs);
  const ratingB = avg(teamB.mmrs);

  const expA = expectedScore(ratingA, ratingB);
  const expB = 1 - expA;

  const scoreA = teamA.won ? 1 : 0;
  const scoreB = teamB.won ? 1 : 0;

  const marginMult = 1 + Math.min(0.5, Math.max(0, marginBonus) * 0.5);

  const deltaFor = (
    side: Side,
    exp: number,
    score: number,
  ): number[] =>
    side.mmrs.map((_, i) => {
      const k = side.placementsLeft[i] > 0 ? PLACEMENT_K : BASE_K;
      const raw = Math.round(k * (score - exp) * marginMult);
      // Le vainqueur gagne au moins MIN_SWING, le perdant en perd au moins autant.
      if (side.won) return Math.max(raw, MIN_SWING);
      return Math.min(raw, -MIN_SWING);
    });

  return {
    a: { deltas: deltaFor(teamA, expA, scoreA) },
    b: { deltas: deltaFor(teamB, expB, scoreB) },
  };
}

/** Aperçu symétrique simple : combien gagne/perd A face à B (1v1, hors placement). */
export function previewSwing(mmrA: number, mmrB: number): { win: number; loss: number } {
  const exp = expectedScore(mmrA, mmrB);
  return {
    win: Math.round(BASE_K * (1 - exp)),
    loss: Math.round(BASE_K * (0 - exp)),
  };
}
