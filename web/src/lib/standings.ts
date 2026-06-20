// Classement des équipages pour une saison donnée.
// MMR d'équipe = moyenne des meilleurs MMR de ses membres (tous modes) sur la
// saison ; une équipe sans membre classé est "non classée" (reléguée en bas).

import { db } from "./db";

export type TeamStanding = {
  id: string;
  name: string;
  tag: string;
  accentHue: number;
  blurb: string | null;
  captainHandle: string;
  mmr: number | null; // null = non classée
  wins: number;
  losses: number;
  memberCount: number;
  members: { id: string; handle: string; avatarHue: number }[];
};

export async function teamStandings(season: number): Promise<TeamStanding[]> {
  const teams = await db.team.findMany({
    include: {
      captain: { select: { handle: true } },
      members: { include: { player: { include: { ratings: { where: { season } } } } } },
    },
  });

  const standings: TeamStanding[] = teams.map((t) => {
    let wins = 0;
    let losses = 0;
    const bests: number[] = [];
    for (const m of t.members) {
      let best = 0;
      for (const r of m.player.ratings) {
        best = Math.max(best, r.mmr);
        wins += r.wins;
        losses += r.losses;
      }
      if (best > 0) bests.push(best);
    }
    const mmr = bests.length ? Math.round(bests.reduce((a, b) => a + b, 0) / bests.length) : null;
    return {
      id: t.id,
      name: t.name,
      tag: t.tag,
      accentHue: t.accentHue,
      blurb: t.blurb,
      captainHandle: t.captain.handle,
      mmr,
      wins,
      losses,
      memberCount: t.members.length,
      members: t.members.map((m) => ({
        id: m.player.id,
        handle: m.player.handle,
        avatarHue: m.player.avatarHue,
      })),
    };
  });

  standings.sort((a, b) => {
    if (a.mmr === null && b.mmr === null) return b.wins - a.wins;
    if (a.mmr === null) return 1;
    if (b.mmr === null) return -1;
    return b.mmr - a.mmr;
  });
  return standings;
}
