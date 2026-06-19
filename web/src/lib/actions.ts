"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getMode } from "./modes";
import { computeMatch } from "./mmr";
import { getCurrentPlayer } from "./session";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function joinCode() {
  return Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
}

async function ensureRating(playerId: string, mode: string) {
  return db.rating.upsert({
    where: { playerId_mode_season: { playerId, mode, season: 1 } },
    update: {},
    create: { playerId, mode, season: 1 },
  });
}

/**
 * Forme une table de démo pour un mode : tire au sort assez de pirates classés,
 * répartit en deux équipages, crée un match en attente de preuve, puis redirige.
 * (Dans la version finale, ce sont les joueurs de la file qui sont placés ici.)
 */
export async function formTable(modeKey: string) {
  const mode = getMode(modeKey);
  if (!mode) throw new Error("Mode inconnu");
  const perTeam = modeKey === "sniper-ffa" ? 3 : mode.teamSize;
  const needed = perTeam * 2;

  // pioche parmi les joueurs ayant un classement sur ce mode
  const ratings = await db.rating.findMany({
    where: { mode: modeKey, season: 1 },
    include: { player: true },
  });
  const pool = ratings.sort(() => Math.random() - 0.5).slice(0, needed);
  if (pool.length < needed) throw new Error("Pas assez de pirates dans la file");

  const match = await db.match.create({
    data: {
      mode: modeKey,
      season: 1,
      status: "AWAITING_PROOF",
      joinCode: joinCode(),
      hostId: pool[0].playerId,
      players: {
        create: pool.map((r, i) => ({
          playerId: r.playerId,
          team: i < perTeam ? "A" : "B",
          mmrBefore: r.mmr,
        })),
      },
    },
  });

  revalidatePath("/matches");
  redirect(`/matches/${match.id}`);
}

/** Soumet un résultat : scores + preuve, passe en attente de validation. */
export async function submitResult(formData: FormData) {
  const matchId = String(formData.get("matchId"));
  const scoreA = Number(formData.get("scoreA"));
  const scoreB = Number(formData.get("scoreB"));
  const proofUrl = String(formData.get("proofUrl") || "").trim();

  if (!matchId || Number.isNaN(scoreA) || Number.isNaN(scoreB)) throw new Error("Données invalides");
  if (scoreA === scoreB) throw new Error("Un match ranked ne peut pas finir à égalité");

  await db.match.update({
    where: { id: matchId },
    data: {
      scoreA,
      scoreB,
      winner: scoreA > scoreB ? "A" : "B",
      proofUrl: proofUrl || "/proof/scoreboard-demo.png",
      status: "AWAITING_VALIDATION",
      playedAt: new Date(),
    },
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/admin");
}

/** Valide un match en attente : calcule et applique le MMR, met à jour les classements. */
export async function validateMatch(formData: FormData) {
  const matchId = String(formData.get("matchId"));
  const validatorId = formData.get("validatorId") ? String(formData.get("validatorId")) : undefined;

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { players: true },
  });
  if (!match || !match.winner) throw new Error("Match introuvable ou sans vainqueur");
  if (match.status === "VALIDATED") return;

  const A = match.players.filter((p) => p.team === "A");
  const B = match.players.filter((p) => p.team === "B");

  const ratingsA = await Promise.all(A.map((p) => ensureRating(p.playerId, match.mode)));
  const ratingsB = await Promise.all(B.map((p) => ensureRating(p.playerId, match.mode)));

  const aWon = match.winner === "A";
  const margin = Math.abs(match.scoreA - match.scoreB) / Math.max(1, Math.max(match.scoreA, match.scoreB));

  const res = computeMatch(
    { mmrs: ratingsA.map((r) => r.mmr), won: aWon, placementsLeft: ratingsA.map((r) => r.placementsLeft) },
    { mmrs: ratingsB.map((r) => r.mmr), won: !aWon, placementsLeft: ratingsB.map((r) => r.placementsLeft) },
    margin,
  );

  await db.$transaction(async (tx) => {
    const apply = async (
      side: typeof A,
      ratings: typeof ratingsA,
      deltas: number[],
      won: boolean,
    ) => {
      for (let i = 0; i < side.length; i++) {
        const r = ratings[i];
        const after = r.mmr + deltas[i];
        await tx.matchPlayer.update({
          where: { id: side[i].id },
          data: { mmrBefore: r.mmr, mmrAfter: after, mmrDelta: deltas[i] },
        });
        await tx.rating.update({
          where: { playerId_mode_season: { playerId: side[i].playerId, mode: match.mode, season: 1 } },
          data: {
            mmr: after,
            peakMmr: Math.max(r.peakMmr, after),
            wins: { increment: won ? 1 : 0 },
            losses: { increment: won ? 0 : 1 },
            streak: won ? Math.max(1, r.streak + 1) : Math.min(-1, r.streak - 1),
            placementsLeft: Math.max(0, r.placementsLeft - 1),
          },
        });
      }
    };
    await apply(A, ratingsA, res.a.deltas, aWon);
    await apply(B, ratingsB, res.b.deltas, !aWon);
    await tx.match.update({
      where: { id: matchId },
      data: { status: "VALIDATED", validatedById: validatorId, validatedAt: new Date(), playedAt: match.playedAt ?? new Date() },
    });
  });

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/admin");
  revalidatePath(`/ladder/${match.mode}`);
}

/** Met un match en litige (avec une note). */
export async function disputeMatch(formData: FormData) {
  const matchId = String(formData.get("matchId"));
  const note = String(formData.get("note") || "Litige ouvert par le staff.");
  await db.match.update({ where: { id: matchId }, data: { status: "DISPUTED", notes: note } });
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/admin");
}

const REPORT_REASONS: Record<string, string> = {
  "mauvais-code": "Join Code erroné / partie introuvable",
  abandon: "Abandon / joueur parti en cours de match",
  absent: "Joueur absent (no-show)",
  triche: "Triche / item banni",
  "conflit-score": "Désaccord sur le score",
  autre: "Autre problème",
};

/**
 * Signalement par un participant : passe le match en litige avec le motif et
 * le pseudo du rapporteur, pour arbitrage staff. (cf. doc §6)
 */
export async function reportMatch(formData: FormData) {
  const me = await getCurrentPlayer();
  if (!me) throw new Error("Aucun pirate connecté");

  const matchId = String(formData.get("matchId"));
  const reason = String(formData.get("reason") || "autre");
  const detail = String(formData.get("detail") || "").trim().slice(0, 500);

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { players: { select: { playerId: true } } },
  });
  if (!match) throw new Error("Match introuvable");
  if (match.status === "VALIDATED" || match.status === "CANCELLED") return;

  // seuls les participants (ou le staff) peuvent signaler
  const isParticipant = match.players.some((p) => p.playerId === me.id);
  const isStaff = me.role === "STAFF" || me.role === "ADMIN";
  if (!isParticipant && !isStaff) return;

  const label = REPORT_REASONS[reason] ?? REPORT_REASONS.autre;
  const note = `Signalé par ${me.handle} — ${label}${detail ? ` : ${detail}` : ""}`;

  await db.match.update({
    where: { id: matchId },
    data: { status: "DISPUTED", notes: note },
  });
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/admin");
}
