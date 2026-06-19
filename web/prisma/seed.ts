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

const WEAPONS = ["Eye of Reach", "Flintlock", "Blunderbuss", "Sabre", "Double-boulet"];
const STYLES = [
  "Abordage agressif",
  "Sniper patient",
  "Barreur défensif",
  "Canonnier de précision",
  "Touche-à-tout",
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("→ Nettoyage…");
  await db.chatMessage.deleteMany();
  await db.lobbyMember.deleteMany();
  await db.lobby.deleteMany();
  await db.partyMember.deleteMany();
  await db.party.deleteMany();
  await db.friendship.deleteMany();
  await db.matchPlayer.deleteMany();
  await db.match.deleteMany();
  await db.rating.deleteMany();
  await db.teamMember.deleteMany();
  await db.team.deleteMany();
  await db.event.deleteMany();
  await db.partner.deleteMany();
  await db.modeProposal.deleteMany();
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
        weapon: pick(WEAPONS),
        playStyle: pick(STYLES),
        twitch: i % 4 === 0 ? handle.toLowerCase().replace(/[^a-z0-9]/g, "") : null,
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

  // Équipages : on regroupe les joueurs par paquets, premier = capitaine.
  console.log("→ Équipages…");
  const TEAMS = [
    { name: "Les Écumeurs", tag: "ECU", blurb: "On prend la mer, on prend les têtes.", hue: 40 },
    { name: "Kraken's Maw", tag: "KRK", blurb: "Aspirés dans les profondeurs.", hue: 165 },
    { name: "La Veuve Noire", tag: "VVN", blurb: "Une voile à l'horizon, un naufrage de plus.", hue: 350 },
    { name: "Marée Rouge", tag: "MRE", blurb: "Le pont ne sèche jamais.", hue: 8 },
  ];
  let cursor = 0;
  for (const t of TEAMS) {
    const size = rand(3, 4);
    const roster = players.slice(cursor, cursor + size);
    cursor += size;
    if (roster.length < 2) break;
    const team = await db.team.create({
      data: {
        name: t.name,
        tag: t.tag,
        blurb: t.blurb,
        accentHue: t.hue,
        captainId: roster[0].id,
        members: {
          create: roster.map((p, i) => ({
            playerId: p.id,
            role: i === 0 ? "CAPTAIN" : i === 1 ? "OFFICER" : "MEMBER",
          })),
        },
      },
    });
    void team;
  }

  console.log("→ Événements…");
  const day = 24 * 60 * 60 * 1000;
  await db.event.createMany({
    data: [
      {
        slug: "coupe-des-abysses-1",
        title: "Coupe des Abysses #1",
        mode: "galleon-4v4",
        format: "Double élimination · 8 équipages",
        startsAt: new Date(Date.now() + 7 * day),
        status: "OPEN",
        capacity: 8,
        prize: "1 mois de Nitro × crew + badge Vainqueur S1",
        description:
          "Le premier grand tournoi 4v4 de la saison. Réglages Galleon War imposés, arbitrage staff en direct sur Discord.",
      },
      {
        slug: "soiree-test-sniper",
        title: "Soirée test · Sniper Arena",
        mode: "sniper-ffa",
        format: "FFA tournant · fun",
        startsAt: new Date(Date.now() + 2 * day),
        status: "OPEN",
        capacity: 24,
        prize: "Badge Testeur Alpha",
        description: "On éprouve l'équilibrage du mode Sniper. Retours bienvenus pour ajuster les règles.",
      },
      {
        slug: "ligue-sloop-hiver",
        title: "Ligue Sloop · manche d'ouverture",
        mode: "sloop-2v2",
        format: "Ladder accéléré · 1 soirée",
        startsAt: new Date(Date.now() + 14 * day),
        status: "UPCOMING",
        capacity: 32,
        prize: "Points de ligue + Hall of Fame",
        description: "Première manche de la ligue Sloop 1v1. Chaque victoire compte double pour le classement saisonnier.",
      },
      {
        slug: "showmatch-lancement",
        title: "Showmatch de lancement",
        mode: "brig-3v3",
        format: "Exhibition castée",
        startsAt: new Date(Date.now() - 5 * day),
        status: "DONE",
        prize: "—",
        description: "Le match d'inauguration de la plateforme, casté par nos partenaires Twitch.",
      },
    ],
  });

  console.log("→ Partenaires…");
  await db.partner.createMany({
    data: [
      { slug: "captain-rhea", name: "Captain_Rhea", twitchUrl: "https://twitch.tv/captain_rhea", tagline: "Casts compétitifs & coaching naval.", avatarHue: 280, tier: "AMBASSADEUR", live: true },
      { slug: "le-bosco", name: "LeBosco", twitchUrl: "https://twitch.tv/lebosco", tagline: "Soirées Custom Seas tous les jeudis.", avatarHue: 200, tier: "PARTNER", live: false },
      { slug: "saltyqueen", name: "SaltyQueen", twitchUrl: "https://twitch.tv/saltyqueen", tagline: "Sniper main, clips & highlights.", avatarHue: 330, tier: "PARTNER", live: false },
      { slug: "vieux-tom", name: "VieuxTom", twitchUrl: "https://twitch.tv/vieuxtom", tagline: "Analyses tactiques de galions.", avatarHue: 45, tier: "PARTNER", live: false },
    ],
  });

  console.log("→ Propositions de modes…");
  await db.modeProposal.createMany({
    data: [
      { name: "Capture du Fort", format: "4v4 · contrôle de zone", pitch: "Un fort au centre, l'équipage qui le tient le plus longtemps gagne. Mélange PvP et tenue de position.", proposerHandle: "Mistral", votes: 12, status: "TESTING" },
      { name: "Course aux Voiles", format: "2v2 · régate armée", pitch: "Parcours de bouées à franchir, tir autorisé. Le premier à boucler trois tours l'emporte.", proposerHandle: "NorthWind", votes: 7, status: "PENDING" },
      { name: "Dernier à flot", format: "FFA · battle royale naval", pitch: "Six sloops, zone qui rétrécit, dernier équipage à flot gagne.", proposerHandle: "Calypso", votes: 21, status: "PENDING" },
    ],
  });

  // Amitiés : le joueur par défaut (players[0], ADMIN) est lié à plusieurs pirates.
  console.log("→ Amitiés…");
  const me = players[0];
  // amis acceptés
  for (let i = 1; i <= 5; i++) {
    await db.friendship.create({
      data: { requesterId: me.id, addresseeId: players[i].id, status: "ACCEPTED" },
    });
  }
  // demandes reçues en attente
  for (let i = 6; i <= 7; i++) {
    await db.friendship.create({
      data: { requesterId: players[i].id, addresseeId: me.id, status: "PENDING" },
    });
  }
  // quelques amitiés entre autres pirates
  await db.friendship.create({ data: { requesterId: players[2].id, addresseeId: players[3].id, status: "ACCEPTED" } });
  await db.friendship.create({ data: { requesterId: players[4].id, addresseeId: players[8].id, status: "ACCEPTED" } });

  // Un groupe mené par le joueur par défaut, avec deux amis.
  console.log("→ Groupe de démo…");
  await db.party.create({
    data: {
      leaderId: me.id,
      mode: "brig-3v3",
      members: { create: [{ playerId: me.id }, { playerId: players[1].id }] },
    },
  });

  // Chat : un canal global animé + un DM avec un ami.
  console.log("→ Chat…");
  const dm = [me.id, players[1].id].sort().join("__");
  const now = Date.now();
  await db.chatMessage.createMany({
    data: [
      { channelType: "GLOBAL", channelKey: "global", authorId: players[2].id, body: "gg les abysses, qui fait du sloop ce soir ?", createdAt: new Date(now - 60 * 60000) },
      { channelType: "GLOBAL", channelKey: "global", authorId: players[5].id, body: "moi chaud, ping en file", createdAt: new Date(now - 55 * 60000) },
      { channelType: "GLOBAL", channelKey: "global", authorId: players[3].id, body: "la coupe des abysses approche, on monte un crew ?", createdAt: new Date(now - 20 * 60000) },
      { channelType: "DM", channelKey: dm, authorId: players[1].id, body: "salut ! on lance une brig ?", createdAt: new Date(now - 10 * 60000) },
      { channelType: "DM", channelKey: dm, authorId: me.id, body: "ouais je crée le groupe, je t'ajoute", createdAt: new Date(now - 9 * 60000) },
    ],
  });

  const counts = {
    players: await db.player.count(),
    matches: await db.match.count(),
    ratings: await db.rating.count(),
    teams: await db.team.count(),
    events: await db.event.count(),
    partners: await db.partner.count(),
    friendships: await db.friendship.count(),
    chatMessages: await db.chatMessage.count(),
  };
  console.log("✓ Seed terminé :", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
