import { PrismaClient } from "@prisma/client";
import { computeMatch } from "../src/lib/mmr";
import { MODES } from "../src/lib/modes";

const db = new PrismaClient();

const SEASON = 1;

// Pseudos pirates pour les données de démo.
const HANDLES = [
  ["Blackwater", "FR", 14], ["SaltyJ", "GB", 200], ["LaVeuveRouge", "FR", 320],
  ["KrakenBait", "US", 95], ["Mistral", "FR", 40], ["DocteurBoulet", "BE", 260],
  ["Seraphine", "FR", 8], ["OldTom", "GB", 175], ["Vanille_Corsaire", "FR", 150],
  ["NorthWind", "NO", 210], ["Gribouille", "FR", 110], ["IronHook", "US", 0],
  ["Calypso", "PT", 280], ["TchinTchin", "FR", 50], ["Morgane", "FR", 340],
  ["BilgeRat99", "GB", 130], ["Solfege", "FR", 70], ["RhumBaba", "FR", 25],
  ["Cormoran", "FR", 190], ["LadyAnne", "GB", 300], ["Pamplemousse", "FR", 120],
  ["DeadEyeLuc", "CH", 230], ["Brumaire", "FR", 100], ["Goeland", "FR", 165],
] as const;

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("→ Nettoyage…");
  await db.matchPlayer.deleteMany();
  await db.match.deleteMany();
  await db.rating.deleteMany();
  await db.player.deleteMany();

  console.log("→ Joueurs…");
  const players = [];
  for (let i = 0; i < HANDLES.length; i++) {
    const [handle, country, hue] = HANDLES[i];
    const role = i === 0 ? "ADMIN" : i === 1 ? "STAFF" : "PLAYER";
    const p = await db.player.create({
      data: {
        handle,
        country,
        avatarHue: hue as number,
        role,
        discordId: `seed_${i}`,
        bio:
          i % 3 === 0
            ? "Écume ses adversaires depuis l'Arène. Préfère le canon double-boulet."
            : null,
      },
    });
    players.push(p);
  }

  // Ratings de départ : tout le monde proche de 1500, le MMR se disperse via les matchs.
  console.log("→ Classements de départ…");
  for (const p of players) {
    for (const mode of MODES) {
      const base = 1500 + rand(-40, 40);
      await db.rating.create({
        data: {
          playerId: p.id,
          mode: mode.key,
          season: SEASON,
          mmr: base,
          peakMmr: base,
          wins: 0,
          losses: 0,
          placementsLeft: 5,
        },
      });
    }
  }

  // Génère un historique de matchs validés par mode, recalcule MMR/W-L.
  console.log("→ Historique de matchs…");
  for (const mode of MODES) {
    const matchCount = mode.tier === "principal" ? 60 : 26;
    for (let m = 0; m < matchCount; m++) {
      const size = mode.teamSize;
      const needed = mode.key === "sniper-ffa" ? 6 : size * 2;
      const roster = [...players].sort(() => Math.random() - 0.5).slice(0, needed);

      // pour FFA on traite en "A vs B" simplifié (1er moitié / 2e moitié)
      const teamA = roster.slice(0, Math.ceil(needed / 2));
      const teamB = roster.slice(Math.ceil(needed / 2));

      const ratingsA = await Promise.all(
        teamA.map((p) =>
          db.rating.findUnique({ where: { playerId_mode_season: { playerId: p.id, mode: mode.key, season: SEASON } } }),
        ),
      );
      const ratingsB = await Promise.all(
        teamB.map((p) =>
          db.rating.findUnique({ where: { playerId_mode_season: { playerId: p.id, mode: mode.key, season: SEASON } } }),
        ),
      );
      if (ratingsA.some((r) => !r) || ratingsB.some((r) => !r)) continue;

      const aWon = Math.random() < 0.5;
      const sA = aWon ? 3 : rand(0, 2);
      const sB = aWon ? rand(0, 2) : 3;
      const margin = Math.abs(sA - sB) / 3;

      const res = computeMatch(
        { mmrs: ratingsA.map((r) => r!.mmr), won: aWon, placementsLeft: ratingsA.map((r) => r!.placementsLeft) },
        { mmrs: ratingsB.map((r) => r!.mmr), won: !aWon, placementsLeft: ratingsB.map((r) => r!.placementsLeft) },
        margin,
      );

      const playedAt = new Date(Date.now() - rand(1, 60 * 24) * 60 * 1000 * 60);
      const match = await db.match.create({
        data: {
          mode: mode.key,
          season: SEASON,
          status: "VALIDATED",
          joinCode: Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[rand(0, 30)]).join(""),
          scoreA: sA,
          scoreB: sB,
          winner: aWon ? "A" : "B",
          hostId: pick(players).id,
          validatedById: players[rand(0, 1)].id, // admin ou staff
          proofUrl: "/proof/scoreboard-demo.png",
          playedAt,
          createdAt: playedAt,
          validatedAt: playedAt,
        },
      });

      const applyTeam = async (team: typeof teamA, ratings: typeof ratingsA, deltas: number[], side: string) => {
        for (let i = 0; i < team.length; i++) {
          const r = ratings[i]!;
          const before = r.mmr;
          const after = before + deltas[i];
          await db.matchPlayer.create({
            data: { matchId: match.id, playerId: team[i].id, team: side, mmrBefore: before, mmrAfter: after, mmrDelta: deltas[i] },
          });
          const won = (side === "A") === aWon;
          await db.rating.update({
            where: { playerId_mode_season: { playerId: team[i].id, mode: mode.key, season: SEASON } },
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
      await applyTeam(teamA, ratingsA, res.a.deltas, "A");
      await applyTeam(teamB, ratingsB, res.b.deltas, "B");
    }
  }

  // Quelques matchs en attente de validation (pour la file staff).
  console.log("→ File de validation…");
  const mode = MODES[0];
  for (let i = 0; i < 4; i++) {
    const roster = [...players].sort(() => Math.random() - 0.5).slice(0, 2);
    const aWon = Math.random() < 0.5;
    const match = await db.match.create({
      data: {
        mode: mode.key,
        season: SEASON,
        status: i === 3 ? "DISPUTED" : "AWAITING_VALIDATION",
        joinCode: Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[rand(0, 30)]).join(""),
        scoreA: aWon ? 3 : 2,
        scoreB: aWon ? 2 : 3,
        winner: aWon ? "A" : "B",
        hostId: roster[0].id,
        proofUrl: "/proof/scoreboard-demo.png",
        notes: i === 3 ? "Litige : l'adversaire conteste le dernier coulage (collision vs canon)." : null,
      },
    });
    await db.matchPlayer.create({ data: { matchId: match.id, playerId: roster[0].id, team: "A" } });
    await db.matchPlayer.create({ data: { matchId: match.id, playerId: roster[1].id, team: "B" } });
  }

  const counts = {
    players: await db.player.count(),
    matches: await db.match.count(),
    ratings: await db.rating.count(),
  };
  console.log("✓ Seed terminé :", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
