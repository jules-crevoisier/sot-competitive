import Link from "next/link";
import { db } from "@/lib/db";
import { MODES } from "@/lib/modes";
import { rankForMmr } from "@/lib/ranks";
import { CompassRose, ShipWheel, Flag, WaveDivider, DiscordMark } from "@/components/icons";
import { ModeCard } from "@/components/mode-card";
import { PirateAvatar } from "@/components/pirate-avatar";
import { flag, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [topRatings, modeCounts, recentMatches, totals] = await Promise.all([
    db.rating.findMany({
      where: { mode: "sloop-2v2", season: 1 },
      orderBy: { mmr: "desc" },
      take: 5,
      include: { player: true },
    }),
    db.rating.groupBy({ by: ["mode"], where: { season: 1 }, _count: true }),
    db.match.findMany({
      where: { status: "VALIDATED" },
      orderBy: { playedAt: "desc" },
      take: 4,
      include: { players: { include: { player: true } } },
    }),
    Promise.all([db.player.count(), db.match.count({ where: { status: "VALIDATED" } })]),
  ]);

  const counts = Object.fromEntries(modeCounts.map((m) => [m.mode, m._count]));
  const [playerCount, matchCount] = totals;

  return (
    <div className="content-layer">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] text-brass">
          <div className="absolute left-1/2 top-10 -translate-x-1/2">
            <CompassRose width={520} height={520} />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center">
          <p className="seal mb-5">Sea of Thieves · Saison 20 · Custom Seas</p>
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-black leading-[1.05] text-bone text-shadow-deep sm:text-7xl">
            La mer a enfin
            <span className="block text-brass">son classement.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-fog">
            File d&apos;attente, tables équilibrées, réglages imposés, validation des résultats et
            MMR — le tout hors-jeu, sur le mode Custom Seas. Inspiré de ce que la communauté Mario
            Kart a bâti, taillé pour la piraterie.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/play" className="btn-brass text-base">
              <ShipWheel width={18} height={18} /> Rejoindre une file
            </Link>
            <Link href="/modes" className="btn-ghost text-base">
              Voir les modes &amp; règles
            </Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-sm border border-brass/20 bg-brass/10">
            {[
              { k: playerCount, l: "Pirates classés" },
              { k: matchCount, l: "Matchs validés" },
              { k: MODES.filter((m) => m.tier === "principal").length, l: "Ladders principaux" },
            ].map((s) => (
              <div key={s.l} className="bg-[#0b1b26] px-4 py-5">
                <div className="stat-num text-3xl font-bold text-brass">{s.k}</div>
                <div className="mt-1 font-display text-[0.6rem] uppercase tracking-widest text-fog">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-verdigris-deep">
          <WaveDivider className="h-6 w-full" />
        </div>
      </section>

      {/* ============ COMMENT ÇA MARCHE ============ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle kicker="Le rituel" title="De la file au classement" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "I",
              t: "On entre dans la file",
              d: "Tu rejoins la file du mode voulu. Dès qu'il y a assez de pirates, une table se forme et les équipages sont tirés au sort.",
            },
            {
              n: "II",
              t: "On crée la session",
              d: "Le Host ouvre une session Custom Seas avec le preset imposé et publie le Join Code à 5 caractères. Tout le monde rejoint et vérifie les Switches.",
            },
            {
              n: "III",
              t: "On valide & on note",
              d: "Capture du Scoreboard final, résultat soumis et confirmé par les deux camps (ou un arbitre). Le MMR est recalculé, le ladder bouge.",
            },
          ].map((s) => (
            <div key={s.n} className="plank plank-bracket relative p-6">
              <div className="font-display text-5xl font-black text-brass/30">{s.n}</div>
              <h3 className="mt-2 font-display text-lg text-bone">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ MODES ============ */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between">
          <SectionTitle kicker="Champs de bataille" title="Les ladders" />
          <Link href="/modes" className="hidden font-display text-xs uppercase tracking-widest text-brass hover:text-brass-bright sm:block">
            Tous les réglages →
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m) => (
            <ModeCard key={m.key} mode={m} players={counts[m.key] ?? 0} />
          ))}
        </div>
      </section>

      {/* ============ TOP + MATCHS ============ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle kicker="Sloop Duel 1v1" title="La crème des corsaires" />
            <div className="plank mt-6 divide-y divide-brass/10">
              {topRatings.map((r, i) => {
                const rank = rankForMmr(r.mmr);
                return (
                  <Link
                    key={r.id}
                    href={`/players/${r.playerId}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brass/5"
                  >
                    <span className="w-6 text-center font-display text-lg font-bold text-brass/60">
                      {i + 1}
                    </span>
                    <PirateAvatar handle={r.player.handle} hue={r.player.avatarHue} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-bone">
                        {flag(r.player.country)} {r.player.handle}
                      </div>
                      <div className="text-xs" style={{ color: rank.color }}>
                        {rank.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="stat-num text-lg font-bold text-brass">{r.mmr}</div>
                      <div className="text-xs text-fog">{r.wins}V · {r.losses}D</div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/ladder/sloop-2v2" className="mt-4 inline-block font-display text-xs uppercase tracking-widest text-brass hover:text-brass-bright">
              Voir tout le classement →
            </Link>
          </div>

          <div>
            <SectionTitle kicker="Journal de bord" title="Derniers combats" />
            <div className="mt-6 space-y-3">
              {recentMatches.map((m) => {
                const A = m.players.filter((p) => p.team === "A");
                const B = m.players.filter((p) => p.team === "B");
                const mode = MODES.find((x) => x.key === m.mode);
                const aWon = m.winner === "A";
                return (
                  <Link key={m.id} href={`/matches/${m.id}`} className="plank block px-4 py-3 transition-colors hover:bg-brass/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-display uppercase tracking-widest text-brass">{mode?.name}</span>
                      <span className="text-fog">{timeAgo(m.playedAt)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <CrewMini players={A} won={aWon} align="left" />
                      <div className="stat-num shrink-0 px-2 text-center">
                        <span className={aWon ? "text-brass" : "text-fog"}>{m.scoreA}</span>
                        <span className="px-1 text-fog-deep">—</span>
                        <span className={!aWon ? "text-brass" : "text-fog"}>{m.scoreB}</span>
                      </div>
                      <CrewMini players={B} won={!aWon} align="right" />
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/matches" className="mt-4 inline-block font-display text-xs uppercase tracking-widest text-brass hover:text-brass-bright">
              Tout le journal →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ DISCORD ============ */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="parchment relative overflow-hidden p-8 sm:p-10">
          <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div style={{ color: "#3a2c12" }}>
              <Flag width={56} height={56} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-2xl font-bold" style={{ color: "#2a1d06" }}>
                Bientôt : tout depuis Discord
              </h3>
              <p className="mt-2 max-w-2xl" style={{ color: "#4a3a1c" }}>
                Files d&apos;attente, formation des tables, publication du Join Code et report des
                résultats directement dans ton serveur. La plateforme web est pensée pour brancher le
                bot dès qu&apos;il est prêt.
              </p>
            </div>
            <button className="btn-brass shrink-0" style={{ background: "linear-gradient(180deg,#5865F2,#404abf)", color: "#fff", borderColor: "#2b317d" }}>
              <DiscordMark width={16} height={16} /> Rejoindre le Discord
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="seal">{kicker}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-bone">{title}</h2>
      <div className="rope-rule mt-3 w-24" />
    </div>
  );
}

function CrewMini({
  players,
  won,
  align,
}: {
  players: { player: { handle: string; avatarHue: number } }[];
  won: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <div className="flex -space-x-2">
        {players.slice(0, 3).map((p, i) => (
          <PirateAvatar key={i} handle={p.player.handle} hue={p.player.avatarHue} size={26} />
        ))}
      </div>
      <span className={`truncate text-sm ${won ? "text-bone" : "text-fog"}`}>
        {players.map((p) => p.player.handle).join(", ")}
      </span>
    </div>
  );
}
